const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const bcrypt = require('bcryptjs');

// Signup
exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
  
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: 'Name, email, and password are required',
        fields: { name: !!name, email: !!email, password: !!password }
      });
    }
  
    try {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          msg: 'User already exists' 
        });
      }
  
      const user = await User.create({ name, email, password });
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
      
      res.status(201).json({ 
        success: true,
        token,
        message: 'Signup successful'
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ 
        success: false,
        msg: 'Server error', 
        error: err.message 
      });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
  
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: 'Email and password are required',
        fields: { email: !!email, password: !!password }
      });
    }
  
    try {
      // Check if user exists
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ 
          success: false,
          msg: 'Invalid credentials' // Generic message for security
        });
      }
  
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false,
          msg: 'Invalid credentials' // Same generic message
        });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '8h' } // Longer expiry for better UX
      );
  
      // Omit password from response
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
  
      res.status(200).json({
        success: true,
        token,
        user: userData,
        msg: 'Login successful'
      });
  
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ 
        success: false,
        msg: 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };