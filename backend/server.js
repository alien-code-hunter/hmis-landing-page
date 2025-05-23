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
    origin: 'http://localhost:9000', // Allow requests from your frontend's actual origin
    credentials: true // Allow cookies to be sent
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'YOUR_VERY_STRONG_SECRET_KEY', // CHANGE THIS! Use a long, random string
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// --- User Data and Hashing (For Demonstration) ---
const users = {
    'admin': 'YOUR_ACTUAL_BCRYPT_HASH_HERE' // REPLACE WITH YOUR GENERATED HASH
};

// --- Authentication Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
}

// --- API Endpoints ---

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const hashedPassword = users[username];
    if (!hashedPassword) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    try {
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
            req.session.userId = username;
            console.log(`User '${username}' logged in successfully.`);
            res.status(200).json({ message: 'Login successful.' });
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error('Error during password comparison:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Logout Endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully.' });
    });
});

// Endpoint to get and update data.json
const dataFilePath = path.join(__dirname, 'data.json');

// GET /data.json - Protected route to fetch data
app.get('/data.json', isAuthenticated, async (req, res) => {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading data.json:', error);
        res.status(500).json({ message: 'Failed to retrieve data.' });
    }
});

// POST /data.json - Protected route to update data
app.post('/data.json', isAuthenticated, async (req, res) => {
    const newData = req.body;
    if (!newData || typeof newData !== 'object') {
        return res.status(400).json({ message: 'Invalid data format.' });
    }

    try {
        await fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), 'utf8');
        console.log('data.json updated successfully by admin:', newData);
        res.status(200).json({ message: 'Data updated successfully.' });
    } catch (error) {
        console.error('Error writing to data.json:', error);
        res.status(500).json({ message: 'Failed to update data.' });
    }
});

// --- Serve Static Frontend Files ---
// This middleware serves all static files (HTML, CSS, JS, images) from the 'frontend' directory.
// It automatically looks for index.html when you access the root '/'.
const frontendPath = path.join(__dirname, '../frontend');
console.log('Serving static files from:', frontendPath); // Check this path in your console output!
app.use(express.static(frontendPath));

// Redirect requests for /admin to admin.html (frontend will handle the redirection to login)
// The express.static above should handle /admin.html if requested directly.
// This route is primarily to ensure that if someone navigates to /admin, they get the admin.html file
// and the frontend JavaScript can then handle the authentication flow with the backend.
app.get('/admin', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin.html'));
});

// If the above static middleware doesn't find a file, then we might hit this 404
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Frontend accessible at http://localhost:${PORT}`);
    console.log(`Admin login at http://localhost:${PORT}/login.html`);
    console.log(`Admin panel (access through login) at http://localhost:${PORT}/admin.html`);
});