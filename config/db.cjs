const mongoose = require('mongoose');
const { MONGODB_URI } = require('./constants.cjs');

async function connectDB() {
    console.log(`Connecting to MongoDB...`, MONGODB_URI);
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = connectDB;
