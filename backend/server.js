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
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 9000;

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',   
  host: 'localhost',
  database: 'hmis_landing_page',
  password: '',                // I will add a pasword later
  port: 5432,
});

// --- Middleware ---
app.use(cors({
  origin: 'http://localhost:9000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(session({
  secret: 'something-strong-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // use true if HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// --- Static Files ---
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath)); // serve static frontend files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // serve uploaded files

// --- API Routes ---
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Frontend Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// --- 404 fallback for frontend routes ---
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HMIS Backend running at http://0.0.0.0:${PORT}`);
});

