const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const router = express.Router();

const users = {
  admin: '$2b$10$hDh4L.k08sdKJ5ZnJmk2iujhpcczaCqhIkJgHwURk8UOzWSPkzsle', // password: admin123
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const storedHash = users[username];

  if (!storedHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const match = await bcrypt.compare(password, storedHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      message: 'Login successful',
      token, // the client must store and reuse this
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
