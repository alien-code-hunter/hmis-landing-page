# HIS Namibia – Ministry of Health Landing Page 

A responsive and secure web-based landing page and admin dashboard for monitoring key health metrics in Namibia’s Health Information System (HIS).

---

## 📁 Project Structure

```
/my-health-portal/                      # Root project directory
├── frontend/                           # Public-facing assets
│   ├── index.html                      # Landing page displaying key metrics
│   ├── admin.html                      # Admin dashboard (authentication required)
│   ├── login.html                      # Admin login page
│   ├── style.css                       # Main stylesheet
│   ├── script.js                       # Frontend interactivity logic
│   ├── main_image.png                  # Image used in admin.html
│   └── Coat_of_arms_of_Namibia.svg    # Official logo in the header
├── backend/                            # Node.js backend (Express.js)
│   ├── server.js                       # Main server logic & API endpoints
│   ├── data.json                       # Server-managed metric data (JSON format)
│   ├── package.json                    # Backend dependencies and scripts
│   └── node_modules/                   # Node.js packages
└── README.md                           # Project documentation
```

---

## ✨ Features

- ✅ Real-time display of health data metrics
- ✅ Secure admin panel with backend-managed authentication
- ✅ JSON-based server-side data storage (`data.json`)
- ✅ Responsive design (mobile + desktop)
- ⏳ Planned: User audit logs
- ⏳ Planned: Data export (Excel/PDF)
- ⏳ Planned: Embedded data visualizations (Chart.js or D3.js)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/alien-code-hunter/hmis-landing-page.git
cd hmis-landing-page
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

### 3. Configure Admin Credentials

In a new terminal window:

```bash
node
```

Inside the Node.js prompt, generate a bcrypt hash for your password:

```js
const bcrypt = require('bcrypt');
bcrypt.hash('YOUR_ADMIN_PASSWORD', 10, (err, hash) => {
  console.log('Your hashed password:', hash);
});
```

- Copy the generated hash.
- Open `backend/server.js` and:
  - Replace `'YOUR_ACTUAL_BCRYPT_HASH_HERE'` with the hash.
  - Replace `'YOUR_VERY_STRONG_SECRET_KEY'` with a unique session secret.

Exit the Node prompt:

```bash
.exit
```

### 4. Run the Server

```bash
node server.js
```

> The server will run at: `http://localhost:9000`

---

## 🌐 Access the App

- Public Landing Page: [http://localhost:9000/](http://localhost:9000/)
- Admin Login: [http://localhost:9000/login.html](http://localhost:9000/login.html)
- Admin Dashboard: [http://localhost:9000/admin.html](http://localhost:9000/admin.html)

> 🔐 You'll be redirected to the login page if you’re not authenticated.

---

## 🛠 Future Enhancements

- 🔄 **Persistent Database**: Replace `data.json` with PostgreSQL or MongoDB
- 🧾 **Audit Logging**: Track data edits and user activity
- 📤 **Export Tools**: Allow export of reports to Excel/PDF
- 📊 **Chart Integration**: Use Chart.js or D3.js for dynamic visualizations
- ✅ **Advanced Validation**: Strengthen frontend/backend form validation

---

## 🤝 Contributing

We welcome contributions! Submit a pull request to:

- Fix bugs
- Improve UI/UX
- Implement planned features

---

## 📄 License

Licensed under the [MIT License](LICENSE).
