require('dotenv').config();

const mysql = require('mysql');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cinebook',
    port: Number(process.env.DB_PORT) || 3306
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        throw err;
    }
    console.log('Connected to MySQL');
});

module.exports = db;