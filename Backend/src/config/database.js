require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL database successfully!');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error.message);
  } finally {
    client.release();
  }
}

module.exports = { client: pool, testConnection };
