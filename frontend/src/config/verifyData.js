const { client } = require('./database');

async function verifyData() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    // Check users table
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`Users table: ${usersResult.rows[0].count} records`);

    // Check menu_items table
    const menuResult = await client.query('SELECT COUNT(*) as count FROM menu_items');
    console.log(`Menu items table: ${menuResult.rows[0].count} records`);

    // Show sample user data
    const sampleUsers = await client.query('SELECT id, name, email FROM users LIMIT 3');
    console.log('\nSample users:');
    sampleUsers.rows.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });

    // Show sample menu items
    const sampleMenu = await client.query('SELECT id, name, price FROM menu_items LIMIT 5');
    console.log('\nSample menu items:');
    sampleMenu.rows.forEach(item => {
      console.log(`- ${item.name}: $${item.price}`);
    });

  } catch (error) {
    console.error('Error verifying data:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

verifyData();
