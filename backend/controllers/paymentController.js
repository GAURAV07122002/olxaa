const Payment = require('../models/Payment');
const Product = require('../models/Product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

// @desc Create Payment Intent
// @route POST /api/payments/create-intent
// @access Private
exports.createPaymentIntent = async (req, res) => {
  try {
    const { productId, amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an amount'
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Amount in cents
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        productId: productId || 'no_product'
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Confirm Payment
// @route POST /api/payments/confirm
// @access Private
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, productId, amount } = req.body;

    if (!paymentIntentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment intent ID and amount'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: paymentIntent.status
      });
    }

    // Create payment record in database
    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

    if (!payment) {
      payment = await Payment.create({
        user: req.user.id,
        product: productId,
        amount,
        currency: 'USD',
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: paymentIntent.charges.data[0]?.id,
        status: 'completed',
        paymentMethod: 'card',
        transactionId: crypto.randomBytes(8).toString('hex').toUpperCase(),
        metadata: paymentIntent.metadata
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Get Payment History
// @route GET /api/payments/history
// @access Private
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: req.user.id })
      .populate('product', 'title thumbnail price')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      pages: Math.ceil(total / limit),
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Get Payment Details
// @route GET /api/payments/:paymentId
// @access Private
exports.getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('user', 'firstName lastName email')
      .populate('product', 'title thumbnail price seller')
      .populate('seller', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (payment.user._id.toString() !== req.user.id && payment.seller._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Request Refund
// @route POST /api/payments/:paymentId/refund
// @access Private
exports.requestRefund = async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this payment'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    // Process refund with Stripe
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer'
      });

      payment.status = 'refunded';
      payment.refundAmount = payment.amount;
      payment.refundReason = reason;
      await payment.save();

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        refundId: refund.id,
        payment
      });
    } catch (stripeError) {
      res.status(400).json({
        success: false,
        message: 'Refund processing failed: ' + stripeError.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Webhook Handler (for Stripe events)
// @route POST /api/payments/webhook
// @access Public
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('PaymentIntent succeeded:', event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        console.log('PaymentIntent failed:', event.data.object.id);
        break;
      case 'charge.refunded':
        console.log('Charge refunded:', event.data.object.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Webhook Error: ${error.message}`
    });
  }
};
