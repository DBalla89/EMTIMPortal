// backend/routes/proposals.js
const express = require('express');
const multer = require('multer');
const slugify = require('slugify');
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// ─── Supabase Storage ─────────────────────────────────────────────────────────
// Usa la service role key (NON la anon key) per bypassare le RLS policy sullo storage
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = 'proposal-documents';

// Upload in memoria → poi caricato su Supabase Storage (max 10MB, solo PDF)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Il documento allegato deve essere un file PDF.'));
    }
    cb(null, true);
  },
});

/**
 * Carica un PDF su Supabase Storage e restituisce l'URL pubblico.
 * Path: proposals/<userId>/<timestamp>-<sanitized_filename>
 */
async function uploadPdfToStorage(file, userId) {
  const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `proposals/${userId}/${Date.now()}-${safeFilename}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file.buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    console.error('[storage] Errore upload PDF:', error);
    throw new Error('Impossibile caricare il documento. Riprova più tardi.');
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return { pdfUrl: data.publicUrl, pdfPath: path };
}

// ─── GET /api/proposals — bacheca pubblica (con filtri e paginazione) ─────────
router.get('/proposals', optionalAuth, async (req, res, next) => {
  try {
    const { category, q, page = 1, pageSize = 12 } = req.query;
    const conditions = [`p.status = 'published'`];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`p.category = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(
        `(p.title ILIKE $${params.length} OR p.summary ILIKE $${params.length} OR p.description ILIKE $${params.length})`
      );
    }

    const offset = (Number(page) - 1) * Number(pageSize);
    params.push(Number(pageSize), offset);

    const [proposalsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT p.id, p.title, p.slug, p.summary, p.category, p.status,
                p.positions_available, p.created_at,
                u.full_name AS creator_name, u.avatar_url AS creator_avatar,
                (SELECT COUNT(*) FROM applications a
                   WHERE a.proposal_id = p.id AND a.status = 'pending') AS pending_applications
         FROM proposals p
         JOIN users u ON u.id = p.creator_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY p.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM proposals p WHERE ${conditions.join(' AND ')}`,
        params.slice(0, -2)
      ),
    ]);

    res.json({
      proposals: proposalsRes.rows,
      total: Number(countRes.rows[0].count),
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/proposals/creator/list — proposte del creatore loggato ──────────
// NOTA: usando /creator/list invece di /mine/created evitiamo qualsiasi ambiguità
// con la route /:slug (Express potrebbe interpretare 'mine' come uno slug).
router.get('/proposals/creator/list', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM applications a WHERE a.proposal_id = p.id AND a.status='pending')  AS pending_count,
              (SELECT COUNT(*) FROM applications a WHERE a.proposal_id = p.id AND a.status='accepted') AS accepted_count
       FROM proposals p
       WHERE p.creator_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ proposals: result.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/proposals/:slug — dettaglio pubblico ────────────────────────────
router.get('/proposals/:slug', optionalAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.full_name AS creator_name, u.avatar_url AS creator_avatar,
              u.headline AS creator_headline
       FROM proposals p
       JOIN users u ON u.id = p.creator_id
       WHERE p.slug = $1`,
      [req.params.slug]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Proposta non trovata.' });

    const proposal = result.rows[0];
    let myApplication = null;

    // Se l'utente è autenticato, recupera la sua candidatura per questa proposta
    if (req.user) {
      const appRes = await pool.query(
        `SELECT id, status, message, created_at FROM applications
         WHERE proposal_id = $1 AND applicant_id = $2`,
        [proposal.id, req.user.id]
      );
      myApplication = appRes.rows[0] || null;
    }

    res.json({ proposal, myApplication });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/proposals — crea una nuova proposta ────────────────────────────
router.post('/proposals', requireAuth, upload.single('document'), async (req, res, next) => {
  try {
    const { title, summary, description, category, positionsAvailable = 1 } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Titolo e descrizione sono obbligatori.' });
    }
    if (!req.file) {
      return res.status(400).json({
        error: 'È obbligatorio allegare un documento PDF di presentazione.',
      });
    }

    const { pdfUrl } = await uploadPdfToStorage(req.file, req.user.id);

    // Genera uno slug univoco: <titolo-slugificato>-<timestamp base36>
    const slug = `${slugify(title, { lower: true, strict: true })}-${Date.now().toString(36)}`;

    const result = await pool.query(
      `INSERT INTO proposals
         (creator_id, title, slug, summary, description, category,
          positions_available, pdf_url, pdf_filename, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published')
       RETURNING *`,
      [
        req.user.id,
        title.trim(),
        slug,
        summary?.trim() || null,
        description.trim(),
        category?.trim() || null,
        Number(positionsAvailable),
        pdfUrl,
        req.file.originalname,
      ]
    );

    res.status(201).json({ proposal: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/proposals/:id/close — chiude una proposta ────────────────────
router.patch('/proposals/:id/close', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE proposals SET status = 'closed'
       WHERE id = $1 AND creator_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Proposta non trovata o non sei il creatore.' });
    }
    res.json({ proposal: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
