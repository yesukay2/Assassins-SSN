const { Telegraf } = require('telegraf');
const express = require('express'); // Import express for creating a web server
const User = require('../models/User.cjs'); // Import User model
const { BOT_TOKEN } = require('../config/constants.cjs'); // Import constants for bot token

// Initialize the Telegram bot
const bot = new Telegraf(BOT_TOKEN);

// Bot start command: Check or create user and display wallet balance
bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    let user = await User.findOne({ chatId });

    // If user doesn't exist, create a new one
    if (!user) {
        user = await User.create({ 
            chatId, 
            walletBalance: 0, 
            btcAddress: 'bc1qsj55rn9wl8xghdaskcj8m8mrsjyax6h6w6c0xx' 
        });
        ctx.reply(`Welcome! Your wallet balance is $0.`);
    } else {
        // If user exists, display their current wallet balance
        ctx.reply(`Welcome back! Your wallet balance is $${user.walletBalance.toFixed(2)}.`);
    }
});

// Middleware to handle balance checks when users send messages
bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const user = await User.findOne({ chatId });

    if (user) {
        ctx.reply(`Your current wallet balance is $${user.walletBalance.toFixed(2)}.`);
    } else {
        ctx.reply(`You don't have an account yet. Please use /start to create one.`);
    }
});

// Launch the bot
bot.launch();

// Create an Express app for Render's free plan (web server requirement)
const app = express();

// A simple route for the web server
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

// Listen on the port specified by Render or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web server is running on port ${PORT}`);
});

// Gracefully stop the bot on SIGINT or SIGTERM signals
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Export bot for testing or further integration
module.exports = bot;
