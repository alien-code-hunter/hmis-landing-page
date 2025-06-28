// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token malformed' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Replace with your secret
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token error:', err);
    res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = { isAuthenticated };
