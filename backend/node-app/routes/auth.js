const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { getJwtSecret, authMiddleware } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      password_hash,
      name,
      phone: phone ? phone.replace(/\s/g, '') : null,
      role: 'parent'
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('FORGOT_PASSWORD request for email:', email);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      console.log('FORGOT_PASSWORD: email not found (no action taken)');
      return res.json({ ok: true, message: 'If the email exists, a reset link will be sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.reset_token = resetToken;
    user.reset_token_expires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'https://peekaboojor.com';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    const template = emailTemplates.passwordReset(resetLink);
    
    // Debug: verify Resend configuration
    console.log('RESEND_FROM=' + (process.env.RESEND_FROM || 'MISSING'));
    console.log('RESEND_KEY_PRESENT=' + Boolean(process.env.RESEND_API_KEY));
    
    try {
      const emailData = await sendEmail(user.email, template.subject, template.html);
      console.log('RESEND_SENT id=' + emailData.id);
    } catch (emailError) {
      console.error('RESEND_FAIL', emailError.message || emailError);
      // Continue and return success to user (don't reveal email sending failure)
    }

    res.json({ ok: true, message: 'If the email exists, a reset link will be sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const user = await User.findOne({
      reset_token: token,
      reset_token_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password_hash = await bcrypt.hash(password, 10);
    user.reset_token = undefined;
    user.reset_token_expires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

module.exports = router;
