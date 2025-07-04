const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hmis_landing_page',
  password: '', // 🔷 Add DB password here if needed
  port: 5432,
});

// POST /api/auth/login — authenticate and create session
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // 🔷 In production, hash & compare passwords instead of plain-text
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Save user info in session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    res.json({ message: 'Login successful', user: req.session.user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/logout — destroy session
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/auth/whoami — return current session user (optional)
router.get('/whoami', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;
