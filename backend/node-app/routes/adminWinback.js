const express = require('express');

const User = require('../models/User');
const HourlyBooking = require('../models/HourlyBooking');
const BirthdayBooking = require('../models/BirthdayBooking');
const UserSubscription = require('../models/UserSubscription');
const LoyaltyHistory = require('../models/LoyaltyHistory');
const WinbackLog = require('../models/WinbackLog');
const { sendEmail, emailTemplates } = require('../utils/email');

const router = express.Router();

router.post('/cron/winback', async (req, res) => {
  try {
    const cronSecret = req.get('X-CRON-SECRET');
    if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized cron request' });
    }

    const now = new Date();
    const inactiveCutoffDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentContactCutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const bookingUrl = `${(process.env.FRONTEND_URL || '').replace(/\/$/, '') || 'https://peekaboojor.com'}/book`;

    const usersToScan = await User.find({
      role: 'parent',
      is_disabled: { $ne: true },
      email: { $exists: true, $ne: '' },
      $or: [
        { lastWinbackAt: { $exists: false } },
        { lastWinbackAt: { $lt: recentContactCutoffDate } }
      ]
    }).select('_id email name');

    const scanned = usersToScan.length;
    if (!scanned) {
      return res.json({
        scanned: 0,
        inactiveCandidates: 0,
        emailed: 0,
        bonusAwarded: 0,
        skippedActive: 0,
        skippedRecentContact: 0,
        failed: 0
      });
    }

    const userIds = usersToScan.map((user) => user._id);

    const [recentHourlyUserIds, recentBirthdayUserIds, recentSubscriptionUserIds] = await Promise.all([
      HourlyBooking.distinct('user_id', {
        user_id: { $in: userIds },
        status: { $in: ['confirmed', 'checked_in', 'completed'] },
        created_at: { $gte: inactiveCutoffDate }
      }),
      BirthdayBooking.distinct('user_id', {
        user_id: { $in: userIds },
        status: { $in: ['confirmed', 'completed'] },
        created_at: { $gte: inactiveCutoffDate }
      }),
      UserSubscription.distinct('user_id', {
        user_id: { $in: userIds },
        payment_status: 'paid',
        status: { $in: ['active', 'consumed'] },
        created_at: { $gte: inactiveCutoffDate }
      })
    ]);

    const activeUsers = new Set([
      ...recentHourlyUserIds.map((id) => id.toString()),
      ...recentBirthdayUserIds.map((id) => id.toString()),
      ...recentSubscriptionUserIds.map((id) => id.toString())
    ]);

    const inactiveUsers = usersToScan.filter((user) => !activeUsers.has(user._id.toString()));
    const inactiveUserIds = inactiveUsers.map((user) => user._id);

    const recentlyContactedUserIds = await WinbackLog.distinct('user_id', {
      user_id: { $in: inactiveUserIds },
      sent_at: { $gte: recentContactCutoffDate }
    });
    const recentlyContacted = new Set(recentlyContactedUserIds.map((id) => id.toString()));

    let emailed = 0;
    let bonusAwarded = 0;
    let skippedActive = scanned - inactiveUsers.length;
    let skippedRecentContact = 0;
    let failed = 0;

    for (const user of inactiveUsers) {
      if (recentlyContacted.has(user._id.toString())) {
        skippedRecentContact += 1;
        continue;
      }

      const template = emailTemplates.winback({
        userName: user.name,
        bookingUrl
      });

      try {
        await sendEmail(user.email, template.subject, template.html);
        emailed += 1;

        const refDate = now.toISOString().split('T')[0];
        const refType = 'winback';
        const refId = `winback:${refDate}:${user._id}`;

        const existingBonus = await LoyaltyHistory.findOne({
          user_id: user._id,
          type: 'earned',
          reference: refId
        });

        if (!existingBonus) {
          const bonusEntry = new LoyaltyHistory({
            user_id: user._id,
            points: 100,
            type: 'earned',
            reference: refId,
            source: 'admin',
            description: 'نقاط استرجاع العميل (Win-back bonus)'
          });

          await bonusEntry.save();
          await User.updateOne(
            { _id: user._id },
            {
              $inc: { loyalty_points: 100 },
              $set: { lastWinbackAt: now }
            }
          );
          bonusAwarded += 1;
        } else {
          await User.updateOne({ _id: user._id }, { $set: { lastWinbackAt: now } });
        }

        await WinbackLog.updateOne(
          { refId },
          {
            $setOnInsert: {
              user_id: user._id,
              email: user.email,
              refType,
              refId,
              points_awarded: existingBonus ? 0 : 100,
              sent_at: now
            }
          },
          { upsert: true }
        );
      } catch (error) {
        failed += 1;
        console.error('Win-back cron send failed:', {
          userId: user._id,
          email: user.email,
          error: error?.message
        });
      }
    }

    return res.json({
      scanned,
      inactiveCandidates: inactiveUsers.length,
      emailed,
      bonusAwarded,
      skippedActive,
      skippedRecentContact,
      failed
    });
  } catch (error) {
    console.error('Win-back cron error:', error);
    return res.status(500).json({ error: 'Failed to process win-back cron' });
  }
});

module.exports = router;
