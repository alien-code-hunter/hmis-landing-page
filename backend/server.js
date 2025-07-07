// File: server.js
const { Pool } = require('pg');
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes'); // Assuming you have this
const userRoutes = require('./routes/userRoutes'); // Assuming you have this
const dashboardRoutes = require('./routes/dashboardRoutes'); // Assuming you have this

const app = express();
const PORT = process.env.PORT || 9000;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hmis_landing_page', // Using 'hmis_landing_page'
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client from pool', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('PostgreSQL connected:', result.rows[0].now);
  });
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// --- Middleware ---
app.use(cors({
  origin: 'http://localhost:9000', // Or your actual frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-fallback-secret', // Use ENV var for production
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Middleware to attach db pool to request object
app.use((req, res, next) => {
  req.db = pool; // Attach the pool to the request object
  next();
});

// --- Static Files ---
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Frontend Routes ---
// Serve resources.html as the default page for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'resources.html'));
});
// Explicitly serve resources.html if accessed directly
app.get('/resources.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'resources.html'));
});
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});
app.get('/contact.html', (req, res) => { // Assuming you also have a contact.html
  res.sendFile(path.join(frontendPath, 'contact.html'));
});


// --- 404 fallback ---
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HMIS Backend running at http://0.0.0.0:${PORT}`);
});
