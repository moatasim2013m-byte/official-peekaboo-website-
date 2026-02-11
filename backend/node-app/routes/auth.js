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
    const { email, password, name, phone, origin_url } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const password_hash = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      password_hash,
      name,
      phone: phone ? phone.replace(/\s/g, '') : null,
      role: 'parent',
      email_verified: false,
      email_verify_token: verifyToken,
      email_verify_expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await user.save();

    // Send verification email
    try {
      const frontendUrl = origin_url || process.env.FRONTEND_URL || 'https://peekaboo-wonderland.preview.emergentagent.com';
      const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}`;
      const template = emailTemplates.emailVerification(verifyUrl);
      await sendEmail(user.email, template.subject, template.html);
    } catch (emailError) {
      console.error('Verification email send error:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.',
      email_sent: true
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

    // Check if email is verified (skip for admin/staff)
    if (!user.email_verified && user.role === 'parent') {
      return res.status(403).json({ error: 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول' });
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

// Verify Email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'الرابط غير صالح' });
    }

    const user = await User.findOne({ email_verify_token: token });
    
    if (!user) {
      return res.status(400).json({ error: 'الرابط غير صالح' });
    }

    if (user.email_verify_expires && user.email_verify_expires < new Date()) {
      return res.status(400).json({ error: 'الرابط منتهي الصلاحية' });
    }

    user.email_verified = true;
    user.email_verify_token = null;
    user.email_verify_expires = null;
    await user.save();

    res.json({ success: true, message: 'تم تفعيل الحساب بنجاح' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'فشل تأكيد البريد الإلكتروني' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, origin_url } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link will be sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.reset_token = resetToken;
    user.reset_token_expires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetUrl = `${origin_url || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const template = emailTemplates.passwordReset(resetUrl);
    await sendEmail(user.email, template.subject, template.html);

    res.json({ message: 'If the email exists, a reset link will be sent' });
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
