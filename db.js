const { Pool } = require('pg');

const pool = new Pool({
    user: 'hmis_user',
    host: 'localhost',
    database: 'hmis_dashboard',
    password: 'strongpassword',
    port: 5432,
});

module.exports = pool;