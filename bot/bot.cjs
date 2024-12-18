
const { Telegraf } = require('telegraf');
const express = require('express');
const crypto = require('crypto');
const User = require('../models/User.cjs'); // User model
const { BOT_TOKEN } = require('../config/constants.cjs'); // Bot token
const dotenv = require('dotenv');

dotenv.config();

// Initialize the Telegram bot
const bot = new Telegraf(BOT_TOKEN);

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

// SSN lookup flow
bot.command('lookup', async (ctx) => {
    const chatId = ctx.chat.id;
    const user = await User.findOne({ chatId });

    // Ensure user has sufficient balance
    if (!user || user.walletBalance < 10) {
        return ctx.reply('Your balance is insufficient for an SSN lookup. Please deposit at least $20 to proceed.');
    }

    // Prompt for user details to generate SSN
    ctx.reply('To perform an SSN lookup, please provide the following information.');

    // Step 1: Ask for first name
    await ctx.reply('Please enter your first name.');
    bot.on('text', async (firstNameCtx) => {
        if(firstNameCtx.message.text.length < 2 || /[^a-zA-Z]/.test(firstNameCtx.message.text)){
            return firstNameCtx.reply('Please enter a valid first name.');
        }
        const firstName = firstNameCtx.message.text;
        
        // Step 2: Ask for last name
        await firstNameCtx.reply('Please enter your last name.');
        bot.on('text', async (lastNameCtx) => {
            const lastName = lastNameCtx.message.text;
            
            // Step 3: Ask for state
            await lastNameCtx.reply('Please enter your state.');
            bot.on('text', async (stateCtx) => {
                const state = stateCtx.message.text;
                
                // Step 4: Ask for address
                await stateCtx.reply('Please enter your address.');
                bot.on('text', async (addressCtx) => {
                    const address = addressCtx.message.text;

                    // Generate 8-digit ID
                    const ssnId = generateSSN();

                    // Deduct $10 from user balance
                    user.walletBalance -= 10;
                    await user.save();

                    // Send response to user
                    await addressCtx.reply(`Your SSN lookup ID is: ${ssnId}`);
                    await addressCtx.reply(`Your new wallet balance is: $${user.walletBalance.toFixed(2)}.`);
                    
                    // If balance is below $10 after lookup
                    if (user.walletBalance < 10) {
                        await addressCtx.reply('Your balance is now below $10. Please deposit more funds.');
                    }
                });
            });
        });
    });
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

// Bot start command: Check or create user and display wallet balance
bot.start(async (ctx) => {
    console.log('Bot started');
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
            walletBalance: 0,
            btcAddress,
            memo // Store the memo with the user
        });
        ctx.reply(`Welcome! Your wallet balance is $0. Please deposit $20 or more to this Bitcoin address: ${btcAddress}. Use the reference: ${memo} for verification.`);
    } else {
        // If user exists, display their current wallet balance
        ctx.reply(`Welcome back, ${user.username}! Your wallet balance is $${user.walletBalance.toFixed(2)}.`);
    }
});

// Middleware to handle balance checks when users send messages
// bot.on('text', async (ctx) => {
//     const chatId = ctx.chat.id;
//     const user = await User.findOne({ chatId });

//     if (user) {
//         ctx.reply(`Your current wallet balance is $${user.walletBalance.toFixed(2)}.`);
//     } else {
//         ctx.reply(`You don't have an account yet. Please use /start to create one.`);
//     }
//     ctx.reply(' Choose a command: /start, /balance, /deposit, /lookup');
// });

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
