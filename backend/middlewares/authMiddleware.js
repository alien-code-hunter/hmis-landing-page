const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  const token = req.headers['authorization']; // expects "Bearer <token>"

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded; // attaches the decoded payload to the request object
    next(); // passes control to the next middleware or route handler
  } catch {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};
