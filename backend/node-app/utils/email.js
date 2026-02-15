const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// EXACT same sender used by booking emails - DO NOT CHANGE
const SENDER_EMAIL = 'support@peekaboojor.com';
const SENDER_NAME = 'Peekaboo';
const SENDER_FROM = `${SENDER_NAME} <${SENDER_EMAIL}>`;


const toDataUri = (absolutePath, mimeType = 'image/png') => {
  try {
    if (!fs.existsSync(absolutePath)) return '';
    const base64 = fs.readFileSync(absolutePath, 'base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    return '';
  }
};

const BRAND_LOGO_SRC = toDataUri(path.join(__dirname, '../../../frontend/src/assets/logo.png'));
const BRAND_MASCOT_SRC = toDataUri(path.join(__dirname, '../../../frontend/src/assets/mascot.png'));

/**
 * Send email using Resend - SINGLE function for ALL emails (bookings + verification)
 * This is the working pipeline used by booking confirmations
 * Returns full Resend response including id
 */
const sendEmail = async (to, subject, html) => {
  console.log(`[EMAIL_SENDING] to=${to} from=${SENDER_FROM} subject=${subject.substring(0, 50)}`);
  const result = await resend.emails.send({
    from: SENDER_FROM,
    replyTo: SENDER_EMAIL,
    to,
    subject,
    html
  });
  const emailId = result?.data?.id || result?.id || null;
  console.log(`[EMAIL_SENT] to=${to} id=${emailId}`);
  return result;
};

/**
 * Get email status from Resend by id
 * Returns status data or error message if API not supported
 */
const getEmailStatus = async (id) => {
  try {
    // Resend SDK supports .get() to retrieve email by id
    const result = await resend.emails.get(id);
    return { success: true, data: result?.data || result };
  } catch (error) {
    // If .get() is not available or fails
    if (error.message?.includes('is not a function')) {
      return { success: false, error: 'status_api_not_supported' };
    }
    return { success: false, error: error.message };
  }
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
  paymentPending: ({ userName, serviceName, serviceDate, serviceTime, totalPrice }) => ({
    subject: 'تأكيد طلبك في Peekaboo | Order Received (Pending Payment)',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f7fbff;padding:20px;color:#1f2937;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;padding:22px;">
          <p>مرحبًا ${userName || 'عميلنا العزيز'}،</p>
          <p>تم استلام طلبك لخدمة ${serviceName || 'Peekaboo'} في ${serviceDate || '-'} الساعة ${serviceTime || '-'}.<br/>
          المبلغ الإجمالي: ${totalPrice || 0} دينار<br/>
          حالة الدفع: <strong>قيد الانتظار</strong><br/>
          سيتم تأكيد طلبك عند اكتمال الدفع.</p>
          <hr style="margin:18px 0;border:none;border-top:1px solid #e5e7eb"/>
          <p>Hello ${userName || 'there'},</p>
          <p>We received your order for ${serviceName || 'Peekaboo'} on ${serviceDate || '-'} at ${serviceTime || '-'}.
          <br/>Total amount: ${totalPrice || 0} JOD
          <br/>Payment status: <strong>Pending</strong>
          <br/>Your order will be confirmed once payment is verified.</p>
        </div>
      </body>
      </html>
    `
  }),

  finalOrderConfirmation: ({ userName, orderType, serviceName, serviceDate, serviceTime, totalPrice }) => ({
    subject: 'تم تأكيد طلبك في Peekaboo | Payment Confirmed',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f4fff7;padding:20px;color:#1f2937;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;padding:22px;">
          <p>مرحبًا ${userName || 'عميلنا العزيز'}،</p>
          <p>تم تأكيد طلبك (${orderType || 'Peekaboo'}) لخدمة ${serviceName || 'Peekaboo'} في ${serviceDate || '-'} الساعة ${serviceTime || '-'}.<br/>
          المبلغ الإجمالي: ${totalPrice || 0} دينار<br/>
          حالة الدفع: <strong>تم تأكيد الدفع</strong><br/>
          تم تأكيد طلبك بنجاح، نتطلع لاستقبالك في Peekaboo!</p>
          <hr style="margin:18px 0;border:none;border-top:1px solid #e5e7eb"/>
          <p>Hello ${userName || 'there'},</p>
          <p>Your ${orderType || 'Peekaboo'} order for ${serviceName || 'Peekaboo'} on ${serviceDate || '-'} at ${serviceTime || '-'} has been confirmed.
          <br/>Total amount: ${totalPrice || 0} JOD
          <br/>Payment status: <strong>Payment Confirmed</strong>
          <br/>Thank you for choosing Peekaboo. We look forward to welcoming you!</p>
        </div>
      </body>
      </html>
    `
  }),

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
          .logo { text-align: center; margin-bottom: 10px; }
          .brand-logo { width: 220px; max-width: 90%; height: auto; }
          .mascot { display: block; margin: 0 auto 8px; width: 82px; height: auto; }
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
          <img src="${BRAND_MASCOT_SRC}" alt="Peekaboo Mascot" class="mascot"/>
          <div class="logo"><img src="${BRAND_LOGO_SRC}" alt="Peekaboo" class="brand-logo"/></div>
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
          .logo { text-align: center; margin-bottom: 10px; }
          .brand-logo { width: 220px; max-width: 90%; height: auto; }
          .mascot { display: block; margin: 0 auto 8px; width: 82px; height: auto; }
          .header { text-align: center; color: #F1C40F; font-size: 24px; margin-bottom: 20px; }
          .content { background: #FFF9E6; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center; color: #2C3E50; }
          .btn { display: inline-block; background: #F1C40F; color: #2C3E50; padding: 16px 32px; border-radius: 50px; text-decoration: none; margin: 20px 0; font-weight: bold; }
          .note { font-size: 14px; color: #7F8C8D; text-align: center; margin-top: 16px; }
          .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #EAEDED; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="${BRAND_MASCOT_SRC}" alt="Peekaboo Mascot" class="mascot"/>
          <div class="logo"><img src="${BRAND_LOGO_SRC}" alt="Peekaboo" class="brand-logo"/></div>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            margin: 0;
            padding: 24px 12px;
            font-family: 'Cairo', 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #e8f6ff 0%, #f3ecff 100%);
            direction: rtl;
            color: #1f2d3d;
          }
          .container {
            max-width: 620px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 16px 45px rgba(39, 90, 179, 0.16);
          }
          .hero {
            padding: 28px 28px 20px;
            text-align: center;
            background: linear-gradient(125deg, #0ea5e9 0%, #6366f1 55%, #a855f7 100%);
            color: #ffffff;
          }
          .logo { margin-bottom: 8px; }
          .brand-logo { width: 240px; max-width: 90%; height: auto; }
          .mascot { display: block; margin: 0 auto 8px; width: 90px; height: auto; }
          .header {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
          }
          .subheader {
            margin: 10px 0 0;
            font-size: 15px;
            color: rgba(255, 255, 255, 0.92);
          }
          .body {
            padding: 24px;
          }
          .content {
            background: linear-gradient(180deg, #fef9d7 0%, #fffef5 100%);
            border: 1px solid #fde68a;
            border-radius: 18px;
            padding: 18px;
            margin-bottom: 16px;
          }
          .row {
            margin: 0;
            padding: 11px 0;
            border-bottom: 1px dashed #f6d76b;
            font-size: 16px;
          }
          .row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 700;
            color: #334155;
          }
          .value {
            color: #0f172a;
          }
          .note {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1e3a8a;
            border-radius: 14px;
            padding: 12px 14px;
            font-size: 14px;
            line-height: 1.7;
          }
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="hero">
            <img src="${BRAND_MASCOT_SRC}" alt="Peekaboo Mascot" class="mascot"/>
            <div class="logo"><img src="${BRAND_LOGO_SRC}" alt="Peekaboo" class="brand-logo"/></div>
            <h1 class="header">🎉 تم تأكيد حجزك</h1>
            <p class="subheader">نحن متحمسون لاستقبالكم في تجربة لعب ممتعة وآمنة.</p>
          </div>
          <div class="body">
            <div class="content">
              <p class="row"><span class="label">الطفل:</span> <span class="value">${child?.name || 'غير محدد'}</span></p>
              <p class="row"><span class="label">التاريخ:</span> <span class="value">${slot?.date || booking?.date || 'غير محدد'}</span></p>
              <p class="row"><span class="label">الوقت:</span> <span class="value">${slot?.start_time || 'غير محدد'}</span></p>
              <p class="row"><span class="label">المدة:</span> <span class="value">${booking?.duration_hours || 1} ساعة</span></p>
              <p class="row"><span class="label">المبلغ:</span> <span class="value">${booking?.amount || 0} دينار</span></p>
            </div>
            <div class="note">يرجى الحضور قبل موعد الجلسة بـ 10 دقائق. لأي استفسار يمكنكم التواصل معنا عبر نفس البريد أو رقم خدمة العملاء.</div>
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
  birthdayConfirmation: (booking, slot, child, theme) => ({
    subject: '🎂 تأكيد حجز حفلة عيد الميلاد',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #E3F6FF; padding: 20px; direction: rtl; color: #2D3748; }
          .container { max-width: 640px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; border: 1px solid #D6EFFF; box-shadow: 0 8px 30px rgba(102, 169, 233, 0.14); }
          .hero { text-align: center; padding: 28px 26px 18px; background: linear-gradient(135deg, #D9232E 0%, #E59B35 45%, #F2E533 100%); }
          .logo { text-align: center; margin-bottom: 8px; }
          .brand-logo { width: 220px; max-width: 90%; height: auto; }
          .mascot { display: block; margin: 0 auto 8px; width: 82px; height: auto; }
          .header { text-align: center; color: #fff; font-size: 27px; margin: 0 0 8px; font-weight: 800; }
          .subheader { text-align: center; color: #fff; opacity: 0.95; margin: 0; font-size: 15px; }
          .body { padding: 24px; }
          .content { background: #FFF9E0; border: 1px solid #F2E533; border-radius: 16px; padding: 8px 16px; margin: 0 0 14px; }
          .row { margin: 0; padding: 11px 0; border-bottom: 1px dashed #EACF58; font-size: 16px; }
          .row:last-child { border-bottom: none; }
          .label { font-weight: 700; color: #1A5276; }
          .value { color: #2D3748; }
          .note { background: #E8FFF0; border: 1px solid #97C64A; color: #29521f; border-radius: 14px; padding: 12px 14px; font-size: 14px; line-height: 1.8; }
          .footer { text-align: center; color: #7F8C8D; font-size: 14px; padding: 20px 24px 24px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="hero">
            <img src="${BRAND_MASCOT_SRC}" alt="Peekaboo Mascot" class="mascot"/>
            <div class="logo"><img src="${BRAND_LOGO_SRC}" alt="Peekaboo" class="brand-logo"/></div>
            <h1 class="header">🎂 تم تأكيد حجز حفلة عيد الميلاد</h1>
            <p class="subheader">متحمسين نحتفل معكم في بيكابو 🎉</p>
          </div>
          <div class="body">
            <div class="content">
              <p class="row"><span class="label">رقم الحجز:</span> <span class="value">${booking?.booking_code || 'غير متوفر'}</span></p>
              <p class="row"><span class="label">اسم الطفل:</span> <span class="value">${child?.name || booking?.child_name || 'طفل'}</span></p>
              <p class="row"><span class="label">التاريخ:</span> <span class="value">${slot?.date || booking?.date || 'غير محدد'}</span></p>
              <p class="row"><span class="label">الوقت:</span> <span class="value">${slot?.start_time || 'غير محدد'}</span></p>
              <p class="row"><span class="label">الثيم:</span> <span class="value">${theme?.name || (booking?.is_custom ? 'طلب مخصص' : 'غير محدد')}</span></p>
              <p class="row"><span class="label">عدد الضيوف:</span> <span class="value">${booking?.guest_count || 0}</span></p>
              <p class="row"><span class="label">طريقة الدفع:</span> <span class="value">${booking?.payment_method === 'cash' ? 'نقداً' : booking?.payment_method === 'cliq' ? 'CliQ' : 'بطاقة'}</span></p>
              <p class="row"><span class="label">حالة الدفع:</span> <span class="value">${booking?.payment_status === 'pending_cash' ? 'بانتظار الدفع نقداً' : booking?.payment_status === 'pending_cliq' ? 'بانتظار تحويل CliQ' : 'مدفوع'}</span></p>
              <p class="row"><span class="label">المبلغ:</span> <span class="value">${booking?.amount || theme?.price || 0} دينار</span></p>
              <p class="row"><span class="label">ملاحظاتكم:</span> <span class="value">${booking?.special_notes || 'لا توجد'}</span></p>
              ${booking?.is_custom && booking?.custom_request ? `<p class="row"><span class="label">تفاصيل الطلب المخصص:</span> <span class="value">${booking.custom_request}</span></p>` : ''}
            </div>
            <div class="note">يرجى الحضور قبل الموعد بـ 15 دقيقة. في حال رغبتكم بتعديل تفاصيل الحفلة، يرجى التواصل معنا مع رقم الحجز الموضح أعلاه.</div>
          </div>
          <div class="footer">
            <p>فريق بيكابو 🎪</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  winback: ({ userName, ctaLink, couponCode }) => ({
    subject: '💛 مشتاقين نشوفكم في Peekaboo | We miss you!',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"></head>
      <body style="font-family:'Cairo','Segoe UI',Arial,sans-serif;background:#f7fbff;padding:20px;color:#1f2937;direction:rtl;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;">
          <h2 style="margin-top:0;color:#2563eb;">👋 أهلًا ${userName || 'بكم'}!</h2>
          <p>اشتقنالكم في بيكابو 🎪<br/>
          صار لنا فترة ما شفناكم، وحابين نرحّب فيكم من جديد بجلسة لعب مليانة مرح!</p>
          <p>احجزوا زيارتكم القادمة من خلال الرابط التالي:</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${ctaLink}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block;">احجز الآن</a>
          </p>
          ${couponCode ? `<p style="background:#fef9c3;border:1px solid #fde68a;padding:12px;border-radius:12px;"><strong>كود خصم مقترح:</strong> ${couponCode}</p>` : '<p style="color:#6b7280;">(يمكن إضافة كود خصم هنا لاحقًا)</p>'}
          <hr style="margin:18px 0;border:none;border-top:1px solid #e5e7eb"/>
          <p>Hello ${userName || 'there'},</p>
          <p>We miss you at Peekaboo! It has been a while since your last confirmed visit.
          Tap below to book your next session:</p>
          <p><a href="${ctaLink}">${ctaLink}</a></p>
        </div>
      </body>
      </html>
    `
  }),

  // Subscription confirmation
  subscriptionConfirmation: ({ userName, subscription, plan, child }) => ({
    subject: 'تأكيد اشتراكك في Peekaboo',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background: #E8FFE8; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; }
          .logo { text-align: center; margin-bottom: 10px; }
          .brand-logo { width: 220px; max-width: 90%; height: auto; }
          .mascot { display: block; margin: 0 auto 8px; width: 82px; height: auto; }
          .header { text-align: center; color: #27AE60; font-size: 24px; margin-bottom: 20px; }
          .content { background: #F0FFF0; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #7F8C8D; font-size: 14px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="${BRAND_MASCOT_SRC}" alt="Peekaboo Mascot" class="mascot"/>
          <div class="logo"><img src="${BRAND_LOGO_SRC}" alt="Peekaboo" class="brand-logo"/></div>
          <h1 class="header">⭐ تأكيد اشتراكك في Peekaboo</h1>
          <div class="content">
            <p><strong>الاسم:</strong> ${userName || 'عميلنا العزيز'}</p>
            <p><strong>الطفل:</strong> ${child?.name || 'طفل'}</p>
            <p><strong>الباقة:</strong> ${plan?.name_ar || plan?.name || ''}</p>
            <p><strong>المدة:</strong> ${plan?.valid_days || 30} يوم</p>
            <p><strong>عدد الزيارات:</strong> ${plan?.visits || subscription?.remaining_visits || 0}</p>
            <p><strong>تاريخ البدء:</strong> ${new Date(subscription?.created_at || Date.now()).toLocaleDateString('ar-EG')}</p>
            <p><strong>صالح حتى:</strong> ${subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('ar-EG') : ''}</p>
            <p><strong>المبلغ:</strong> ${subscription?.amount || plan?.price || 0} دينار</p>
            <p><strong>حالة الدفع:</strong> ${['pending_cash', 'pending_cliq'].includes(subscription?.payment_status) ? 'قيد الانتظار' : 'تم تأكيد الدفع'}</p>
            ${['pending_cash', 'pending_cliq'].includes(subscription?.payment_status) ? '<p>سيتم تأكيد الاشتراك عند اكتمال الدفع.</p>' : ''}
            <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb"/>
            <p><strong>Name:</strong> ${userName || 'Customer'}</p>
            <p><strong>Package:</strong> ${plan?.name || plan?.name_ar || ''} (${plan?.valid_days || 30} days)</p>
            <p><strong>Price:</strong> ${subscription?.amount || plan?.price || 0} JOD</p>
            <p><strong>Payment status:</strong> ${['pending_cash', 'pending_cliq'].includes(subscription?.payment_status) ? 'Pending' : 'Payment Confirmed'}</p>
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
