const express = require('express');
const multer = require('multer');
const auth = require('../middlewares/authMiddleware');
const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  const { categories = [], metadata = {} } = req.body;
  const file = req.file;

  try {
    await req.db.query(
      `INSERT INTO files (filename, original_name, mimetype, size, categories, uploaded_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [file.filename, file.originalname, file.mimetype, file.size, categories, req.user.id, metadata]
    );

    res.status(201).json({ message: 'File uploaded successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed.' });
  }
});
