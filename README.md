## HIS Namibia - Ministry of Health Landing Page
This project is a dynamic landing page for the Ministry of Health's Health Information System (HIS) data monitoring, complemented by a secure admin panel for updating key health metrics.

## Project Structure
The project is structured into distinct frontend and backend components for better organization, security, and scalability.

/my-health-portal/                  # Main project directory
├── frontend/                       # Contains all public-facing HTML, CSS, JS, and assets
│   ├── index.html                  # Public landing page displaying key metrics
│   ├── admin.html                  # Admin dashboard for updating metrics (protected)
│   ├── login.html                  # Dedicated login page for admin access
│   ├── style.css                   # Main CSS file (if applicable)
│   ├── script.js                   # Main frontend JavaScript (if applicable)
│   ├── main_image.png              # Image used in admin.html
│   └── Coat_of_arms_of_Namibia.svg # Logo used in header
├── backend/                        # Node.js Express server for data handling and authentication
│   ├── server.js                   # Main server logic and API endpoints
│   ├── data.json                   # Server-managed data storage (JSON format)
│   ├── package.json                # Backend dependencies and scripts
│   └── node_modules/               # Installed Node.js packages
└── README.md                       # Project documentation
## Features
✅ Public dashboard for displaying real-time health data metrics.
✅ Admin panel for dynamic data updates.
✅ Backend-driven authentication for admin access (secure username/password login with sessions).
✅ Server-side management of data.json (data is now handled by the backend).
✅ Responsive UI compatible with mobile and desktop.
⏳ User activity logs/audit trail (planned).
⏳ Export options for data (Excel, PDF) (planned).
⏳ Embedded data visualizations (Chart.js or D3.js) (planned).

## How to Run
Follow these steps to get the application running on your local machine:

## Clone the Repository:

Bash
git clone https://github.com/alien-code-hunter/hmis-landing-page.git
Navigate to the Project Directory:
Bash
cd hmis-landing-page
Set Up the Backend:

Navigate into the backend directory:
Bash
cd backend
Install backend dependencies:
Bash
npm install
Generate a Hashed Password: You need a hashed password for your admin user to store in server.js. Open a new terminal window (keep the current one in backend/). Run node and execute the following commands:
JavaScript
const bcrypt = require('bcrypt');
const saltRounds = 10;
bcrypt.hash('YOUR_ADMIN_PASSWORD', saltRounds, function(err, hash) {
    console.log('Your hashed password:', hash);
});
// Type .exit and press Enter to quit the Node.js prompt
Copy the generated hash.
Update server.js: Open my-health-portal/backend/server.js.
Replace 'YOUR_ACTUAL_BCRYPT_HASH_HERE' with the hashed password you just generated.
Replace 'YOUR_VERY_STRONG_SECRET_KEY' with a long, random, unique string for your session secret.
Save the file.
Start the Backend Server:

From within the backend/ directory, run:
Bash

node server.js
You should see messages indicating the server is running on http://localhost:9000.
Access the Pages
Once the server is running:

Public Landing Page: http://localhost:9000/ (or http://localhost:9000/index.html)
Admin Login Page: http://localhost:9000/login.html
Admin Panel: http://localhost:9000/admin.html (You will be redirected to login.html if not authenticated.)
Tip: Ensure your data.json file in the backend/ directory is correctly formatted JSON, as the server reads from and writes to it.

## Future Improvements
Data Persistence: Replace the current data.json file storage with a robust database (e.g., PostgreSQL, MongoDB) for scalable and reliable data management.
Audit Logging: Implement server-side logging of user activities (e.g., data changes, logins, logouts).
Data Export: Add functionality to export displayed data to formats like Excel or PDF.
Charts Integration: Visualize key metrics on the public dashboard using charting libraries like Chart.js or D3.js.
Enhanced Form Validation: Implement more comprehensive data validation on both frontend and backend for admin inputs.
Contributing
We welcome contributions! If you’d like to improve the dashboard, fix a bug, or implement a planned feature, feel free to submit a pull request.

## License
This project is under the MIT License. See the LICENSE file for more info.
