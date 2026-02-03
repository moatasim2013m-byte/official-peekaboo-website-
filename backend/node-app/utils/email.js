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
  bookingConfirmation: (booking, slot, child) => {
    const paymentMethodLabel = {
      'cash': 'نقداً عند الاستقبال',
      'cliq': 'تحويل بنكي CliQ',
      'card': 'بطاقة ائتمان'
    }[booking.payment_method] || 'بطاقة ائتمان';
    
    const paymentStatusLabel = {
      'paid': '✅ تم الدفع',
      'pending_cash': '⏳ بانتظار الدفع عند الاستقبال',
      'pending_cliq': '⏳ بانتظار التحويل البنكي'
    }[booking.payment_status] || '✅ تم الدفع';
    
    return {
      subject: '🎉 بيكابو - تأكيد الحجز!',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #E8F6FF; padding: 20px; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 40px rgba(52, 152, 219, 0.1); }
            .header { text-align: center; color: #F1C40F; font-size: 28px; margin-bottom: 20px; }
            .logo { text-align: center; font-size: 32px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; }
            .info { background: #FFF9E6; border-radius: 16px; padding: 20px; margin: 20px 0; border-right: 4px solid #F1C40F; }
            .info p { margin: 8px 0; color: #2C3E50; }
            .payment-box { background: ${booking.payment_status === 'paid' ? '#D5F5E3' : '#FCF3CF'}; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center; }
            .qr-box { text-align: center; margin: 24px 0; background: #F8F9FA; border-radius: 16px; padding: 20px; }
            .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #EAEDED; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🎈 بيكابو</div>
            <h1 class="header">تم تأكيد الحجز!</h1>
            <p style="text-align: center; color: #566573;">مرحباً! تم حجز جلسة اللعب في بيكابو بنجاح.</p>
            <div class="info">
              <p><strong>👶 الطفل:</strong> ${child.name}</p>
              <p><strong>📅 التاريخ:</strong> ${slot.date}</p>
              <p><strong>🕐 الوقت:</strong> ${slot.start_time}</p>
              <p><strong>⏱️ المدة:</strong> ${booking.duration_hours || 2} ساعة</p>
              <p><strong>💰 المبلغ:</strong> ${booking.amount} دينار</p>
              <p><strong>🔖 رقم الحجز:</strong> ${booking.booking_code}</p>
            </div>
            <div class="payment-box">
              <p style="margin: 0; font-weight: bold;">💳 طريقة الدفع: ${paymentMethodLabel}</p>
              <p style="margin: 8px 0 0 0;">${paymentStatusLabel}</p>
            </div>
            <div class="qr-box">
              <p style="margin-bottom: 12px; color: #566573;">أظهر هذا الكود عند الاستقبال:</p>
              <img src="${booking.qr_code}" alt="QR Code" style="max-width: 180px;" />
            </div>
            <div class="footer">
              <p>نراك قريباً في بيكابو! 🎪</p>
              <p style="font-size: 12px; color: #ABB2B9;">للاستفسار: 0777775652</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  birthdayConfirmation: (booking, slot, child, theme) => {
    const paymentMethodLabel = {
      'cash': 'نقداً عند الاستقبال',
      'cliq': 'تحويل بنكي CliQ',
      'card': 'بطاقة ائتمان'
    }[booking.payment_method] || 'بطاقة ائتمان';
    
    const paymentStatusLabel = {
      'paid': '✅ تم الدفع',
      'pending_cash': '⏳ بانتظار الدفع عند الاستقبال',
      'pending_cliq': '⏳ بانتظار التحويل البنكي'
    }[booking.payment_status] || '✅ تم الدفع';
    
    return {
      subject: '🎂 بيكابو - تأكيد حجز حفلة عيد الميلاد!',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #FCE7F3; padding: 20px; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 40px rgba(255, 107, 157, 0.1); }
            .header { text-align: center; color: #FF6B9D; font-size: 28px; margin-bottom: 20px; }
            .logo { text-align: center; font-size: 32px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; }
            .info { background: #FFF0F5; border-radius: 16px; padding: 20px; margin: 20px 0; border-right: 4px solid #FF6B9D; }
            .info p { margin: 8px 0; color: #2C3E50; }
            .payment-box { background: ${booking.payment_status === 'paid' ? '#D5F5E3' : '#FCF3CF'}; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center; }
            .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #EAEDED; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🎈 بيكابو</div>
            <h1 class="header">🎂 تم حجز حفلة عيد الميلاد!</h1>
            <p style="text-align: center; color: #566573;">استعدوا للاحتفال في بيكابو!</p>
            <div class="info">
              <p><strong>👶 الطفل:</strong> ${child.name}</p>
              <p><strong>📅 التاريخ:</strong> ${slot.date}</p>
              <p><strong>🕐 الوقت:</strong> ${slot.start_time}</p>
              <p><strong>🎨 الثيم:</strong> ${theme ? theme.name : 'طلب خاص'}</p>
              <p><strong>💰 المبلغ:</strong> ${booking.amount || (theme ? theme.price : 'سيتم التواصل')} دينار</p>
              <p><strong>🔖 رقم الحجز:</strong> ${booking.booking_code}</p>
            </div>
            <div class="payment-box">
              <p style="margin: 0; font-weight: bold;">💳 طريقة الدفع: ${paymentMethodLabel}</p>
              <p style="margin: 8px 0 0 0;">${paymentStatusLabel}</p>
            </div>
            <div class="footer">
              <p>سنجعلها حفلة لا تُنسى! 🎉</p>
              <p style="font-size: 12px; color: #ABB2B9;">للاستفسار: 0777775652</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  subscriptionConfirmation: (subscription, plan, child) => {
    const paymentMethodLabel = {
      'cash': 'نقداً عند الاستقبال',
      'cliq': 'تحويل بنكي CliQ',
      'card': 'بطاقة ائتمان'
    }[subscription.payment_method] || 'بطاقة ائتمان';
    
    const paymentStatusLabel = {
      'paid': '✅ تم الدفع',
      'pending_cash': '⏳ بانتظار الدفع عند الاستقبال',
      'pending_cliq': '⏳ بانتظار التحويل البنكي'
    }[subscription.payment_status] || '✅ تم الدفع';
    
    return {
      subject: '⭐ بيكابو - تأكيد الاشتراك!',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #FFF9E6; padding: 20px; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 40px rgba(241, 196, 15, 0.1); }
            .header { text-align: center; color: #F1C40F; font-size: 28px; margin-bottom: 20px; }
            .logo { text-align: center; font-size: 32px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; }
            .info { background: #FEF9E7; border-radius: 16px; padding: 20px; margin: 20px 0; border-right: 4px solid #F1C40F; }
            .info p { margin: 8px 0; color: #2C3E50; }
            .payment-box { background: ${subscription.payment_status === 'paid' ? '#D5F5E3' : '#FCF3CF'}; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center; }
            .note { background: #E8F6FF; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; color: #2C3E50; }
            .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #EAEDED; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🎈 بيكابو</div>
            <h1 class="header">⭐ تم تفعيل الاشتراك!</h1>
            <p style="text-align: center; color: #566573;">اشتراكك في بيكابو جاهز للاستخدام!</p>
            <div class="info">
              <p><strong>👶 الطفل:</strong> ${child.name}</p>
              <p><strong>📦 الباقة:</strong> ${plan.name}</p>
              <p><strong>🎟️ عدد الزيارات:</strong> ${plan.visits} زيارة</p>
              <p><strong>💰 السعر:</strong> ${plan.price} دينار</p>
            </div>
            <div class="payment-box">
              <p style="margin: 0; font-weight: bold;">💳 طريقة الدفع: ${paymentMethodLabel}</p>
              <p style="margin: 8px 0 0 0;">${paymentStatusLabel}</p>
            </div>
            <div class="note">
              <strong>⚠️ ملاحظة مهمة:</strong><br>
              تبدأ صلاحية الـ 30 يوم من أول زيارة وليس من تاريخ الشراء.<br>
              صالحة من الأحد إلى الخميس فقط.
            </div>
            <div class="footer">
              <p>استمتع بأوقات لا تُنسى في بيكابو! 🌟</p>
              <p style="font-size: 12px; color: #ABB2B9;">للاستفسار: 0777775652</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

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
