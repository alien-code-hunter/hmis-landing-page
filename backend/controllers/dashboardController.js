// File: controllers/dashboardController.js
const { Pool } = require('pg'); // Ensure Pool is imported if not already globally available

// Function to get all dashboard data
exports.getDashboardData = async (req, res) => {
    console.log('Attempting to fetch dashboard data...'); // Added log
    try {
        const pool = req.db; // Access the database pool from req.db
        const result = await pool.query('SELECT key, value FROM dashboard_data');
        
        // Transform the array of objects into a single object for easier frontend consumption
        const dashboardData = {};
        result.rows.forEach(row => {
            dashboardData[row.key] = row.value;
        });

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Failed to retrieve dashboard data.', error: error.message });
    }
};

// Function to update a specific dashboard data record
exports.updateDashboardData = async (req, res) => {
    try {
        const pool = req.db; // Access the database pool from req.db
        const { key, value } = req.body;

        if (!key || value === undefined || value === null) {
            return res.status(400).json({ message: 'Missing "key" or "value" in request body.' });
        }

        // Update the record; if key doesn't exist, it will not insert
        const result = await pool.query(
            `UPDATE dashboard_data SET value = $1, last_updated = CURRENT_TIMESTAMP WHERE key = $2 RETURNING *`,
            [value, key]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: `Dashboard data field '${key}' not found.` });
        }

        // Audit Log (assuming req.session.user is available via auth middleware)
        if (req.session?.user) {
            await pool.query(
                `INSERT INTO audit_log (user_id, user_name, action, details) VALUES ($1, $2, $3, $4)`,
                [req.session.user.id, req.session.user.username, 'update_dashboard', `Updated dashboard data: ${key} to ${value}`]
            );
        } else {
            console.warn('Audit log: User session not found for dashboard data update. Audit entry skipped.');
        }

        res.status(200).json({ message: `Dashboard data for '${key}' updated successfully.`, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating dashboard data:', error);
        res.status(500).json({ message: 'Failed to update dashboard data.', error: error.message });
    }
};
