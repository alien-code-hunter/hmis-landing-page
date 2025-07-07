// File: routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, requireAdmin } = require('../middleware/authMiddleware'); // Assuming you have these

// GET /api/dashboard - Get all dashboard data (publicly accessible for the home page)
router.get('/', dashboardController.getDashboardData);

// POST /api/dashboard/update - Update a specific dashboard data field (requires admin)
router.post('/update', requireAdmin, dashboardController.updateDashboardData);

module.exports = router;
