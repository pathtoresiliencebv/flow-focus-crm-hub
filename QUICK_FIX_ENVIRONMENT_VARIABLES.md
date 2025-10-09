# ⚠️ CRITICAL: Missing Environment Variables

**Date:** October 9, 2025  
**Status:** **BLOCKING INVOICE SENDING**

---

## 🚨 Problem

Invoice sending is failing with **500 Internal Server Error** because:

### Missing Environment Variables:
1. ❌ **RESEND_API_KEY** - Required for email sending
2. ❌ **STRIPE_LIVE_KEY** - Required for payment links

Without these, the edge function cannot:
- Send emails (Resend)
- Generate payment links (Stripe)

---

## ✅ Solution: Add Environment Variables NOW

### Step 1: Go to Supabase Dashboard

**URL:** https://supabase.com/dashboard/project/pvesgvkyiaqmsudmmtkc/settings/functions

### Step 2: Add RESEND_API_KEY

1. Click "**Add new secret**"
2. Name: `RESEND_API_KEY`
3. Value: Your Resend API key (get from https://resend.com/api-keys)
4. Click "**Save**"

**Example:**
```
Name: RESEND_API_KEY
Value: re_ABC123xyz_...
```

### Step 3: Add STRIPE_LIVE_KEY

1. Click "**Add new secret**"
2. Name: `STRIPE_LIVE_KEY`
3. Value: Your Stripe secret key (get from https://dashboard.stripe.com/apikeys)
4. Click "**Save**"

**Example:**
```
Name: STRIPE_LIVE_KEY
Value: sk_live_ABC123xyz_...
```

---

## 🔑 Where to Get API Keys

### Resend API Key:
1. Go to: https://resend.com/
2. Sign in / Sign up
3. Navigate to: **API Keys**
4. Create new API key or copy existing one
5. Key format: `re_...`

### Stripe Live Key:
1. Go to: https://dashboard.stripe.com/
2. Sign in
3. Navigate to: **Developers** → **API Keys**
4. Copy "**Secret key**" (NOT the publishable key!)
5. Key format: `sk_live_...`

⚠️ **IMPORTANT:** Use **LIVE** keys, not test keys!

---

## 🧪 How to Test After Adding Keys

### Test 1: Refresh and Try Sending

1. After adding both keys in Supabase
2. Wait 30 seconds (for deployment)
3. Go to: https://smanscrm.nl/invoices
4. Try sending invoice `INV-2025-6875` again
5. Should work now! ✅

### Test 2: Check Logs

After attempting to send, check logs:
```
https://supabase.com/dashboard/project/pvesgvkyiaqmsudmmtkc/logs/edge-functions
```

Look for:
- ✅ "Payment link generated and stored successfully"
- ✅ "Invoice email sent successfully"

---

## 📊 Current Environment Variables

You need these configured:

```
✅ SUPABASE_URL (auto-configured)
✅ SUPABASE_SERVICE_ROLE_KEY (auto-configured)
✅ SUPABASE_ANON_KEY (auto-configured)

❌ RESEND_API_KEY (MISSING - ADD NOW!)
❌ STRIPE_LIVE_KEY (MISSING - ADD NOW!)
```

---

## 🎯 Why This Is Critical

### Without RESEND_API_KEY:
- ❌ Cannot send ANY emails
- ❌ Invoices cannot be delivered to customers
- ❌ System appears broken to users

### Without STRIPE_LIVE_KEY:
- ❌ No payment links generated
- ❌ Customers cannot pay online
- ❌ Must rely on manual bank transfers only

---

## 🔄 Alternative: Use Test Mode First

If you want to test before using live keys:

### For Testing (Optional):
```
RESEND_API_KEY: Use Resend test key (re_test_...)
STRIPE_LIVE_KEY: Use Stripe test key (sk_test_...)
```

### For Production (Required):
```
RESEND_API_KEY: Must be live key (re_...)
STRIPE_LIVE_KEY: Must be live key (sk_live_...)
```

---

## 📝 Step-by-Step Checklist

- [ ] Go to Supabase dashboard
- [ ] Navigate to Edge Functions settings
- [ ] Add RESEND_API_KEY
- [ ] Add STRIPE_LIVE_KEY
- [ ] Click Save
- [ ] Wait 30 seconds
- [ ] Test invoice sending
- [ ] Verify email received
- [ ] Check payment link works

---

## 🆘 Still Not Working?

### Check These:

1. **Keys are correct format:**
   - Resend: starts with `re_`
   - Stripe: starts with `sk_live_`

2. **No typos in variable names:**
   - Exact: `RESEND_API_KEY`
   - Exact: `STRIPE_LIVE_KEY`
   - Case-sensitive!

3. **Keys are active:**
   - Not revoked in Resend dashboard
   - Not revoked in Stripe dashboard

4. **Check edge function logs:**
   - Look for specific error messages
   - Will show "RESEND_API_KEY not configured" or similar

---

## 📚 Related Documentation

- **INVOICE_STRIPE_INTEGRATION_FIX.md** - Edge function details
- **DATABASE_FIX_INVOICE_EMAILS.md** - Database fixes
- **INVOICE_FIX_SUMMARY.md** - Complete overview
- This document - Environment variables

---

**STATUS:** ⚠️ **BLOCKING** - Add environment variables immediately!  
**PRIORITY:** 🔴 **HIGHEST**  
**TIME TO FIX:** ~5 minutes  

**Once you add these two environment variables, invoice sending will work perfectly!** 🚀

