const express = require('express');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const dailyInviteLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.userId || 'anon'}:${req.ip}`,
  skip: (req) => req.method === 'OPTIONS',
  message: { error: 'تم الوصول للحد اليومي لإنشاء النصوص (5 محاولات). الرجاء المحاولة غداً.' }
});

const cleanText = (value, max = 120) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
};

const parseGeminiJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;

  const fenced = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : rawText;

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

router.post('/invite', authMiddleware, dailyInviteLimiter, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'خدمة توليد النصوص غير متاحة حالياً' });
  }

  const payload = {
    theme: cleanText(req.body?.theme),
    childName: cleanText(req.body?.childName),
    date: cleanText(req.body?.date, 50),
    time: cleanText(req.body?.time, 50),
    branch: cleanText(req.body?.branch),
    phone: cleanText(req.body?.phone, 40),
    tone: cleanText(req.body?.tone, 50) || 'friendly'
  };

  const requiredFields = ['theme', 'childName', 'date', 'time', 'branch', 'phone'];
  const missingField = requiredFields.find((field) => !payload[field]);
  if (missingField) {
    return res.status(400).json({ error: `الحقل ${missingField} مطلوب` });
  }

  const prompt = `You are a bilingual Arabic/English copywriter for a children's birthday center.
Generate concise invitation copy using these details:
- Theme: ${payload.theme}
- Child name: ${payload.childName}
- Date: ${payload.date}
- Time: ${payload.time}
- Branch: ${payload.branch}
- Contact phone: ${payload.phone}
- Tone: ${payload.tone}

Output ONLY valid JSON with this exact schema:
{
  "inviteTextArabic": "...",
  "inviteTextEnglish": "... or empty string if not needed",
  "igCaptionArabic": "...",
  "hashtags": ["#...", "#...", "#..."]
}

Rules:
- Keep Arabic natural and family-friendly.
- Mention key event details in the invitation.
- Instagram caption must be punchy and end with a call-to-action.
- Provide 6-10 relevant Arabic hashtags.
- Do not include markdown or extra keys.`;

  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error?.message || 'Gemini text generation failed';
      if (response.status === 429) {
        return res.status(429).json({ error: 'تم تجاوز حد مزود الذكاء الاصطناعي، الرجاء المحاولة لاحقاً' });
      }
      console.error('Gemini invite generation error:', { status: response.status, errorMessage, data });
      return res.status(502).json({ error: 'تعذر توليد النص حالياً، الرجاء المحاولة لاحقاً' });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    const parsed = parseGeminiJson(rawText);

    if (!parsed?.inviteTextArabic || !parsed?.igCaptionArabic || !Array.isArray(parsed?.hashtags)) {
      console.error('Invalid Gemini JSON output:', rawText);
      return res.status(502).json({ error: 'استجابة الذكاء الاصطناعي غير صالحة، حاول مرة أخرى' });
    }

    return res.json({
      inviteTextArabic: parsed.inviteTextArabic,
      inviteTextEnglish: parsed.inviteTextEnglish || '',
      igCaptionArabic: parsed.igCaptionArabic,
      hashtags: parsed.hashtags.slice(0, 10)
    });
  } catch (error) {
    console.error('AI invite route error:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء توليد النص' });
  }
});

module.exports = router;
