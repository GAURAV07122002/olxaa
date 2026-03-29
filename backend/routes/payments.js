const express = require('express');
const { 
  createPaymentIntent, 
  confirmPayment, 
  getPaymentHistory, 
  getPaymentDetails, 
  requestRefund, 
  handleWebhook 
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/:paymentId', protect, getPaymentDetails);
router.post('/:paymentId/refund', protect, requestRefund);
router.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

module.exports = router;