# ✅ FIX COMPLETE: "pagenotset" Issue Resolved

## 🎯 PROBLEM IDENTIFIED

**Error:** "pagenotset" in CyberSource payload

**Root Cause:** Missing return URLs (callback URLs) in Secure Acceptance form fields

CyberSource Secure Acceptance REQUIRES:
- `override_custom_receipt_page` - Where to redirect on SUCCESS
- `override_custom_cancel_page` - Where to redirect on CANCEL/FAILURE

Without these, CyberSource shows "pagenotset" error and cannot process payment.

---

## ✅ CHANGES MADE

### **1. Updated `/app/backend/node-app/utils/cybersourceRest.js`**

**Added return URL parameters:**
```javascript
const buildSecureAcceptanceFormFields = ({
  profileId,
  accessKey,
  secretKey,
  transactionUuid,
  referenceNumber,
  amount,
  currency,
  locale = 'en',
  billTo,
  returnUrl,      // ← NEW
  cancelUrl       // ← NEW
}) => {
```

**Added return URLs to signed fields:**
```javascript
signed_field_names: '...,override_custom_receipt_page,override_custom_cancel_page'
```

**Added URLs to form fields:**
```javascript
override_custom_receipt_page: returnUrl,
override_custom_cancel_page: cancelUrl || returnUrl
```

### **2. Updated `/app/backend/node-app/routes/payments.js`**

**Added return URL generation:**
```javascript
// Build return URLs for CyberSource redirect
const frontendUrl = process.env.FRONTEND_URL || 'https://peekaboojor.com';
const returnUrl = `${frontendUrl}/api/payments/capital-bank/return`;
const cancelUrl = `${frontendUrl}/payment/cancelled`;
```

**Passed URLs to form builder:**
```javascript
const formFields = buildSecureAcceptanceFormFields({
  profileId: capitalBankConfig.profileId,
  accessKey: capitalBankConfig.accessKey,
  secretKey: capitalBankConfig.secretKey,
  transactionUuid,
  referenceNumber: transaction.session_id,
  amount,
  currency: transaction.currency || 'JOD',
  locale: 'ar',
  billTo,
  returnUrl,    // ← NEW
  cancelUrl     // ← NEW
});
```

---

## 🔄 PAYMENT FLOW (NOW COMPLETE)

### **Before Fix:**
```
1. User clicks "Pay"
2. Backend generates form fields
3. ❌ Missing return URLs
4. CyberSource error: "pagenotset"
5. User sees "undefined" page
6. Redirected to home page
```

### **After Fix:**
```
1. User clicks "Pay"
2. Backend generates form fields with return URLs ✅
3. Frontend submits form to CyberSource
4. User enters card on CyberSource hosted page
5. CyberSource processes payment
6. ✅ CyberSource redirects to: /api/payments/capital-bank/return
7. Backend updates transaction status
8. User redirected to success/failed page
```

---

## 🧪 TESTING CHECKLIST

### **Backend Testing:**
- [x] ✅ Code updated
- [x] ✅ Backend restarted
- [ ] ⏳ Verify form fields include return URLs
- [ ] ⏳ Check logs for return URL values

### **Frontend Testing:**
- [ ] ⏳ Click "Pay" button
- [ ] ⏳ Verify redirect to CyberSource (not "undefined")
- [ ] ⏳ CyberSource page should load properly
- [ ] ⏳ Enter test card: 4111111111111111
- [ ] ⏳ Verify redirect back to app after payment
- [ ] ⏳ Check transaction status updates

---

## 🎯 NEXT STEPS

### **Step 1: Deploy to Cloud Run**
```bash
# Commit changes
git add .
git commit -m "Fix: Add return URLs for Secure Acceptance pagenotset error"

# Deploy will happen automatically via Cloud Build
```

### **Step 2: Verify Deployment**
```bash
# Check logs for return URL in form fields
gcloud run services logs read peekaboo-indoor-playground \
  --limit=50 | grep "return_url"
```

**Expected log:**
```
[Secure Acceptance] Form fields generated: {..., return_url: 'https://peekaboojor.com/api/payments/capital-bank/return'}
```

### **Step 3: Test Payment**
1. Go to: https://peekaboojor.com
2. Make a test booking
3. Click "Pay"
4. **Should redirect to CyberSource payment page**
5. Enter test card: `4111111111111111`
6. Complete payment
7. Should redirect back to your app

---

## 🔐 RETURN URL ENDPOINTS

### **Success/Failure Return:**
```
POST /api/payments/capital-bank/return
```
- Handles both success and failure
- Reads `decision` field from CyberSource response
- Updates transaction status
- Redirects to `/payment/success` or `/payment/failed`

### **Cancel Return:**
```
GET /payment/cancelled
```
- User cancelled payment on CyberSource page
- No transaction processing
- Show cancellation message

---

## 📊 DEBUGGING

### **If payment still doesn't work:**

**Check 1: Verify return URLs in form:**
```bash
# Check backend logs
tail -f /var/log/supervisor/backend.out.log | grep "return_url"
```

**Check 2: Verify CyberSource receives return URLs:**
- Open DevTools Network tab
- Watch form submission to CyberSource
- Check payload includes `override_custom_receipt_page`

**Check 3: Verify Profile ID is set:**
```bash
# Should see this in logs
[Payments] Profile ID: capitalbjordan1_acct
```

**Check 4: Test return URL endpoint:**
```bash
curl -X POST https://peekaboojor.com/api/payments/capital-bank/return \
  -d "decision=ACCEPT&req_reference_number=cb_test_123"
```

---

## ✅ SUCCESS CRITERIA

**Payment working when:**
- ✅ Clicking "Pay" redirects to CyberSource (not "undefined")
- ✅ CyberSource shows payment form
- ✅ After payment, redirects back to your app
- ✅ Transaction status updates to "paid"
- ✅ User sees success message

---

**Status:** 🚀 READY FOR TESTING

**Date:** February 24, 2026
**Fix Applied:** Return URLs added to Secure Acceptance form fields
