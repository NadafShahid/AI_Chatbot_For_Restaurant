const fs = require('fs');
const path = require('path');
const { client } = require('./database');

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    // First, drop tables if they exist (in reverse order due to foreign keys)
    const dropTablesSQL = `
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS chats CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS carts CASCADE;
      DROP TABLE IF EXISTS menu_items CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;

    await client.query(dropTablesSQL);
    console.log('Dropped existing tables.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Execute the entire schema as one query
    await client.query(schemaSQL);

    console.log('Database schema created successfully with sample data.');
  } catch (error) {
    console.error('Error setting up database:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

setupDatabase();
