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
})
