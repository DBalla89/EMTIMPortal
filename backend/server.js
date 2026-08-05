// backend/server.js
// Entry point del server Express per il portale Project Work EMTIM XVIII

'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const proposalsRouter = require('./routes/proposals');
const applicationsRouter = require('./routes/applications');
const notificationsRouter = require('./routes/notifications');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permetti richieste senza origin (Postman, server-to-server)
      if (!origin) return callback(null, true);
      
      // Permetti se in lista, se finisce per .vercel.app o in dev mode
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      
      callback(new Error(`CORS policy: origine non permessa: ${origin}`));
    },
    credentials: true,
  })
);

// ─── Rate limiting globale ────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra qualche minuto.' },
});
app.use(globalLimiter);

// Rate limiter più stretto sugli endpoint di autenticazione
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Troppi tentativi di accesso. Riprova tra 15 minuti.' },
});

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api', proposalsRouter);
app.use('/api', applicationsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check per Render
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── Error handler globale ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status < 500 ? err.message : 'Errore interno del server.',
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Project Work EMTIM XVIII Backend listening on port ${PORT}`);
});

module.exports = app; // per i test
