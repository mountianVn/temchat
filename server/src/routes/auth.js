const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { get, run } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 6, max: 100 }),
    body('display_name').isLength({ min: 1, max: 50 }),
    body('department').optional().isLength({ max: 50 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { username, password, display_name, department } = req.body;

      const existing = get('SELECT id FROM users WHERE username = ?', [username]);
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = run(
        'INSERT INTO users (username, password, display_name, department, status) VALUES (?, ?, ?, ?, ?)',
        [username, hashedPassword, display_name, department || 'Engineering', 'offline']
      );

      const token = jwt.sign(
        { id: result.lastInsertRowid, username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const user = get(
        'SELECT id, username, display_name, avatar, role, department, bio, status FROM users WHERE id = ?',
        [result.lastInsertRowid]
      );

      res.status(201).json({ token, user });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [
    body('username').notEmpty(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { username, password } = req.body;

      const user = get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      run('UPDATE users SET status = ? WHERE id = ?', ['online', user.id]);

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar,
          role: user.role,
          department: user.department,
          bio: user.bio,
          status: 'online',
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = get('SELECT id, username, display_name, avatar, role, department, bio, status, last_seen FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

router.put('/password', authMiddleware,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const user = get('SELECT password FROM users WHERE id = ?', [req.user.id]);
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

module.exports = router;
