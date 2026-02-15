const express = require('express');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const inviteLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => `ai-invite:${req.userId || req.ip}`,
  message: { error: 'تم الوصول للحد اليومي (5 طلبات). حاول مجدداً غداً.' }
});

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash';

const parseGeminiJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;

  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

router.post('/invite', authMiddleware, inviteLimiter, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'خدمة إنشاء النصوص غير متاحة حالياً' });
  }

  const childName = typeof req.body?.childName === 'string' ? req.body.childName.trim() : '';
  const age = Number.isFinite(Number(req.body?.age)) ? Number(req.body.age) : null;
  const theme = typeof req.body?.theme === 'string' ? req.body.theme.trim() : '';
  const extraDetails = typeof req.body?.extraDetails === 'string' ? req.body.extraDetails.trim() : '';

  const prompt = [
    'أنت كاتب محتوى عربي مبدع لحفلات أطفال.',
    'اكتب نص دعوة عيد ميلاد + كابشن إنستغرام (نص فقط) باللهجة العربية المفهومة واللطيفة.',
    'أعد النتيجة بصيغة JSON صالحة فقط بدون أي شرح خارجي.',
    'المفاتيح المطلوبة:',
    '- inviteArabic: نص دعوة عربي قصير وواضح (3-5 أسطر).',
    '- inviteEnglish: نسخة إنجليزية اختيارية مختصرة (قد تكون فارغة).',
    '- igCaptionArabic: كابشن عربي جذاب للانستغرام.',
    '- hashtags: مصفوفة من 5 إلى 8 هاشتاغات مناسبة.',
    '',
    'تفاصيل الحفلة:',
    `- اسم الطفل: ${childName || 'غير محدد'}`,
    `- العمر: ${age || 'غير محدد'}`,
    `- الثيم: ${theme || 'عيد ميلاد مرح للأطفال'}`,
    `- ملاحظات إضافية: ${extraDetails || 'بدون ملاحظات إضافية'}`,
    '',
    'الشروط:',
    '- لا تذكر معلومات غير مذكورة في التفاصيل.',
    '- النص عربي أولاً ومناسب للعائلات.',
    '- لا تتضمن أي روابط.'
  ].join('\n');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(TEXT_MODEL)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          maxOutputTokens: 500,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('Gemini invite generation failed:', response.status, details);
      if (response.status === 429) {
        return res.status(429).json({ error: 'تم تجاوز حد خدمة الذكاء الاصطناعي، حاول لاحقاً' });
      }
      return res.status(502).json({ error: 'تعذر إنشاء النص حالياً، حاول مرة أخرى' });
    }

    const payload = await response.json();
    const modelText = payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n') || '';
    const parsed = parseGeminiJson(modelText);

    if (!parsed || typeof parsed !== 'object') {
      return res.status(502).json({ error: 'استجابة الذكاء الاصطناعي غير صالحة' });
    }

    const inviteArabic = typeof parsed.inviteArabic === 'string' ? parsed.inviteArabic.trim() : '';
    const inviteEnglish = typeof parsed.inviteEnglish === 'string' ? parsed.inviteEnglish.trim() : '';
    const igCaptionArabic = typeof parsed.igCaptionArabic === 'string' ? parsed.igCaptionArabic.trim() : '';
    const hashtags = Array.isArray(parsed.hashtags)
      ? parsed.hashtags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter(Boolean)
        .slice(0, 10)
      : [];

    if (!inviteArabic || !igCaptionArabic) {
      return res.status(502).json({ error: 'تعذر إنشاء نص مناسب، حاول مرة أخرى' });
    }

    return res.json({
      inviteArabic,
      inviteEnglish,
      igCaptionArabic,
      hashtags
    });
  } catch (error) {
    console.error('AI invite route error:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء النص' });
  }
});

module.exports = router;
