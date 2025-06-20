require('dotenv').config(); // Load .env variables
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'hmis_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hmis_dashboard',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  password: process.env.DB_PASSWORD || undefined, // Optional
});

module.exports = pool;
