const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateCoupon } = require('../utils/coupons');

const router = express.Router();

router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { code, amount, type } = req.body;
    const result = await validateCoupon({ code, amount, type });

    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }

    const { coupon, normalizedCode, discountAmount, finalAmount } = result;
    return res.json({
      coupon: {
        code: normalizedCode,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount || null
      },
      discount_amount: discountAmount,
      final_amount: finalAmount
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;
