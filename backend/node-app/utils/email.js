const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// EXACT same sender used by booking emails - DO NOT CHANGE
const SENDER_EMAIL = 'support@peekaboojor.com';
const SENDER_NAME = 'Peekaboo';
const SENDER_FROM = `${SENDER_NAME} <${SENDER_EMAIL}>`;

/**
 * Send email using Resend - SINGLE function for ALL emails (bookings + verification)
 * This is the working pipeline used by booking confirmations
 */
const sendEmail = async (to, subject, html) => {
  const result = await resend.emails.send({
    from: SENDER_FROM,
    replyTo: SENDER_EMAIL,
    to,
    subject,
    html
  });
  return result;
};

/**
 * Send verification email - uses SAME sendEmail as bookings
 * Returns { success, id } or { success: false, error }
 */
const sendVerificationEmail = async (to, verifyUrl) => {
  const template = emailTemplates.emailVerification(verifyUrl);
  
  try {
    // Use EXACT same sendEmail function that booking emails use
    const result = await sendEmail(to, template.subject, template.html);
    const emailId = result?.data?.id || result?.id || 'sent';
    console.log(`[VERIFY_EMAIL_SENT] id=${emailId} to=${to}`);
    return { success: true, id: emailId };
  } catch (error) {
    console.error(`[VERIFY_EMAIL_SEND_FAIL] to=${to} error=${error.message}`);
    return { success: false, error: error.message };
  }
};

// Check if Resend is configured (for diagnostics)
const isResendConfigured = () => {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 10);
};

// Get sender info (for diagnostics)
const getSenderEmail = () => SENDER_EMAIL;
const getSenderFrom = () => SENDER_FROM;

