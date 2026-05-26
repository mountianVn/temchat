const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { get, run, all } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'files');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-zip-compressed',
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { conversation_id, group_id, content } = req.body;
    const senderId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Message content required' });
    }

    if (conversation_id) {
      const conv = get('SELECT * FROM conversations WHERE id = ?', [conversation_id]);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });
      if (conv.user1_id !== senderId && conv.user2_id !== senderId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (group_id) {
      const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group_id, senderId]);
      if (!member) return res.status(403).json({ error: 'Not a member of this group' });
    }

    const result = run(
      `INSERT INTO messages (conversation_id, group_id, sender_id, content) VALUES (?, ?, ?, ?)`,
      [conversation_id || null, group_id || null, senderId, content]
    );

    const message = get(`
      SELECT m.*, u.username, u.display_name, u.avatar, u.role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.lastInsertRowid]);

    const io = req.app.get('io');
    if (io) {
      if (conversation_id) io.to(`conversation:${conversation_id}`).emit('new_message', message);
      if (group_id) io.to(`group:${group_id}`).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.post('/file', authMiddleware, upload.array('files', 5), (req, res) => {
  try {
    const { conversation_id, group_id, content } = req.body;
    const senderId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (conversation_id) {
      const conv = get('SELECT * FROM conversations WHERE id = ?', [conversation_id]);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    }

    if (group_id) {
      const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group_id, senderId]);
      if (!member) return res.status(403).json({ error: 'Not a member of this group' });
    }

    const messages = req.files.map(file => {
      const result = run(
        `INSERT INTO messages (conversation_id, group_id, sender_id, content, file_url, file_type, file_name) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [conversation_id || null, group_id || null, senderId, content || '', `/uploads/files/${file.filename}`, file.mimetype, file.originalname]
      );

      return get(`
        SELECT m.*, u.username, u.display_name, u.avatar, u.role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `, [result.lastInsertRowid]);
    });

    const io = req.app.get('io');
    if (io) {
      messages.forEach(message => {
        if (conversation_id) io.to(`conversation:${conversation_id}`).emit('new_message', message);
        if (group_id) io.to(`group:${group_id}`).emit('new_message', message);
      });
    }

    res.status(201).json(messages);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

router.put('/:id/pin', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { group_id } = req.body;
    const userId = req.user.id;

    const message = get('SELECT * FROM messages WHERE id = ?', [id]);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group_id, userId]);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can pin messages' });
    }

    const existing = get('SELECT * FROM pinned_messages WHERE message_id = ? AND group_id = ?', [id, group_id]);
    if (existing) {
      run('DELETE FROM pinned_messages WHERE id = ?', [existing.id]);
      run('UPDATE messages SET is_pinned = 0 WHERE id = ?', [id]);
      return res.json({ pinned: false });
    } else {
      run('INSERT INTO pinned_messages (message_id, group_id, pinned_by) VALUES (?, ?, ?)', [id, group_id, userId]);
      run('UPDATE messages SET is_pinned = 1 WHERE id = ?', [id]);
      return res.json({ pinned: true });
    }
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({ error: 'Failed to pin message' });
  }
});

router.get('/pinned/:groupId', authMiddleware, (req, res) => {
  try {
    const { groupId } = req.params;

    const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, req.user.id]);
    if (!member) return res.status(403).json({ error: 'Not a member of this group' });

    const pinned = all(`
      SELECT m.*, u.username, u.display_name, u.avatar, u.role,
             pm.pinned_at, pm.pinned_by,
             pu.display_name as pinned_by_name
      FROM pinned_messages pm
      JOIN messages m ON pm.message_id = m.id
      JOIN users u ON m.sender_id = u.id
      JOIN users pu ON pm.pinned_by = pu.id
      WHERE pm.group_id = ?
      ORDER BY pm.pinned_at DESC
    `, [groupId]);

    res.json(pinned);
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({ error: 'Failed to get pinned messages' });
  }
});

module.exports = router;
