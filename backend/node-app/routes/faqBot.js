const express = require('express');

const router = express.Router();

const KNOWLEDGE_BASE = [
  {
    key: 'hours',
    title: 'ساعات العمل',
    answer: 'نحن مفتوحون يوميًا من الساعة 10 صباحًا وحتى 12 منتصف الليل.',
    sourceTitle: 'صفحة التواصل / الأسئلة الشائعة',
    sourcePath: '/contact',
    keywords: ['ساعات', 'الدوام', 'متى', 'تفتح', 'تغلق', 'hours', 'open', 'عمل', 'midnight']
  },
  {
    key: 'pricing_hourly',
    title: 'أسعار اللعب بالساعة',
    answer: 'أسعار اللعب بالساعة: صباحي (10 ص - 2 ظ) 3.5 دينار/ساعة، ومسائي (2 ظ - 12 منتصف الليل) من 7 إلى 13 دينار.',
    sourceTitle: 'صفحة الأسعار',
    sourcePath: '/pricing',
    keywords: ['سعر', 'الاسعار', 'الأسعار', 'price', 'pricing', 'تكلفة', 'بالساعة', 'hourly', 'صباحي', 'مسائي']
  },
  {
    key: 'pricing_subscriptions',
    title: 'أسعار الاشتراكات',
    answer: 'باقات الاشتراك: 5 زيارات = 30 دينار، 10 زيارات = 55 دينار، 20 زيارة = 100 دينار (صالحة 30 يوم من الأحد إلى الخميس).',
    sourceTitle: 'صفحة الأسعار',
    sourcePath: '/pricing',
    keywords: ['اشتراك', 'الاشتراكات', 'visits', 'package', 'باقات', '30 يوم', 'زيارات']
  },
  {
    key: 'birthday_packages',
    title: 'باقات حفلات الميلاد',
    answer: 'باقات حفلات الميلاد الحالية: برونزية 80 دينار، فضية 120 دينار، ذهبية 160 دينار.',
    sourceTitle: 'صفحة الأسعار',
    sourcePath: '/pricing',
    keywords: ['عيد', 'ميلاد', 'حفلة', 'حفلات', 'birthday', 'party', 'برونزية', 'فضية', 'ذهبية']
  },
  {
    key: 'location',
    title: 'العنوان والموقع',
    answer: 'العنوان: أبو راشد مجمع السيف التجاري، إربد. ويمكنك الوصول للموقع من صفحة التواصل عبر زر "الموقع على الخريطة".',
    sourceTitle: 'صفحة التواصل',
    sourcePath: '/contact',
    keywords: ['موقع', 'العنوان', 'وين', 'location', 'address', 'اربد', 'إربد', 'map']
  },
  {
    key: 'contact_channels',
    title: 'قنوات التواصل',
    answer: 'للتواصل: الهاتف 0777775652، واتساب على نفس الرقم، البريد support@peekaboojor.com، أو عبر إنستغرام وفيسبوك من صفحة التواصل.',
    sourceTitle: 'صفحة التواصل',
    sourcePath: '/contact',
    keywords: ['تواصل', 'هاتف', 'رقم', 'واتساب', 'ايميل', 'بريد', 'انستغرام', 'instagram', 'facebook']
  },
  {
    key: 'booking',
    title: 'طريقة الحجز',
    answer: 'يمكن الحجز مباشرة من الموقع: جلسات اللعب من صفحة التذاكر، الحفلات من صفحة أعياد الميلاد، والاشتراكات من صفحة الاشتراكات.',
    sourceTitle: 'صفحات الحجز في الموقع',
    sourcePath: '/tickets',
    keywords: ['حجز', 'احجز', 'الحجز', 'booking', 'book', 'تذاكر', 'اشتراك']
  },
  {
    key: 'cancellation',
    title: 'الإلغاء والاسترجاع',
    answer: 'بالنسبة للإلغاء أو الاسترجاع: يرجى مراجعة سياسة الاسترجاع. وعادة يمكن إعادة جدولة حفلات أعياد الميلاد قبل 48 ساعة.',
    sourceTitle: 'صفحة الأسئلة الشائعة / الاسترجاع',
    sourcePath: '/refund',
    keywords: ['إلغاء', 'الغاء', 'استرجاع', 'استرداد', 'refund', 'cancel', 'cancellation', '48']
  },
  {
    key: 'socks_policy',
    title: 'سياسة الجوارب',
    answer: 'نعم، يجب ارتداء جوارب نظيفة داخل منطقة اللعب للمحافظة على السلامة والنظافة.',
    sourceTitle: 'صفحة القواعد / الأسئلة الشائعة',
    sourcePath: '/rules',
    keywords: ['جوارب', 'شرابات', 'socks', 'sock', 'نظيفة']
  },
  {
    key: 'age_policy',
    title: 'الأعمار المسموحة',
    answer: 'نستقبل الأطفال من عمر سنة واحدة وحتى 12 سنة.',
    sourceTitle: 'صفحة الأسئلة الشائعة',
    sourcePath: '/faq',
    keywords: ['عمر', 'اعمار', 'الأعمار', 'سن', 'مسموح', 'years', 'age']
  },
  {
    key: 'guardian_policy',
    title: 'وجود مرافق بالغ',
    answer: 'نعم، يجب أن يبقى أحد الوالدين أو مرافق بالغ مع الطفل داخل المركز.',
    sourceTitle: 'صفحة القواعد / الأسئلة الشائعة',
    sourcePath: '/rules',
    keywords: ['الأهل', 'ولي', 'مرافق', 'بالغ', 'guardian', 'parent']
  },
  {
    key: 'rules_food',
    title: 'إدخال الطعام والشراب',
    answer: 'يُمنع إدخال طعام أو شراب من الخارج داخل المركز.',
    sourceTitle: 'صفحة القواعد',
    sourcePath: '/rules',
    keywords: ['طعام', 'شراب', 'اكل', 'drink', 'food', 'خارج']
  }
];

