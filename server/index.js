const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { connectDB } = require('./config/database');
const { initializeSocket } = require('./services/socketService');
const authRoutes = require('./routes/User');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Initialize Socket.IO
initializeSocket(server);

// Database connection and server start
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 4002;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

