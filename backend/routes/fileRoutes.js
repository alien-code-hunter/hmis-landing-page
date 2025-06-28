// routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hmis_dashboard',
  password: '',
  port: 5432
});

router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  const { originalname, filename, mimetype } = req.file;
  const categories = req.body.categories ? JSON.parse(req.body.categories) : [];

  try {
    const result = await pool.query(
      'INSERT INTO uploaded_files (filename, original_name, mimetype, categories) VALUES ($1, $2, $3, $4) RETURNING *',
      [filename, originalname, mimetype, categories]
    );
    res.json({ message: 'File uploaded', file: result.rows[0] });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM uploaded_files ORDER BY upload_date DESC');
    res.json({ files: result.rows });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ message: 'Failed to fetch files' });
  }
});

router.delete('/:id', isAuthenticated, async (req, res) => {
  const fileId = req.params.id;
  try {
    const { rows } = await pool.query('SELECT filename FROM uploaded_files WHERE id = $1', [fileId]);
    if (!rows.length) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(uploadDir, rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM uploaded_files WHERE id = $1', [fileId]);
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

module.exports = router;
