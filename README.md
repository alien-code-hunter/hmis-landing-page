# HIS Namibia - Ministry of Health Landing Page

This project is a landing page for the Ministry of Health's HIS data monitoring system, along with an admin panel for updating key data metrics.

## Project Structure

/namibia-landing-page/
├── index.html         # Public landing page displaying key metrics
├── admin.html         # Admin dashboard for updating metrics
├── data.json          # Local data storage (JSON format)
├── assets/            # CSS, JS, images, and chart assets
├── README.md          # Project documentation



## Features

✅ Public dashboard for displaying real-time health data metrics
✅ Admin panel for dynamic data updates
✅ JSON-based data handling (temporary, to be replaced by persistent storage)
✅ Responsive UI compatible with mobile and desktop
⏳ Role-based login system for admin access (planned)
⏳ User activity logs/audit trail (planned)
⏳ Export options for data (Excel, PDF) (planned)
⏳ Embedded data visualizations (Chart.js or D3.js) (planned)

## How to Run

1. Open the project in a live server (e.g., Live Server extension in VS Code).
2. Navigate to `index.html` to view the landing page.
3. Navigate to `admin.html` to update the data.
4. git clone https://github.com/alien-code-hunter/hmis-landing-page.git 
cd hmis-landing-page
Open the project using a live server (e.g., Live Server extension in Visual Studio Code).

## Future Improvements

- Add authentication to the admin panel.
- Enhance data validation in the admin panel.
- Implement server-side data persistence.

## Access the pages:

index.html – View the landing page.
admin.html – Access the admin panel.
Tip: Ensure that data.json is editable by the admin panel. In the current setup, all data is locally stored.

## Future Improvements
🔐 Authentication: Implement a secure login system with role-based access control.
🧾 Audit Logging: Record user activities (e.g., data changes, logins).
📤 Data Export: Add Excel/PDF export options for displayed data.
📊 Charts Integration: Visualize key metrics using Chart.js or D3.js.
💾 Data Persistence: Replace local JSON storage with server-side or database-backed persistence.
✅ Form Validation: Improve data validation for admin inputs.

 Contributing
We welcome contributions! If you’d like to improve the dashboard, fix a bug, or implement a planned feature, feel free to submit a pull request.

📜 License
This project is under the MIT License. See the LICENSE file for more info.
