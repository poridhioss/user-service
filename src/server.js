require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();