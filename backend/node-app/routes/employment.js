const express = require('express');
const EmploymentApplication = require('../models/EmploymentApplication');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/apply', async (req, res) => {
  try {
    const {
      full_name = '',
      phone = '',
      email = '',
      position = '',
      experience = '',
      availability = ''
    } = req.body || {};

    if (!full_name.trim() || !phone.trim() || !position.trim()) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف والوظيفة المطلوبة مطلوبة' });
    }

    const application = await EmploymentApplication.create({
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      position: position.trim(),
      experience: experience.trim(),
      availability: availability.trim()
    });

    return res.status(201).json({
      message: 'تم استلام طلب التوظيف بنجاح',
      application: application.toJSON()
    });
  } catch (error) {
    console.error('Employment apply error:', error);
    return res.status(500).json({ error: 'تعذر إرسال الطلب حالياً' });
  }
});

router.get('/applications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const applications = await EmploymentApplication.find().sort({ created_at: -1 }).limit(500);
    return res.json({ applications: applications.map((item) => item.toJSON()) });
  } catch (error) {
    console.error('Employment applications list error:', error);
    return res.status(500).json({ error: 'تعذر تحميل طلبات التوظيف' });
  }
});

router.patch('/applications/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['new', 'reviewed'].includes(status)) {
      return res.status(400).json({ error: 'حالة الطلب غير صحيحة' });
    }

    const updated = await EmploymentApplication.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    return res.json({ application: updated.toJSON() });
  } catch (error) {
    console.error('Employment application status error:', error);
    return res.status(500).json({ error: 'تعذر تحديث حالة الطلب' });
  }
});

module.exports = router;
