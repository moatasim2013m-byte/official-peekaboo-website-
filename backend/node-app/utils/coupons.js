const Coupon = require('../models/Coupon');

const calculateDiscount = (coupon, amount) => {
  const numericAmount = Number(amount) || 0;
  if (!coupon || numericAmount <= 0) return 0;

  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = (numericAmount * Number(coupon.discount_value || 0)) / 100;
    if (coupon.max_discount && coupon.max_discount > 0) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
  } else {
    discount = Number(coupon.discount_value || 0);
  }

  return Math.max(0, Math.min(discount, numericAmount));
};

const validateCoupon = async ({ code, amount, type }) => {
  const normalizedCode = (code || '').toString().trim().toUpperCase();
  if (!normalizedCode) {
    return { valid: false, message: 'Coupon code is required' };
  }

  const coupon = await Coupon.findOne({ code: normalizedCode, is_active: true });
  if (!coupon) {
    return { valid: false, message: 'كود الخصم غير صالح' };
  }

  const now = new Date();
  if (coupon.starts_at && coupon.starts_at > now) {
    return { valid: false, message: 'كود الخصم غير مفعل بعد' };
  }
  if (coupon.expires_at && coupon.expires_at < now) {
    return { valid: false, message: 'كود الخصم منتهي الصلاحية' };
  }
  if (coupon.usage_limit && coupon.redeemed_count >= coupon.usage_limit) {
    return { valid: false, message: 'تم استنفاد كود الخصم' };
  }

  const numericAmount = Number(amount) || 0;
  if (numericAmount < Number(coupon.min_order_amount || 0)) {
    return {
      valid: false,
      message: `الحد الأدنى لاستخدام الكوبون هو ${coupon.min_order_amount} دينار`
    };
  }

  if (type && Array.isArray(coupon.applies_to) && coupon.applies_to.length > 0 && !coupon.applies_to.includes(type)) {
    return { valid: false, message: 'كود الخصم غير متاح لهذا النوع من الحجز' };
  }

  const discountAmount = calculateDiscount(coupon, numericAmount);
  return {
    valid: true,
    coupon,
    normalizedCode,
    discountAmount,
    finalAmount: Math.max(0, numericAmount - discountAmount)
  };
};

module.exports = {
  calculateDiscount,
  validateCoupon
};
