const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    walletBalance: { type: Number, default: 0 },
    btcAddress: { type: String, required: true },
    memo: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
