const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { client } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require('./src/routes/userRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const posRoutes = require('./src/routes/posRoutes');
const authRoutes = require('./src/routes/authRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const tableRoutes = require('./src/routes/tableRoutes');

app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tables', tableRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Backend API' });
});

// Error handler middleware (should be registered after routes)
app.use(errorHandler);

// Connect to database and start server
(async () => {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
})();

module.exports = app;
