const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { get, run, all } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'group-avatars');
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;

    const groups = all(`
      SELECT g.*, gm.role as my_role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY g.created_at DESC
    `, [userId]);

    const result = groups.map(g => {
      const lastMsg = get(`
        SELECT content, created_at FROM messages
        WHERE group_id = ?
        ORDER BY created_at DESC LIMIT 1
      `, [g.id]);

      return {
        id: g.id,
        name: g.name,
        avatar: g.avatar,
        description: g.description,
        myRole: g.my_role,
        memberCount: g.member_count,
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.created_at || null,
        createdAt: g.created_at,
      };
    });

    result.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    res.json(result);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

router.post('/', authMiddleware,
  [
    body('name').isLength({ min: 1, max: 50 }),
    body('memberIds').isArray({ min: 1 }),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { name, description, memberIds } = req.body;
      const userId = req.user.id;

      const uniqueMembers = [...new Set([...memberIds, userId])];

      const result = run(
        'INSERT INTO groups (name, description, created_by) VALUES (?, ?, ?)',
        [name, description || '', userId]
      );
      const groupId = result.lastInsertRowid;

      for (const mid of uniqueMembers) {
        run('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
          [groupId, mid, mid === userId ? 'admin' : 'member']);
      }

      const members = all(`
        SELECT u.id, u.username, u.display_name, u.avatar, u.role, u.status, gm.role as member_role
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
      `, [groupId]);

      const group = get('SELECT * FROM groups WHERE id = ?', [groupId]);

      res.status(201).json({ ...group, members });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ error: 'Failed to create group' });
    }
  }
);

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
    if (!member) return res.status(403).json({ error: 'Not a member of this group' });

    const group = get('SELECT * FROM groups WHERE id = ?', [id]);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const members = all(`
      SELECT u.id, u.username, u.display_name, u.avatar, u.role, u.status, u.bio,
             gm.role as member_role, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.role DESC, u.display_name ASC
    `, [id]);

    res.json({ ...group, members, myRole: member.role });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to get group' });
  }
});

router.get('/:id/messages', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user.id;

    const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
    if (!member) return res.status(403).json({ error: 'Not a member of this group' });

    let query = `
      SELECT m.*, u.username, u.display_name, u.avatar, u.role,
             (SELECT COUNT(*) FROM pinned_messages WHERE message_id = m.id AND group_id = ?) as is_pinned
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = ?
    `;

    const params = [id, id];

    if (before) {
      query += ' AND m.created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const messages = all(query, params).reverse();
    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

router.put('/:id', authMiddleware,
  [
    body('name').optional().isLength({ min: 1, max: 50 }),
    body('description').optional().isLength({ max: 200 }),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { id } = req.params;
      const { name, description } = req.body;
      const userId = req.user.id;

      const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
      if (!member || member.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update the group' });
      }

      const updates = [];
      const params = [];
      if (name !== undefined) { updates.push('name = ?'); params.push(name); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(id);
      run(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`, params);

      const group = get('SELECT * FROM groups WHERE id = ?', [id]);
      const io = req.app.get('io');
      if (io) io.to(`group:${id}`).emit('group_updated', group);

      res.json(group);
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({ error: 'Failed to update group' });
    }
  }
);

router.post('/:id/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change avatar' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/group-avatars/${req.file.filename}`;
    run('UPDATE groups SET avatar = ? WHERE id = ?', [avatarUrl, id]);

    const io = req.app.get('io');
    if (io) io.to(`group:${id}`).emit('group_avatar_updated', { groupId: id, avatar: avatarUrl });

    res.json({ avatar: avatarUrl });
  } catch (error) {
    console.error('Group avatar error:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete the group' });
    }

    run('DELETE FROM groups WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) io.to(`group:${id}`).emit('group_deleted', { groupId: id });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

router.post('/:id/members', authMiddleware, [body('userId').isInt()], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { id } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, currentUserId]);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    const existing = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    const user = get('SELECT id, username, display_name, avatar, role, status FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    run('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)', [id, userId, 'member']);

    run(`INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'group_add', 'Added to group', ?)`, [userId, 'You have been added to a group']);

    const io = req.app.get('io');
    if (io) {
      io.to(`group:${id}`).emit('member_joined', { groupId: id, user });
      io.to(`user:${userId}`).emit('notification', {
        type: 'group_add',
        title: 'Added to group',
        body: 'You have been added to a group',
      });
    }

    res.status(201).json(user);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:userId', authMiddleware, (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user.id;

    const member = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, currentUserId]);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({ error: 'Admins cannot remove themselves' });
    }

    const target = get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
    if (!target) return res.status(404).json({ error: 'User is not a member' });

    run('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);

    const io = req.app.get('io');
    if (io) io.to(`group:${id}`).emit('member_left', { groupId: id, userId: parseInt(userId) });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
