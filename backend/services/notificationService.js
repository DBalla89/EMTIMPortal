// backend/services/notificationService.js
//
// Inserimento notifiche. Accetta un `client` di transazione così le notifiche
// vengono create nella STESSA transazione dell'azione che le genera: se
// qualcosa fallisce, va tutto in rollback insieme (niente notifiche orfane).

async function createNotification(
  client,
  { userId, type, title, body, relatedProposalId = null, relatedApplicationId = null }
) {
  await client.query(
    `INSERT INTO notifications
       (user_id, type, title, body, related_proposal_id, related_application_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, type, title, body, relatedProposalId, relatedApplicationId]
  );
}

async function listNotifications(pool, userId, { unreadOnly = false } = {}) {
  const res = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1 ${unreadOnly ? 'AND read_at IS NULL' : ''}
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return res.rows;
}

async function markAsRead(pool, notificationId, userId) {
  const res = await pool.query(
    `UPDATE notifications SET read_at = now()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING *`,
    [notificationId, userId]
  );
  return res.rows[0] || null;
}

module.exports = { createNotification, listNotifications, markAsRead };
