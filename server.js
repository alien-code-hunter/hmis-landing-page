const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 9000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname));

// GET request to serve data.json
app.get('/data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'data.json'));
});

// POST request to update data.json
app.post('/data.json', (req, res) => {
    const newData = req.body;

    fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(newData, null, 2), (err) => {
        if (err) {
            console.error('Error writing data:', err);
            return res.status(500).json({ message: 'Error updating data' });
        }
        console.log('Data successfully updated:', newData);
        res.status(200).json({ message: 'Data updated successfully' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
