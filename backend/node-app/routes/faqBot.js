const express = require('express');

const router = express.Router();

const FAQ_ITEMS = [
  {
    key: 'hours',
    answer: 'ساعات الدوام يوميًا من 10:00 صباحًا إلى 10:00 مساءً.',
    keywords: ['ساعات', 'الدوام', 'متى', 'تفتح', 'تغلق', 'hours', 'open']
  },
  {
    key: 'prices',
    answer: 'الأسعار تختلف حسب نوع التذكرة أو الباقة. تواصلوا معنا أو راجعوا صفحة الأسعار للتفاصيل.',
    keywords: ['سعر', 'الاسعار', 'الأسعار', 'price', 'pricing', 'تكلفة']
  },
  {
    key: 'location',
    answer: 'موقعنا داخل مدينة جدة. يمكنكم الوصول عبر صفحة التواصل لمعرفة الموقع بالتفصيل.',
    keywords: ['موقع', 'العنوان', 'وين', 'location', 'address', 'جدة']
  },
  {
    key: 'booking',
    answer: 'يمكنكم الحجز مباشرة من الموقع عبر صفحة التذاكر أو الباقات، أو بالتواصل مع فريق الاستقبال.',
    keywords: ['حجز', 'احجز', 'الحجز', 'booking', 'book']
  },
  {
    key: 'cancellation',
    answer: 'بالنسبة للإلغاء أو الاسترجاع، يرجى مراجعة سياسة الاسترجاع أو التواصل مع خدمة العملاء قبل موعد الحجز.',
    keywords: ['إلغاء', 'الغاء', 'استرجاع', 'استرداد', 'refund', 'cancel', 'cancellation']
  },
  {
    key: 'socks_policy',
    answer: 'يرجى ارتداء الجوارب للأطفال أثناء اللعب للمحافظة على السلامة والنظافة.',
    keywords: ['جوارب', 'شرابات', 'socks', 'sock']
  }
];

router.get('/faq', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();

  if (!query) {
    return res.json({
      answer: 'اكتب سؤالك أو اختر أحد الأزرار السريعة وسأساعدك فورًا.',
      matchedKey: 'default'
    });
  }

  const matched = FAQ_ITEMS.find((item) => item.keywords.some((keyword) => query.includes(keyword.toLowerCase())));

  if (!matched) {
    return res.json({
      answer: 'عذرًا، ما فهمت سؤالك بشكل كامل. جرّب سؤالًا عن الأسعار، الموقع، ساعات الدوام، الحجز أو سياسة الاسترجاع.',
      matchedKey: 'fallback'
    });
  }

  return res.json({
    answer: matched.answer,
    matchedKey: matched.key
  });
});

module.exports = router;
