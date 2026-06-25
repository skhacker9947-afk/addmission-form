const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
async function connectDB() {
  try {
    await pool.query('SELECT 1 + 1 AS solution');
    console.log('PostgreSQL database connected successfully.');
  } catch (err) {
    console.error('Error connecting to PostgreSQL database:', err.message);
    process.exit(1); // Exit process with failure
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  connectDB, // Export the connection test function
  pool // Export the pool directly in case a transaction or specific client is needed
};