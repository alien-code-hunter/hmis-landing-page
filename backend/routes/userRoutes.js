// routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hmis_dashboard',
  password: '',
  port: 5432
});

router.post('/create', isAuthenticated, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ message: 'Missing required fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hash, role]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('User creation error:', err);
    res.status(500).json({ message: 'User creation failed' });
  }
});

router.get('/', isAuthenticated, async (_, res) => {
  try {
    const result = await pool.query('SELECT id, username, role FROM users ORDER BY id ASC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

router.put('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { password, role } = req.body;

  try {
    if (role) {
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
    }
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Update failed' });
  }
});

router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Deletion failed' });
  }
});

module.exports = router;
