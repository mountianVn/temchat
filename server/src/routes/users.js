const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { get, run } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const avatarsDir = path.join(uploadDir, 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    cb(null, avatarsDir);
  },
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
    const { search, department } = req.query;

    let query = 'SELECT id, username, display_name, avatar, role, department, bio, status, last_seen FROM users WHERE id != ?';
    const params = [req.user.id];

    if (search) {
      query += ' AND (display_name LIKE ? OR username LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    query += ' ORDER BY display_name ASC';

    const { all } = require('../database/db');
    const users = all(query, params);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.get('/departments', (req, res) => {
  try {
    const { all } = require('../database/db');
    const departments = all('SELECT DISTINCT department FROM users WHERE department IS NOT NULL ORDER BY department', []);
    res.json(departments.map(d => d.department));
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to get departments' });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const user = get('SELECT id, username, display_name, avatar, role, department, bio, status, last_seen FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.put('/:id', authMiddleware,
  [
    body('display_name').optional().isLength({ min: 1, max: 50 }),
    body('role').optional().isLength({ max: 50 }),
    body('department').optional().isLength({ max: 50 }),
    body('bio').optional().isLength({ max: 200 }),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      if (parseInt(req.params.id) !== req.user.id) {
        return res.status(403).json({ error: 'Cannot update another user' });
      }

      const { display_name, role, department, bio } = req.body;
      const updates = [];
      const params = [];

      if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name); }
      if (role !== undefined) { updates.push('role = ?'); params.push(role); }
      if (department !== undefined) { updates.push('department = ?'); params.push(department); }
      if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(req.user.id);
      run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

      const user = get('SELECT id, username, display_name, avatar, role, department, bio, status FROM users WHERE id = ?', [req.user.id]);
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

router.post('/:id/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ error: 'Cannot update another user avatar' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);

    res.json({ avatar: avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ error: 'Cannot update another user status' });
    }

    const { status } = req.body;
    if (!['online', 'offline', 'away', 'busy'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    run('UPDATE users SET status = ? WHERE id = ?', [status, req.user.id]);
    res.json({ status });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
