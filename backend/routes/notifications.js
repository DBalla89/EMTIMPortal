// backend/routes/notifications.js
const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { listNotifications, markAsRead } = require('../services/notificationService');

const router = express.Router();

// GET /api/notifications?unread=true
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await listNotifications(pool, req.user.id, {
      unreadOnly: req.query.unread === 'true',
    });
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await markAsRead(pool, req.params.id, req.user.id);
    if (!notification) return res.status(404).json({ error: 'Notifica non trovata.' });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
