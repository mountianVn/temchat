const express = require('express');
const { body, validationResult } = require('express-validator');
const { get, run, all } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = all(`
      SELECT
        c.id,
        c.user1_id,
        c.user2_id,
        c.created_at,
        CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS other_user_id
      FROM conversations c
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.created_at DESC
    `, [userId, userId, userId]);

    const result = conversations.map(conv => {
      const lastMsg = get(`
        SELECT content, created_at FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC LIMIT 1
      `, [conv.id]);

      const unread = get(`
        SELECT COUNT(*) as count FROM messages
        WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
      `, [conv.id, userId]);

      const otherUser = get(
        'SELECT id, username, display_name, avatar, role, status FROM users WHERE id = ?',
        [conv.other_user_id]
      );

      return {
        id: conv.id,
        type: 'direct',
        name: otherUser?.display_name || 'Unknown',
        avatar: otherUser?.avatar,
        username: otherUser?.username,
        role: otherUser?.role,
        status: otherUser?.status,
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.created_at || null,
        unreadCount: unread?.count || 0,
        createdAt: conv.created_at,
      };
    });

    result.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    res.json(result);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

router.get('/:id/messages', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user.id;

    const conv = get('SELECT * FROM conversations WHERE id = ?', [id]);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conv.user1_id !== userId && conv.user2_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT m.*, u.username, u.display_name, u.avatar, u.role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
    `;

    const params = [id];

    if (before) {
      query += ' AND m.created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const messages = all(query, params).reverse();
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

router.post('/', authMiddleware,
  [
    body('userId').isInt(),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { userId } = req.body;
      const myId = req.user.id;

      if (userId === myId) {
        return res.status(400).json({ error: 'Cannot create conversation with yourself' });
      }

      const otherUser = get('SELECT id FROM users WHERE id = ?', [userId]);
      if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      let conv = get(`
        SELECT * FROM conversations
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `, [myId, userId, userId, myId]);

      if (!conv) {
        const result = run('INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)', [myId, userId]);
        conv = get('SELECT * FROM conversations WHERE id = ?', [result.lastInsertRowid]);
      }

      const user = get('SELECT id, username, display_name, avatar, role, status FROM users WHERE id = ?', [userId]);

      res.json({
        id: conv.id,
        type: 'direct',
        name: user.display_name,
        avatar: user.avatar,
        username: user.username,
        role: user.role,
        status: user.status,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
        createdAt: conv.created_at,
      });
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  }
);

router.post('/:id/read', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    run(`
      UPDATE messages
      SET read_at = datetime('now')
      WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
    `, [id, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

module.exports = router;
