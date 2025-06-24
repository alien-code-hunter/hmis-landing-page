// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = function(pool, session) {
  const users = {
    'admin': '$2b$10$hDh4L.k08sdKJ5ZnJmk2iujhpcczaCqhIkJgHwURk8UOzWSPkzsle' // "admin123"
  };

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = users[username];

    if (!hashedPassword) return res.status(401).json({ message: 'Invalid credentials.' });

    try {
      const match = await bcrypt.compare(password, hashedPassword);
      if (match) {
        req.session.userId = username;
        res.status(200).json({ message: 'Login successful.' });
      } else {
        res.status(401).json({ message: 'Invalid credentials.' });
      }
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed.' });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out.' });
    });
  });

  router.get('/check-auth', (req, res) => {
    if (req.session && req.session.userId === 'admin') {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  return router;
};
