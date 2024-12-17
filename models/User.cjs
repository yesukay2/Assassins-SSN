const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 },
    btcAddress: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