const QUICK_TOPICS = ['الأسعار', 'الحجز', 'الموقع', 'ساعات العمل', 'الاشتراكات', 'حفلات الميلاد', 'قواعد المركز'];

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ة/g, 'ه')
  .replace(/ى/g, 'ي')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const scoreItem = (normalizedQuery, item) => {
  if (!normalizedQuery) return 0;
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const searchableText = normalizeText(`${item.title} ${item.answer} ${(item.keywords || []).join(' ')}`);

  let score = 0;

  (item.keywords || []).forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) return;

    if (normalizedQuery.includes(normalizedKeyword)) {
      score += normalizedKeyword.length > 4 ? 5 : 3;
    }
  });

  queryTokens.forEach((token) => {
    if (token.length < 2) return;
    if (searchableText.includes(token)) score += 1;
  });

  return score;
};

router.get('/faq', (req, res) => {
  const query = String(req.query.q || '').trim();
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return res.json({
      answer: `أنا مساعد بيكابو الذكي 🤖
أقدر أجاوبك عن الأسعار، الحجز، الموقع، القواعد، الاشتراكات، وحفلات الميلاد.
اكتب سؤالك مباشرة أو اختر من المواضيع السريعة.`,
      matchedKey: 'default',
      quickTopics: QUICK_TOPICS
    });
  }

  const ranked = KNOWLEDGE_BASE
    .map((item) => ({ item, score: scoreItem(normalizedQuery, item) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];

  if (!best || best.score < 2) {
    return res.json({
      answer: 'ما وصلتني الفكرة بالكامل. جرّب صياغة السؤال بشكل أوضح، مثل: "كم سعر اللعب بالساعة؟" أو "وين موقعكم؟".',
      matchedKey: 'fallback',
      quickTopics: QUICK_TOPICS
    });
  }

  const related = ranked
    .filter((entry) => entry.item.key !== best.item.key && entry.score >= Math.max(2, best.score - 1))
    .slice(0, 2)
    .map((entry) => ({
      key: entry.item.key,
      title: entry.item.title
    }));

  return res.json({
    answer: best.item.answer,
    matchedKey: best.item.key,
    sourceTitle: best.item.sourceTitle,
    sourcePath: best.item.sourcePath,
    related
  });
});

module.exports = router;
