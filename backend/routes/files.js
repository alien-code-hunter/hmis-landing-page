// File: routes/files.js
const express = require('express');
const multer = require('multer');
const auth = require('../middleware/authMiddleware'); // Assuming this path is correct
const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Make sure 'uploads/' directory exists relative to your server.js
    // And that your Node.js process has write permissions to it.
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Optional: Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    // Optional: Filter file types
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/pdf') ||
        file.mimetype.startsWith('application/msword') || // .doc
        file.mimetype.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || // .docx
        file.mimetype.startsWith('application/vnd.ms-excel') || // .xls
        file.mimetype.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || // .xlsx
        file.mimetype.startsWith('application/vnd.ms-powerpoint') || // .ppt
        file.mimetype.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')) { // .pptx
      cb(null, true);
    } else {
      cb(new Error('Invalid file type.'), false);
    }
  }
});

// Route for file upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    // Multer places the file info on req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Extract categories, system, documentType, healthType from req.body
    // They are coming as comma-separated strings from the frontend, so split them into arrays.
    const categoriesString = req.body.categories || '';
    const systemString = req.body.system || '';
    const documentTypeString = req.body.documentType || '';
    const healthTypeString = req.body.healthType || '';

    const categoriesArray = categoriesString.split(', ').filter(s => s.trim() !== '');
    const systemArray = systemString.split(', ').filter(s => s.trim() !== '');
    const documentTypeArray = documentTypeString.split(', ').filter(s => s.trim() !== '');
    const healthTypeArray = healthTypeString.split(', ').filter(s => s.trim() !== '');

    // Assuming your 'metadata' column is JSONB and can store an object
    // Or you can structure it differently based on your needs
    const metadata = {}; // You can populate this with more details if needed

    // Assuming req.user.id is set by your auth middleware
    const uploadedBy = req.user ? req.user.id : null; // Use null or a default if auth not fully implemented

    await req.db.query(
      `INSERT INTO files (filename, original_name, mimetype, size, categories, system, document_type, health_type, uploaded_by, metadata, upload_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        categoriesArray,       // Passed as array for PostgreSQL TEXT[] or VARCHAR[]
        systemArray,
        documentTypeArray,
        healthTypeArray,
        uploadedBy,
        metadata
      ]
    );

    res.status(201).json({ message: 'File uploaded successfully.' });
  } catch (error) {
    console.error('File upload error:', error); // Log the detailed error
    // Check for specific Multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum 10MB allowed.' });
      }
      return res.status(400).json({ message: `Multer error: ${error.message}` });
    }
    // Handle other errors (e.g., database errors, file system errors)
    res.status(500).json({ message: 'An unexpected error occurred during file upload. Please try again.' });
  }
});

// Add other file-related routes (list, update, delete) here as needed
// router.get('/list', auth, fileController.listFiles);
// router.put('/update/:id', auth, fileController.updateFile);
// router.delete('/delete/:id', auth, fileController.deleteFile);


module.exports = router;