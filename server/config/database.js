const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  logging: false, // Disable logging in production
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Creates tables if they don't exist
    console.log('PostgreSQL Connected');
  } catch (err) {
    console.error('PostgreSQL connection error:', err);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };