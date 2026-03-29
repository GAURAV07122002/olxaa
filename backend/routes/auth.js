const express = require('express');
const { 
  register, 
  login, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  getCurrentUser 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.get('/me', protect, getCurrentUser);

module.exports = router;