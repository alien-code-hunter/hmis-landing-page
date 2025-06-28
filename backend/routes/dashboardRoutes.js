// routes/dashboardRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');

// Path to JSON file that stores dashboard data
const dataFilePath = path.join(__dirname, '../data/data.json');

// GET dashboard data
router.get('/', isAuthenticated, (req, res) => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const rawData = fs.readFileSync(dataFilePath);
      const jsonData = JSON.parse(rawData);
      res.json(jsonData);
    } else {
      res.json({ message: 'No data available.' });
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST dashboard data (save/update)
router.post('/update', isAuthenticated, (req, res) => {
  const {
    facilities_reporting,
    data_submission,
    reporting_period,
    active_users,
    completeness,
    timeliness
  } = req.body;

  const newData = {
    facilities_reporting,
    data_submission,
    reporting_period,
    active_users,
    completeness,
    timeliness,
    updated_at: new Date().toISOString()
  };

  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true }); // ensure directory exists
    fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2));
    res.status(200).json({ message: 'Dashboard data updated successfully.', data: newData });
  } catch (err) {
    console.error('Failed to write dashboard data:', err);
    res.status(500).json({ message: 'Failed to update dashboard data' });
  }
});

module.exports = router;
