const express = require('express');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');

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
        secure: false, // Set to true if using HTTPS in production
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// --- User Data (for demonstration) ---
const users = {
    'admin': '$2b$10$hDh4L.k08sdKJ5ZnJmk2iujhpcczaCqhIkJgHwURk8UOzWSPkzsle' // Example hash for "admin123"
};

// --- Auth Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
}

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

// --- Data Handling ---
const dataFilePath = path.join(__dirname, 'data.json');

app.get('/data.json', isAuthenticated, async (req, res) => {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        res.status(200).json(JSON.parse(data));
    } catch (err) {
        console.error('Read error:', err);
        res.status(500).json({ message: 'Failed to read data.' });
    }
});

app.post('/data.json', isAuthenticated, async (req, res) => {
    try {
        const data = req.body;
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
        res.status(200).json({ message: 'Data updated.' });
    } catch (err) {
        console.error('Write error:', err);
        res.status(500).json({ message: 'Failed to write data.' });
    }
});

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
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🔑 Login: http://localhost:${PORT}/login.html`);
    console.log(`🛠 Admin Panel: http://localhost:${PORT}/admin.html`);
});
