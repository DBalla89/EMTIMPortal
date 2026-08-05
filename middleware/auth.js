// backend/middleware/auth.js
// Middleware JWT per proteggere le route che richiedono autenticazione.
// Il token viene letto dall'header Authorization: Bearer <token>

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET non definito nelle variabili d\'ambiente.');
}

/**
 * Middleware che verifica il token JWT.
 * Se valido, popola req.user = { id, email, full_name }.
 * Altrimenti risponde con 401.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticazione richiesta.' });
  }

  const token = authHeader.slice(7); // rimuove "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      full_name: payload.full_name,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessione scaduta. Effettua nuovamente il login.' });
    }
    return res.status(401).json({ error: 'Token non valido.' });
  }
}

/**
 * Middleware opzionale: se il token è presente e valido lo decodifica,
 * altrimenti lascia passare senza errore. Utile per route pubbliche che
 * mostrano comportamenti diversi a utenti loggati.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = { id: payload.sub, email: payload.email, full_name: payload.full_name };
    } catch {
      // token non valido → ignora, req.user resterà undefined
    }
  }
  next();
}

/**
 * Helper: crea un JWT firmato con scadenza 7 giorni.
 */
function signToken(user) {
  return jwt.sign(
    { email: user.email, full_name: user.full_name },
    JWT_SECRET,
    { subject: user.id, expiresIn: '7d' }
  );
}

module.exports = { requireAuth, optionalAuth, signToken };
