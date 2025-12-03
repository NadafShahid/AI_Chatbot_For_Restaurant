const { client } = require('../config/database');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];

    // Password check (plain text, not secure for production)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Authentication success, return user info (omit password)
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ success: true, message: 'Login successful', data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };
