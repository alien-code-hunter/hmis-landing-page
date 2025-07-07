// File: routes/fileRoutes.js
const express = require('express');
const router = express.Router();

// Import your authentication middleware functions
// Ensure the path is correct relative to this file
const { isAuthenticated, requireAdmin } = require('../middleware/authMiddleware');

// Import your file controller that contains all the file logic
// Ensure the path is correct relative to this file
const fileController = require('../controllers/fileController');

// --- File Management Routes ---

// POST /api/files/upload - Upload a new file
// Requires user to be authenticated.
// IMPORTANT: We now explicitly include fileController.uploadMiddleware here
// This ensures Multer processes the file BEFORE fileController.uploadFile is called.
router.post('/upload', isAuthenticated, fileController.uploadMiddleware, fileController.uploadFile);

// GET /api/files/list - Get a list of files with filtering, pagination, and sorting
// This route should NOT require authentication for public viewing.
router.get('/list', fileController.listFiles); // Removed isAuthenticated middleware

// GET /api/files/download/:id - Download a specific file by its ID
// This route should NOT require authentication for public downloading.
router.get('/download/:id', fileController.downloadFile); // Removed isAuthenticated middleware

// PATCH /api/files/:id - Update metadata (e.g., original_name, categories) for a specific file by ID
// Requires user to be an admin.
router.patch('/:id', requireAdmin, fileController.updateFileMetadata);

// DELETE /api/files/:id - Physically delete a file by ID and its database record
// Requires user to be an admin.
router.delete('/:id', requireAdmin, fileController.deleteFile);

// GET /api/files/audit - Get audit logs related to file operations
// Requires user to be authenticated (you might consider requireAdmin for this in a real app).
router.get('/audit', isAuthenticated, fileController.getAuditLogs);


module.exports = router;
