// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { isAuthenticated } = require('../middleware/authMiddleware');

const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hmis_dashboard',
  password: '',
  port: 5432
});

router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const { filename, originalname, mimetype } = req.file;
  const { category } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO uploaded_files (filename, original_name, mimetype, category) VALUES ($1, $2, $3, $4) RETURNING id, upload_date`,
      [filename, originalname, mimetype, category || null]
    );
    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        id: result.rows[0].id,
        filename,
        originalname,
        mimetype,
        category: category || null,
        upload_date: result.rows[0].upload_date
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Database error during upload.' });
  }
});

router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM uploaded_files ORDER BY upload_date DESC`);
    res.status(200).json({ files: result.rows });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch files.' });
  }
});

router.delete('/:id', isAuthenticated, async (req, res) => {
  const fileId = req.params.id;
  try {
    const { rows } = await pool.query('SELECT filename FROM uploaded_files WHERE id = $1', [fileId]);
    if (rows.length === 0) return res.status(404).json({ message: 'File not found.' });
    const filePath = path.join(uploadPath, rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.query('DELETE FROM uploaded_files WHERE id = $1', [fileId]);
    res.status(200).json({ message: 'File deleted.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Error deleting file.' });
  }
});

module.exports = router;
