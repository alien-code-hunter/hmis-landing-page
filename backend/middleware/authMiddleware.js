const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    next(); // User is authenticated
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

module.exports = { isAuthenticated };
