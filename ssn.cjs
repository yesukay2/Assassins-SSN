const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const webhookRoutes = require('./routes/webhook');
const bot = require('./bot/bot');
const { registerWebhook } = require('./services/BlockchainService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/webhook', webhookRoutes);

// Connect to MongoDB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        registerWebhook(); // Register webhook with BlockCypher
    });
});
