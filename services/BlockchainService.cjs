const axios = require('axios');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { BLOCKCYPHER_API_URL, API_TOKEN, BTC_ADDRESS, REQUIRED_CONFIRMATIONS } = require('../config/constants');

async function registerWebhook() {
    try {
        const webhookData = {
            event: 'confirmed-tx',
            address: BTC_ADDRESS,
            url: 'https://yourserver.com/webhook', // Replace with your URL
        };

        const response = await axios.post(
            `${BLOCKCYPHER_API_URL}/hooks?token=${API_TOKEN}`,
            webhookData
        );

        console.log('Webhook registered:', response.data);
    } catch (error) {
        console.error('Error registering webhook:', error);
    }
}

async function handleWebhook(data) {
    try {
        const tx = data; // Transaction data from BlockCypher
        const amountInBTC = tx.total / 1e8; // Convert from satoshis
        const amountInUSD = amountInBTC * 20000; // Example BTC-USD rate

        const existingTransaction = await Transaction.findOne({ transactionId: tx.hash });
        if (existingTransaction) return;

        const user = await User.findOne({ btcAddress: tx.inputs[0].addresses[0] });
        if (user) {
            await Transaction.create({
                userId: user._id,
                transactionId: tx.hash,
                amount: amountInUSD,
                status: 'completed',
            });

            user.walletBalance += amountInUSD;
            await user.save();

            console.log(`Deposit confirmed for User ${user.chatId}: $${amountInUSD}`);
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
    }
}

module.exports = { registerWebhook, handleWebhook };
