const express = require('express');
const { handleWebhook } = require('../services/BlockchainService');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        await handleWebhook(req.body);
        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
