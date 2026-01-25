const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

const sendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject,
      html
    });
    console.log('Email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

const emailTemplates = {
  bookingConfirmation: (booking, slot, child) => ({
    subject: '🎉 Peekaboo - Booking Confirmed!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Nunito', Arial, sans-serif; background: #FFFBEB; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; }
          .header { text-align: center; color: #8B5CF6; }
          .info { background: #F3E8FF; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .qr-box { text-align: center; margin: 24px 0; }
          .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">🎪 Booking Confirmed!</h1>
          <p>Hi! Your play session has been booked at Peekaboo!</p>
          <div class="info">
            <p><strong>Child:</strong> ${child.name}</p>
            <p><strong>Date:</strong> ${slot.date}</p>
            <p><strong>Time:</strong> ${slot.start_time}</p>
            <p><strong>Booking Code:</strong> ${booking.booking_code}</p>
          </div>
          <div class="qr-box">
            <p>Show this QR code at reception:</p>
            <img src="${booking.qr_code}" alt="QR Code" style="max-width: 200px;" />
          </div>
          <div class="footer">
            <p>See you at Peekaboo! 🎈</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  birthdayConfirmation: (booking, slot, child, theme) => ({
    subject: '🎂 Peekaboo - Birthday Party Booked!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Nunito', Arial, sans-serif; background: #FFFBEB; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; }
          .header { text-align: center; color: #EC4899; }
          .info { background: #FCE7F3; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">🎂 Birthday Party Booked!</h1>
          <p>Get ready to celebrate at Peekaboo!</p>
          <div class="info">
            <p><strong>Birthday Child:</strong> ${child.name}</p>
            <p><strong>Date:</strong> ${slot.date}</p>
            <p><strong>Time:</strong> ${slot.start_time}</p>
            <p><strong>Theme:</strong> ${theme ? theme.name : 'Custom Request'}</p>
            <p><strong>Booking Code:</strong> ${booking.booking_code}</p>
          </div>
          <div class="footer">
            <p>Let's make it a party to remember! 🎉</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  subscriptionConfirmation: (subscription, plan, child) => ({
    subject: '⭐ Peekaboo - Subscription Purchased!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Nunito', Arial, sans-serif; background: #FFFBEB; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; }
          .header { text-align: center; color: #FBBF24; }
          .info { background: #FEF3C7; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .note { background: #F3E8FF; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; }
          .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">⭐ Subscription Purchased!</h1>
          <p>Your Peekaboo subscription is ready to use!</p>
          <div class="info">
            <p><strong>Child:</strong> ${child.name}</p>
            <p><strong>Plan:</strong> ${plan.name}</p>
            <p><strong>Visits:</strong> ${plan.visits}</p>
          </div>
          <div class="note">
            <strong>Important:</strong> Your 30-day validity period starts when you first check in at reception, not from purchase date. So use it whenever you're ready!
          </div>
          <div class="footer">
            <p>Enjoy unlimited fun at Peekaboo! 🌟</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (resetUrl) => ({
    subject: '🔐 Peekaboo - Password Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Nunito', Arial, sans-serif; background: #FFFBEB; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; }
          .header { text-align: center; color: #8B5CF6; }
          .btn { display: inline-block; background: #8B5CF6; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">🔐 Password Reset</h1>
          <p>You requested a password reset for your Peekaboo account.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </p>
          <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p>Peekaboo Team 🎪</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
