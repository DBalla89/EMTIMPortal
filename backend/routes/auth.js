// backend/routes/auth.js
// Autenticazione: registrazione, login, profilo utente corrente.
// Utilizza bcryptjs per l'hashing delle password e JWT per le sessioni.

const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { requireAuth, signToken } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, full_name, headline } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password e nome completo sono obbligatori.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La password deve contenere almeno 8 caratteri.' });
    }

    // Controlla se l'email è già registrata
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email già registrata. Prova ad effettuare il login.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, headline)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, headline, avatar_url, created_at`,
      [email.toLowerCase().trim(), password_hash, full_name.trim(), headline?.trim() || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        headline: user.headline,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono obbligatori.' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, headline, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rowCount === 0) {
      // Risposta generica per non rivelare se l'email esiste
      return res.status(401).json({ error: 'Credenziali non valide.' });
    }

    const user = result.rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenziali non valide.' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        headline: user.headline,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, headline, bio, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────
// Aggiorna il profilo dell'utente autenticato (headline, bio)
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { full_name, headline, bio } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE(NULLIF($1, ''), full_name),
           headline  = COALESCE($2, headline),
           bio       = COALESCE($3, bio)
       WHERE id = $4
       RETURNING id, email, full_name, headline, bio, avatar_url`,
      [full_name?.trim() || null, headline?.trim() || null, bio?.trim() || null, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
