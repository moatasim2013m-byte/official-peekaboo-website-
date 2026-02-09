const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const fromEmail = process.env.SENDER_EMAIL || process.env.RESEND_FROM || 'Peekaboo <support@peekaboojor.com>';
    console.log('EMAIL_FROM_USED', fromEmail);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html
    });
    
    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }
    
    console.log('Email sent successfully to:', to, '- ID:', data?.id);
    return data; // Return data object containing email id
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

const emailTemplates = {
  passwordReset: (resetUrl) => {
    console.log('🔗 Password reset link generated:', resetUrl);
    return {
      subject: 'إعادة تعيين كلمة المرور - بيكابو',
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
            .greeting { font-size: 18px; color: #2C3E50; margin-bottom: 16px; }
            .content { background: #FFF9E6; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center; color: #2C3E50; }
            .btn { display: inline-block; background: #F1C40F; color: #2C3E50; padding: 16px 32px; border-radius: 50px; text-decoration: none; margin: 20px 0; font-weight: bold; }
            .note { font-size: 14px; color: #7F8C8D; text-align: center; margin-top: 16px; }
            .link-fallback { font-size: 12px; color: #7F8C8D; word-break: break-all; margin-top: 16px; text-align: center; }
            .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #EAEDED; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🎈 بيكابو</div>
            <h1 class="header">🔐 إعادة تعيين كلمة المرور</h1>
            <p class="greeting">مرحبًا،</p>
            <div class="content">
              <p><strong>لقد تلقينا طلب إعادة تعيين كلمة المرور</strong> لحسابك في بيكابو.</p>
              <p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
            </div>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
            </p>
            <p class="note">
              ⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط.<br>
              <strong>إذا لم تطلب ذلك، تجاهل هذه الرسالة</strong> - حسابك آمن ولن يتم تغييره.
            </p>
            <p class="link-fallback">
              أو انسخ هذا الرابط والصقه في المتصفح:<br>
              <a href="${resetUrl}" style="color: #3498DB;">${resetUrl}</a>
            </p>
            <div class="footer">
              <p>فريق بيكابو 🎪</p>
              <p style="font-size: 12px; color: #ABB2B9;">للاستفسار: 0777775652</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
};

module.exports = { sendEmail, emailTemplates };
