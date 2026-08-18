// backend/routes/applications.js
const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const {
  submitApplication,
  acceptApplication,
  rejectApplication,
  ApplicationError,
} = require('../services/applicationService');

const router = express.Router();

// Wrapper per convertire ApplicationError in risposte HTTP corrette
function handle(err, res, next) {
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  next(err);
}

// POST /api/proposals/:proposalId/applications — invia candidatura
router.post('/proposals/:proposalId/applications', requireAuth, async (req, res, next) => {
  try {
    const application = await submitApplication({
      proposalId: req.params.proposalId,
      applicantId: req.user.id,
      message: req.body.message,
    });
    res.status(201).json({ application });
  } catch (err) {
    handle(err, res, next);
  }
});

// GET /api/me/applications — tutte le candidature inviate dall'utente loggato
router.get('/me/applications', requireAuth, async (req, res, next) => {
  try {
    console.log('[applications] GET /me/applications - utente:', req.user.id);
    const result = await pool.query(
      `SELECT a.*, p.title AS proposal_title, p.slug AS proposal_slug
       FROM applications a
       JOIN proposals p ON p.id = a.proposal_id
       WHERE a.applicant_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    console.log('[applications] trovate:', result.rowCount, 'candidature per utente', req.user.id);
    res.json({ applications: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/proposals/:proposalId/applications — elenco candidati (solo creatore)
router.get('/proposals/:proposalId/applications', requireAuth, async (req, res, next) => {
  try {
    console.log('[applications] GET /proposals/:proposalId/applications - proposalId:', req.params.proposalId, '- utente:', req.user.id);
    const proposalRes = await pool.query(`SELECT creator_id FROM proposals WHERE id = $1`, [
      req.params.proposalId,
    ]);
    if (proposalRes.rowCount === 0) return res.status(404).json({ error: 'Proposta non trovata.' });
    if (proposalRes.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Non sei autorizzato a vedere questi candidati.' });
    }

    const result = await pool.query(
      `SELECT a.id, a.status, a.message, a.created_at, a.decided_at,
              u.id AS applicant_id, u.full_name, u.headline, u.avatar_url
       FROM applications a
       JOIN users u ON u.id = a.applicant_id
       WHERE a.proposal_id = $1
       ORDER BY a.created_at ASC`,
      [req.params.proposalId]
    );
    console.log('[applications] trovati:', result.rowCount, 'candidati per proposta', req.params.proposalId);
    res.json({ applications: result.rows });
  } catch (err) {
    next(err);
  }
});


// PATCH /api/applications/:id/accept — REGOLA CRITICA (vedi applicationService)
router.patch('/applications/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const result = await acceptApplication(req.params.id, req.user.id);
    res.json({
      message: 'Candidato accettato.',
      ...result,
    });
  } catch (err) {
    handle(err, res, next);
  }
});

// PATCH /api/applications/:id/reject
router.patch('/applications/:id/reject', requireAuth, async (req, res, next) => {
  try {
    const result = await rejectApplication(req.params.id, req.user.id);
    res.json({ message: 'Candidatura rifiutata.', ...result });
  } catch (err) {
    handle(err, res, next);
  }
});

module.exports = router;
