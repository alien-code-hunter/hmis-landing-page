// routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');

// Create user (Admin only)
router.post('/create', isAuthenticated, async (req, res) => {
  const pool = req.pool;
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('User creation error:', err);
    res.status(500).json({ message: 'User creation failed' });
  }
});

// Get all users
router.get('/', isAuthenticated, async (req, res) => {
  const pool = req.pool;
  try {
    const result = await pool.query('SELECT id, username, role FROM users ORDER BY id ASC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user role or password
router.put('/:id', isAuthenticated, async (req, res) => {
  const pool = req.pool;
  const userId = req.params.id;
  const { role, password } = req.body;

  try {
    if (role) {
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, userId]);
    }
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', isAuthenticated, async (req, res) => {
  const pool = req.pool;
  const userId = req.params.id;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;