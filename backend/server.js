const express = require('express');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const pool = require('./db'); // PostgreSQL connection

const app = express();
const PORT = 9000;

// --- Middleware Setup ---
app.use(cors({
    origin: 'http://localhost:9000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// --- User Data (for demonstration) ---
const users = {
    'admin': '$2b$10$hDh4L.k08sdKJ5ZnJmk2iujhpcczaCqhIkJgHwURk8UOzWSPkzsle' // "admin123"
};

// A multer setup for file uploads
const multer = require('multer');
const fs = require('fs');
const uploadPath = path.join(__dirname, 'uploads');

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


// --- Auth Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
}

// --- Get List of Uploaded Files ---
app.get('/uploads/list', isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT id, filename, original_name, mimetype, category, upload_date
        FROM uploaded_files
        ORDER BY upload_date DESC
      `);
      res.status(200).json({ files: result.rows });
    } catch (err) {
      console.error('Error retrieving uploaded files:', err);
      res.status(500).json({ message: 'Database error retrieving uploaded files' });
    }
  });
  
  // --- Delete File Endpoint ---
app.delete('/api/files/:id', isAuthenticated, async (req, res) => {
    const fileId = req.params.id;
  
    try {
      // Get file metadata
      const { rows } = await pool.query('SELECT filename FROM uploaded_files WHERE id = $1', [fileId]);
      if (rows.length === 0) return res.status(404).json({ message: 'File not found.' });
  
      const filePath = path.join(uploadPath, rows[0].filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  
      // Delete metadata from DB
      await pool.query('DELETE FROM uploaded_files WHERE id = $1', [fileId]);
  
      res.status(200).json({ message: 'File deleted.' });
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ message: 'Failed to delete file.' });
    }
  });
  

// --- Login Endpoint ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = users[username];

    if (!hashedPassword) return res.status(401).json({ message: 'Invalid credentials.' });

    try {
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
            req.session.userId = username;
            res.status(200).json({ message: 'Login successful.' });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// --- Logout Endpoint ---
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Logout failed.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out.' });
    });
});

// --- Optional: Auth Check Endpoint ---
app.get('/api/check-auth', (req, res) => {
    if (req.session && req.session.userId === 'admin') {
        res.status(200).json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// --- PostgreSQL Dashboard Routes ---

// GET dashboard data
app.get('/data.json', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM dashboard_metrics LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No data found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error reading from DB:', err);
        res.status(500).json({ message: 'Database read error.' });
    }
});

// POST to update dashboard data
app.post('/data.json', isAuthenticated, async (req, res) => {
    const {
        facilities_reporting,
        data_submission,
        reporting_period,
        active_users,
        completeness,
        timeliness
    } = req.body;

    try {
        const update = `
            UPDATE dashboard_metrics SET
                facilities_reporting = $1,
                data_submission = $2,
                reporting_period = $3,
                active_users = $4,
                completeness = $5,
                timeliness = $6
            WHERE id = 1
        `;
        await pool.query(update, [
            facilities_reporting,
            data_submission,
            reporting_period,
            active_users,
            completeness,
            timeliness
        ]);
        res.status(200).json({ message: 'Data updated.' });
    } catch (err) {
        console.error('Error updating DB:', err);
        res.status(500).json({ message: 'Database update error.' });
    }
});

// Serve uploaded files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- File Upload Endpoint ---
app.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    const { filename, originalname, mimetype } = req.file;
    const { category } = req.body;
  
    try {
      const insertQuery = `
        INSERT INTO uploaded_files (filename, original_name, mimetype, category)
        VALUES ($1, $2, $3, $4)
        RETURNING id, upload_date
      `;
      const result = await pool.query(insertQuery, [filename, originalname, mimetype, category || null]);
  
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
      console.error('Error saving file metadata:', err);
      res.status(500).json({ mess
  
// --- Static File Serving ---

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/admin', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Login: http://localhost:${PORT}/login.html`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
});
