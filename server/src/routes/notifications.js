const express = require('express');
const { get, run, all } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const notifications = all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

router.get('/unread-count', authMiddleware, (req, res) => {
  try {
    const result = get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ count: result?.count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

router.put('/:id/read', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const notif = get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.put('/read-all', authMiddleware, (req, res) => {
  try {
    run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const notif = get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    run('DELETE FROM notifications WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
