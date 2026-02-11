const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { getJwtSecret, authMiddleware } = require('../middleware/auth');
const { sendVerificationEmail, isResendConfigured, getSenderEmail, getSenderFrom } = require('../utils/email');

const router = express.Router();

// Email delivery diagnostic endpoint (no auth, no secrets exposed)
router.get('/email-debug', (req, res) => {
  res.json({
    has_resend_key: isResendConfigured(),
    sender_email: getSenderEmail(),
    sender_from: getSenderFrom(),
    frontend_url: process.env.FRONTEND_URL || null
  });
});

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
    
    console.log('REGISTER_SUCCESS', user.email);

    // Send registration confirmation email (non-blocking)
    const loginUrl = `${process.env.FRONTEND_URL || 'https://peekaboojor.com'}/login`;
    const template = emailTemplates.registrationConfirmation(loginUrl);
    
    try {
      await sendEmail(user.email, template.subject, template.html);
      console.log('REGISTER_EMAIL_SENT', user.email);
    } catch (emailError) {
      console.error('REGISTER_EMAIL_ERROR', emailError.message || emailError);
      // Continue - don't block registration if email fails
    }

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || origin_url || req.headers.origin || 'https://peekaboo-wonderland.preview.emergentagent.com';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}`;
    
    const emailResult = await sendVerificationEmail(user.email, verifyUrl);

    if (emailResult.success) {
      res.status(201).json({
        message: 'تم إرسال رابط التفعيل إلى بريدك الإلكتروني',
        email_sent: true
      });
    } else {
      res.status(201).json({
        message: 'تم إنشاء الحساب، لكن تعذر إرسال رسالة التفعيل. الرجاء المحاولة لاحقاً.',
        email_sent: false
      });
    }
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
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email required' });
    }

    console.log('FORGOT_START', email);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('FORGOT_NO_USER');
      // Don't reveal if email exists
      return res.status(200).json({ ok: true, message: 'If the email exists, a reset link will be sent' });
    }

    console.log('FORGOT_USER_FOUND');

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.reset_token = resetToken;
    user.reset_token_expires = new Date(Date.now() + 3600000); // 1 hour (60 minutes)
    await user.save();

    const baseUrl = process.env.FRONTEND_URL; // Required env var validated at startup
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    console.log('FORGOT_LINK_OK', resetLink);
    
    const template = emailTemplates.passwordReset(resetLink);
    
    try {
      await sendEmail(user.email, template.subject, template.html);
      console.log('FORGOT_EMAIL_SENT', user.email);
    } catch (emailError) {
      console.error('FORGOT_EMAIL_ERROR', emailError.message || emailError);
      // Continue and return success to user (don't reveal email sending failure)
    }

    return res.status(200).json({ ok: true, message: 'If the email exists, a reset link will be sent' });
  } catch (error) {
    console.error('FORGOT_PASSWORD_UNHANDLED_ERROR', error);
    // Always return success even on error - don't reveal system state
    return res.status(200).json({ ok: true, message: 'If the email exists, a reset link will be sent' });
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
