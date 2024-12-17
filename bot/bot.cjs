const { Telegraf } = require('telegraf');
const User = require('../models/User.cjs');
const { BOT_TOKEN } = require('../config/constants.cjs');

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    let user = await User.findOne({ chatId });

    if (!user) {
        user = await User.create({ chatId, walletBalance: 0, btcAddress: 'bc1qsj55rn9wl8xghdaskcj8m8mrsjyax6h6w6c0xx' });
        ctx.reply(`Welcome! Your wallet balance is $0.`);
    } else {
        ctx.reply(`Welcome back! Your wallet balance is $${user.walletBalance.toFixed(2)}.`);
    }
});

bot.launch();

console.log('Bot is running...');

module.exports = bot;
