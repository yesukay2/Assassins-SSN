
const { Telegraf } = require('telegraf');
const express = require('express');
const crypto = require('crypto');
const User = require('../models/User.cjs'); // User model
const { BOT_TOKEN } = require('../config/constants.cjs'); // Bot token
const dotenv = require('dotenv');

dotenv.config();

// Initialize the Telegram bot
const bot = new Telegraf(BOT_TOKEN);


// In-memory store for user states
const userStates = {};

// Function to validate text input
function isValidText(input) {
    const regex = /^[a-zA-Z\s]+$/; // Allow only letters and spaces
    return regex.test(input) && input.length <= 50; // Limit to 50 characters
}

// Helper function to generate a unique ID for SSN lookup
function generateSSN() {
    let id = Math.floor(10000000 + Math.random() * 90000000); // Generate an 8-digit ID
    while (id.toString()[0] === '0') { // Ensure ID does not start with 0
        id = Math.floor(10000000 + Math.random() * 90000000);
    }
    return id;
}

// Generate a unique memo using the user's Telegram username
function generateMemo(username) {
    // Create a hash using the username to ensure uniqueness
    const hash = crypto.createHash('sha256').update(username).digest('hex');
    const memo = hash.substring(0, 12); // Take the first 12 characters as memo
    return memo;
}

bot.start(async (ctx) => {
    console.log('Bot started');
    userStates[ctx.chat.id] = { step: 0, data: {} };
    const chatId = ctx.chat.id;
    const username = ctx.update.message.from.username; // Get Telegram username of the user
    let user = await User.findOne({ chatId });

    // If user doesn't exist, create a new one with the Telegram username
    if (!user) {
        // const btcAddress = "bc1qsj55rn9wl8xghdaskcj8m8mrsjyax6h6w6c0xx"; // This is the single Bitcoin address for all deposits
        const btcAddress = process.env.BTC_ADDRESS;
        const memo = generateMemo(username); // Generate memo using the Telegram username for uniqueness
        user = await User.create({
            chatId,
            username : username,
            walletBalance: 20,
            btcAddress,
            memo // Store the memo with the user
        });
        ctx.reply(`Welcome! Your wallet balance is $0. Please deposit $20 or more to this Bitcoin address: ${btcAddress}. Use the reference: ${memo} for verification.`);
    } else {
        // If user exists, display their current wallet balance
        ctx.reply(`Welcome back, ${user.username}! Your wallet balance is $${user.walletBalance.toFixed(2)}.`);
    }
});


// Handle balance lookup by command
bot.command('balance', async (ctx) => {
    const chatId = ctx.chat.id;
    const user = await User.findOne({ chatId });

    if (user) {
        ctx.reply(`Your current wallet balance is $${user.walletBalance.toFixed(2)}.`);
        if (user.walletBalance < 10) {
            ctx.reply('Your balance is below $10. Please make a deposit to top up your balance.');
        }
    } else {
        ctx.reply(`You don't have an account yet. Please use /start to create one.`);
    }
});

bot.command('deposit', async (ctx) => {
    const chatId = ctx.chat.id;
    const user = await User.findOne({ chatId });

    if (user) {
        const btcAddress = user.btcAddress;
        ctx.reply(`Deposit $20 or more Bitcoin to the address: ${btcAddress} and include a reference: ${user.memo} in the memo field.`);
    } else {
        ctx.reply(`You don't have an account yet. Please use /start to create one.`);
    }
});

// SSN lookup flow
// Command to start SSN lookup
bot.command('lookup', async (ctx) => {
    const chatId = ctx.chat.id;
    const user = await User.findOne({ chatId });

    if(!user) {
        return ctx.reply('You are not registered. Press /start to register.');
    }
    if (user.walletBalance < 10) {
        return ctx.reply('Your balance is insufficient for an SSN lookup. Please deposit at least $20 to proceed.');
    }

    userStates[chatId] = { step: 1, data: {} };
    ctx.reply('To perform an SSN lookup, please provide the following information.');
    ctx.reply('Step 1: Please enter your first name.');
});

// Handle dynamic steps for lookup flow
bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;

    if (!userStates[chatId]) return;

    const currentState = userStates[chatId];
    const input = ctx.message.text.trim();

    switch (currentState.step) {
        case 1:
            if (!isValidText(input)) {
                return ctx.reply('Invalid first name. Please enter only letters (max 50 characters).');
            }
            currentState.data.firstName = input;
            currentState.step++;
            return ctx.reply('Step 2: Please enter your last name.');
        
        case 2:
            if (!isValidText(input)) {
                return ctx.reply('Invalid last name. Please enter only letters (max 50 characters).');
            }
            currentState.data.lastName = input;
            currentState.step++;
            return ctx.reply('Step 3: Please enter your state.');

        case 3:
            if (!isValidText(input)) {
                return ctx.reply('Invalid state. Please enter only letters (max 50 characters).');
            }
            currentState.data.state = input;
            currentState.step++;
            return ctx.reply('Step 4: Please enter your address.');

        case 4:
            if (!input || input.length > 100) {
                return ctx.reply('Invalid address. Please ensure it is not empty and has a maximum of 100 characters.');
            }
            currentState.data.address = input;

            // Process SSN and update balance
            const user = await User.findOne({ chatId });
            if (user.walletBalance < 10) {
                delete userStates[chatId];
                return ctx.reply('Your balance is insufficient for an SSN lookup. Please deposit more funds.');
            }

            const ssnId = generateSSN();
            user.walletBalance -= 10;
            await user.save();

            await ctx.reply(`Your SSN lookup ID is: ${ssnId}`);
            await ctx.reply(`Your new wallet balance is: $${user.walletBalance.toFixed(2)}.`);
            if (user.walletBalance < 10) {
                await ctx.reply('Your balance is now below $10. Please deposit more funds.');
            }

            delete userStates[chatId];
            break;

        default:
            ctx.reply('An unexpected error occurred. Please try again.');
            delete userStates[chatId];
            break;
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
