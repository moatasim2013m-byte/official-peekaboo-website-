const express = require('express');
const User = require('../models/User');
const HourlyBooking = require('../models/HourlyBooking');
const BirthdayBooking = require('../models/BirthdayBooking');
const { sendEmail, emailTemplates } = require('../utils/email');

const router = express.Router();

const WINBACK_WINDOW_DAYS = 14;
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

const isCronAuthorized = (req) => {
  const providedSecret = req.get('X-CRON-SECRET');
  return Boolean(process.env.CRON_SECRET) && providedSecret === process.env.CRON_SECRET;
};

router.post('/winback', async (req, res) => {
  if (!isCronAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (WINBACK_WINDOW_DAYS * MILLISECONDS_IN_DAY));
    const ctaLink = req.body?.cta_link || `${process.env.FRONTEND_URL || 'https://peekaboojor.com'}/bookings`;
    const couponCode = req.body?.coupon_code || '';

    const [recentHourlyUserIds, recentBirthdayUserIds, candidates] = await Promise.all([
      HourlyBooking.distinct('user_id', {
        status: { $in: ['confirmed', 'checked_in', 'completed'] },
        created_at: { $gte: cutoffDate }
      }),
      BirthdayBooking.distinct('user_id', {
        status: { $in: ['confirmed', 'completed'] },
        created_at: { $gte: cutoffDate }
      }),
      User.find({
        role: 'parent',
        is_disabled: { $ne: true },
        email: { $exists: true, $ne: '' },
        $or: [
          { last_winback_at: { $exists: false } },
          { last_winback_at: null },
          { last_winback_at: { $lt: cutoffDate } }
        ]
      }).select('_id name email')
    ]);

    const activeUserIds = new Set(
      [...recentHourlyUserIds, ...recentBirthdayUserIds].map((id) => id.toString())
    );

    const scanned = candidates.length;
    let emailed = 0;
    let skipped = 0;

    for (const user of candidates) {
      if (activeUserIds.has(user._id.toString())) {
        skipped += 1;
        continue;
      }

      try {
        const template = emailTemplates.winback({
          userName: user.name,
          ctaLink,
          couponCode
        });

        await sendEmail(user.email, template.subject, template.html);
        await User.updateOne({ _id: user._id }, { $set: { last_winback_at: now } });
        emailed += 1;
      } catch (emailError) {
        console.error('[WINBACK_EMAIL_FAILED]', {
          user_id: user._id,
          email: user.email,
          error: emailError.message
        });
        skipped += 1;
      }
    }

    return res.json({ scanned, emailed, skipped });
  } catch (error) {
    console.error('[WINBACK_CRON_ERROR]', error);
    return res.status(500).json({ error: 'Failed to execute win-back automation' });
  }
});

module.exports = router;
