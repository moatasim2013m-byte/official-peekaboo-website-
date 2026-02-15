const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const DAILY_LIMIT = 5;
const MODEL_NAME = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

const buildDayKey = () => new Date().toISOString().slice(0, 10);

const reserveDailyQuota = async (userId) => {
  const collection = mongoose.connection.db.collection('ai_copy_daily_limits');
  const dayKey = buildDayKey();

  await collection.createIndex({ userId: 1, dayKey: 1 }, { unique: true });

  for (let i = 0; i < 4; i += 1) {
    const existing = await collection.findOne({ userId, dayKey });

    if (!existing) {
      try {
        await collection.insertOne({
          userId,
          dayKey,
          count: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return { allowed: true, remaining: DAILY_LIMIT - 1 };
      } catch (error) {
        if (error?.code === 11000) {
          continue;
        }
        throw error;
      }
    }

    if ((existing.count || 0) >= DAILY_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    const updated = await collection.findOneAndUpdate(
      { _id: existing._id, count: existing.count },
      { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (updated?.value) {
      return { allowed: true, remaining: Math.max(0, DAILY_LIMIT - (updated.value.count || 0)) };
    }
  }

  return { allowed: false, remaining: 0 };
};

const buildPrompt = ({ childName, age, partyDate, partyLocation, partyTheme, extraNotes }) => `
أنت مساعد تسويق عربي لحفلات الأطفال. اكتب نصوصاً قصيرة وواضحة بالعربية الفصحى اللطيفة.

المطلوب:
1) inviteArabic: نص دعوة عيد ميلاد عربي جميل (40-80 كلمة) مع فراغات مناسبة للإرسال واتساب.
2) inviteEnglish: نسخة إنجليزية اختيارية لنفس الدعوة (30-60 كلمة، بسيطة).
3) igCaptionArabic: كابشن إنستغرام عربي لطيف للحفلة (حتى 60 كلمة).
4) hashtags: من 6 إلى 10 هاشتاغات عربية/إنجليزية مناسبة بدون أي شرح إضافي.

بيانات الحفلة:
- اسم الطفل: ${childName || 'طفلك'}
- العمر: ${age || 'غير محدد'}
- التاريخ: ${partyDate || 'قريباً'}
- المكان: ${partyLocation || 'بيكابو'}
- الثيم: ${partyTheme || 'ثيم مرح للأطفال'}
- ملاحظات إضافية: ${extraNotes || 'لا يوجد'}

قواعد مهمة:
- أرجع JSON فقط، بدون markdown.
- المفاتيح يجب أن تكون بالضبط: inviteArabic, inviteEnglish, igCaptionArabic, hashtags.
- hashtags يجب أن تكون مصفوفة نصية string[].
- لا تذكر أنك نموذج ذكاء اصطناعي.
- لا تضف أي تفاصيل غير موجودة في المدخلات.
`.trim();

const callGeminiForInvite = async (payload) => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error('Missing GEMINI_API_KEY');
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL_NAME)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.8,
          responseMimeType: 'application/json'
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(payload) }]
          }
        ]
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    const err = new Error('Gemini request failed');
    err.code = 'GEMINI_API_ERROR';
    err.status = response.status;
    err.details = result;
    throw err;
  }

  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error('Gemini empty response');
    err.code = 'GEMINI_EMPTY_RESPONSE';
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const err = new Error('Invalid JSON from Gemini');
    err.code = 'GEMINI_INVALID_JSON';
    throw err;
  }

  const inviteArabic = typeof parsed.inviteArabic === 'string' ? parsed.inviteArabic.trim() : '';
  const inviteEnglish = typeof parsed.inviteEnglish === 'string' ? parsed.inviteEnglish.trim() : '';
  const igCaptionArabic = typeof parsed.igCaptionArabic === 'string' ? parsed.igCaptionArabic.trim() : '';
  const hashtags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : [];

  if (!inviteArabic || !igCaptionArabic || hashtags.length === 0) {
    const err = new Error('Incomplete AI response');
    err.code = 'GEMINI_INCOMPLETE_RESPONSE';
    throw err;
  }

  return {
    inviteArabic,
    inviteEnglish: inviteEnglish || null,
    igCaptionArabic,
    hashtags
  };
};

router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const quota = await reserveDailyQuota(req.userId.toString());
    if (!quota.allowed) {
      return res.status(429).json({
        error: 'تم تجاوز الحد اليومي (5 محاولات). الرجاء المحاولة غداً.',
        remaining: 0
      });
    }

    const aiResult = await callGeminiForInvite(req.body || {});

    return res.json({
      ...aiResult,
      remaining: quota.remaining
    });
  } catch (error) {
    if (error?.code === 'MISSING_API_KEY') {
      return res.status(503).json({ error: 'خدمة توليد النصوص غير متاحة حالياً' });
    }

    if (error?.status === 429) {
      return res.status(429).json({ error: 'خدمة الذكاء الاصطناعي مشغولة حالياً، الرجاء المحاولة لاحقاً' });
    }

    console.error('AI invite generation error:', {
      code: error?.code,
      status: error?.status,
      message: error?.message,
      details: error?.details
    });

    return res.status(502).json({ error: 'تعذر إنشاء نص الدعوة حالياً، الرجاء المحاولة لاحقاً' });
  }
});

module.exports = router;
