const dotenv = require('dotenv')

dotenv.config();




module.exports = {
    MONGODB_URI: process.env.MONGODB_URI,
    BLOCKCYPHER_API_URL: process.env.BLOCKCYPHER_API_URL,
    BTC_ADDRESS: process.env.BTC_ADDRESS,
    API_TOKEN: process.env.API_TOKEN,
    BOT_TOKEN: process.env.BOT_TOKEN,
    REQUIRED_CONFIRMATIONS: process.env.REQUIRED_CONFIRMATIONS,
    MIN_DEPOSIT_AMOUNT: 20
};
