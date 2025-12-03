const { testConnection } = require('./database');

async function runTest() {
  console.log('Testing database connection...');
  await testConnection();
}

runTest();
