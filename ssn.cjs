const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db.cjs');
const webhookRoutes = require('./routes/webhook.cjs');
const bot = require('./bot/bot.cjs');
const { registerWebhook } = require('./services/BlockchainService.cjs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const EXPRESS_PORT = process.env.EXPRESS_PORT;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/webhook', webhookRoutes);

// Connect to MongoDB and start server
connectDB().then(() => {
    app.listen(EXPRESS_PORT, () => {
        console.log(`Server running on port ${EXPRESS_PORT}`);
        registerWebhook(); // Register webhook with BlockCypher
    });
});

const pingInterval = 3 * 60 * 1000; // Every 3 minutes
const serverURL = 'https://assassins-ssn.onrender.com';

setInterval(async () => {
  try {
    await app.get(serverURL);
    console.log('Server pinged to keep alive');
  } catch (error) {
    console.error('Ping failed:', error.message);
  }
}, pingInterval);
