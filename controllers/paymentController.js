const express = require('express');
const stripe = require('stripe')('your-stripe-secret-key'); // replace with your Stripe secret key

const router = express.Router();

// Endpoint to create a payment intent
router.post('/create-payment-intent', async (req, res) => {
    const { amount, currency } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
        });
        res.status(200).send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).send({error: error.message});
    }
});

module.exports = router;