const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'wallet', 'bank_transfer']
  },
  cardDetails: {
    last4: String,
    brand: String,
    expMonth: Number,
    expYear: Number
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  receiptUrl: String,
  metadata: mongoose.Schema.Types.Mixed,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);