// Email templates
const emailTemplates = {
  // Verification email - Arabic-first
  emailVerification: (verifyUrl) => ({
    subject: 'تأكيد حسابك في بيكابو',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #E8F6FF; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 40px rgba(52, 152, 219, 0.1); }
          .logo { text-align: center; font-size: 32px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; }
          .header { text-align: center; color: #26de81; font-size: 24px; margin-bottom: 20px; }
          .content { background: #E8F6FF; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center; color: #2C3E50; }
          .btn { display: inline-block; background: #26de81; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; margin: 20px 0; font-weight: bold; }
          .note { font-size: 14px; color: #7F8C8D; text-align: center; margin-top: 16px; }
          .link-fallback { font-size: 12px; color: #7F8C8D; word-break: break-all; margin-top: 12px; }
          .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #EAEDED; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎈 بيكابو</div>
          <h1 class="header">👋 أهلاً بك في بيكابو</h1>
          <div class="content">
            <p>شكراً لتسجيلك في بيكابو!</p>
            <p>اضغط على الزر لتأكيد بريدك الإلكتروني وتفعيل حسابك.</p>
          </div>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="btn">تأكيد البريد الإلكتروني</a>
          </p>
          <p class="link-fallback">أو انسخ الرابط التالي:<br/>${verifyUrl}</p>
          <p class="note">⚠️ سينتهي هذا الرابط خلال 24 ساعة.</p>
          <div class="footer">
            <p>فريق بيكابو 🎪</p>
            <p style="font-size: 12px; color: #ABB2B9;">للاستفسار: 0777775652</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Password reset email
  passwordReset: (resetUrl) => ({
    subject: '🔐 بيكابو - إعادة تعيين كلمة المرور',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #E8F6FF; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 40px rgba(52, 152, 219, 0.1); }
          .logo { text-align: center; font-size: 32px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; }
          .header { text-align: center; color: #F1C40F; font-size: 24px; margin-bottom: 20px; }
          .content { background: #FFF9E6; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center; color: #2C3E50; }
          .btn { display: inline-block; background: #F1C40F; color: #2C3E50; padding: 16px 32px; border-radius: 50px; text-decoration: none; margin: 20px 0; font-weight: bold; }
          .note { font-size: 14px; color: #7F8C8D; text-align: center; margin-top: 16px; }
          .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #EAEDED; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎈 بيكابو</div>
          <h1 class="header">🔐 إعادة تعيين كلمة المرور</h1>
          <div class="content">
            <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك في بيكابو.</p>
            <p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
          </div>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
          </p>
          <p class="note">⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط.<br>إذا لم تطلب إعادة التعيين، يرجى تجاهل هذا البريد.</p>
          <div class="footer">
            <p>فريق بيكابو 🎪</p>
            <p style="font-size: 12px; color: #ABB2B9;">للاستفسار: 0777775652</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Booking confirmation email (used by bookings.js)
  bookingConfirmation: (booking, slot, child) => ({
    subject: '🎉 تأكيد حجزك في بيكابو',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #E8F6FF; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; }
          .logo { text-align: center; font-size: 32px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; }
          .header { text-align: center; color: #F1C40F; font-size: 24px; margin-bottom: 20px; }
          .content { background: #FFF9E6; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎈 بيكابو</div>
          <h1 class="header">🎉 تم تأكيد حجزك</h1>
          <div class="content">
            <p><strong>الطفل:</strong> ${child?.name || 'غير محدد'}</p>
            <p><strong>التاريخ:</strong> ${slot?.date || booking?.date || 'غير محدد'}</p>
            <p><strong>الوقت:</strong> ${slot?.start_time || 'غير محدد'}</p>
            <p><strong>المدة:</strong> ${booking?.duration_hours || 1} ساعة</p>
            <p><strong>المبلغ:</strong> ${booking?.amount || 0} دينار</p>
          </div>
          <div class="footer">
            <p>فريق بيكابو 🎪</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Birthday booking confirmation
  birthdayConfirmation: (booking) => ({
    subject: '🎂 تأكيد حجز حفلة عيد الميلاد',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #FFE8F0; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; }
          .logo { text-align: center; font-size: 32px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; }
          .header { text-align: center; color: #E74C3C; font-size: 24px; margin-bottom: 20px; }
          .content { background: #FFF0F3; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎈 بيكابو</div>
          <h1 class="header">🎂 تم تأكيد حجز الحفلة</h1>
          <div class="content">
            <p><strong>اسم الطفل:</strong> ${booking?.child_name || 'غير محدد'}</p>
            <p><strong>التاريخ:</strong> ${booking?.date || 'غير محدد'}</p>
            <p><strong>الباقة:</strong> ${booking?.package_name || 'غير محدد'}</p>
            <p><strong>عدد الأطفال:</strong> ${booking?.guest_count || 0}</p>
            <p><strong>المبلغ:</strong> ${booking?.amount || 0} دينار</p>
          </div>
          <div class="footer">
            <p>فريق بيكابو 🎪</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Subscription confirmation
  subscriptionConfirmation: (subscription, plan) => ({
    subject: '⭐ تأكيد اشتراكك في بيكابو',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #E8FFE8; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; }
          .logo { text-align: center; font-size: 32px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; }
          .header { text-align: center; color: #27AE60; font-size: 24px; margin-bottom: 20px; }
          .content { background: #F0FFF0; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎈 بيكابو</div>
          <h1 class="header">⭐ تم تفعيل اشتراكك</h1>
          <div class="content">
            <p><strong>الباقة:</strong> ${plan?.name || 'غير محدد'}</p>
            <p><strong>عدد الزيارات:</strong> ${plan?.visits || subscription?.remaining_visits || 0}</p>
            <p><strong>صالح حتى:</strong> ${subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
            <p><strong>المبلغ:</strong> ${subscription?.amount || plan?.price || 0} دينار</p>
          </div>
          <div class="footer">
            <p>فريق بيكابو 🎪</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

module.exports = { 
  sendEmail, 
  sendVerificationEmail, 
  emailTemplates, 
  isResendConfigured, 
  getSenderEmail,
  getSenderFrom
};
