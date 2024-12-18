const axios = require('axios');
const Transaction = require('../models/Transaction.cjs');
const User = require('../models/User.cjs');
const { BLOCKCYPHER_API_URL, API_TOKEN, REQUIRED_CONFIRMATIONS, BTC_ADDRESS, MIN_DEPOSIT_AMOUNT } = require('../config/constants.cjs');

// Register webhook to receive notifications on confirmed transactions
async function registerWebhook() {
    try {
        const webhookData = {
            event: 'confirmed-tx',
            address: BTC_ADDRESS, // This is the Bitcoin address shared by all users
            url: 'https://assassins-ssn.onrender.com', // Replace with your webhook URL
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

// Handle incoming webhook from BlockCypher for deposit verification
async function handleWebhook(data) {
    try {
        // Log the entire transaction data to the console for inspection
        console.log('Received transaction data:', req.body);


        const tx = data; // Transaction data from BlockCypher
        const txHash = tx.hash;
        const amountInBTC = tx.total / 1e8; // Convert from satoshis to BTC
        const amountInUSD = amountInBTC * 20000; // Example BTC-USD rate (can be dynamic)


         // Check if the deposit meets the minimum threshold
         if (amountInUSD < MIN_DEPOSIT_AMOUNT) {
            console.log(`Deposit of $${amountInUSD} is below the minimum threshold of $${MIN_DEPOSIT_AMOUNT}.`);
            return; // Exit without processing if the deposit is too small
        }

          // Log to inspect tx outputs and inputs to find memo
          console.log('Transaction Outputs:', tx.outputs);
          console.log('Transaction Inputs:', tx.inputs);

        const existingTransaction = await Transaction.findOne({ transactionId: txHash });
        if (existingTransaction) return; // If transaction already processed, skip


        // Find the user by matching their Telegram username (included in memo)
        const user = await User.findOne({ memo: tx.memo });
        if (user) {
            await Transaction.create({
                userId: user._id,
                transactionId: txHash,
                amount: amountInUSD,
                status: 'completed',
            });

            user.walletBalance += amountInUSD; // Add deposit to user's wallet
            await user.save();

            console.log(`Deposit confirmed for User ${user.username}: $${amountInUSD}`);
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
    }
}

module.exports = { registerWebhook, handleWebhook };
