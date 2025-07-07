// File: middleware/authMiddleware.js

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    // IMPORTANT: Attach the user object from the session to req.user
    // This makes user data (like req.user.id, req.user.username, req.user.role)
    // readily available in subsequent middleware and route/controller functions.
    req.user = req.session.user;
    next(); // User is authenticated, proceed
  } else {
    // If not authenticated, send a 401 Unauthorized response
    res.status(401).json({ message: 'Not authenticated. Please log in.' });
  }
};

const requireAdmin = (req, res, next) => {
  // First, ensure the user is authenticated at all
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not authenticated. Please log in.' });
  }

  // Then, check if the authenticated user has the 'admin' role
  if (req.session.user.role === 'admin') {
    // Attach user for consistency, although isAuthenticated might have done it
    req.user = req.session.user;
    next(); // User is an admin, proceed
  } else {
    // If authenticated but not an admin, send a 403 Forbidden response
    res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
};

module.exports = {
  isAuthenticated,
  requireAdmin
};