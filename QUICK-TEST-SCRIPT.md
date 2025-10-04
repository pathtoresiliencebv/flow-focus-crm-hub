# ⚡ QUICK TEST SCRIPT - 5 MINUTEN

**Doel:** Snel verificeren dat alles werkt  
**Tijd:** 5 minuten

---

## 🎯 **MINIMAL TEST FLOW**

### **1. OPEN CRM** (30 seconden)
```
✅ Action: Open browser → Navigate to CRM
✅ Check: Page loads without errors
✅ Check: Console heeft geen rode errors
```

---

### **2. NAVIGEER NAAR EMAIL** (15 seconden)
```
✅ Action: Klik "Postvak IN" in sidebar
✅ Check: Zie je de nieuwe setup wizard?
✅ Check: Zie je provider buttons (Gmail, Outlook, etc.)?
```

**Als JA:** ✅ Frontend is succesvol gedeployed!  
**Als NEE:** ❌ Hard refresh (Ctrl+Shift+R) en probeer opnieuw

---

### **3. TEST PROVIDER SELECTION** (30 seconden)
```
✅ Action: Klik "Gmail" preset button
✅ Check: SMTP veld = "smtp.gmail.com"?
✅ Check: SMTP poort = 587?
✅ Check: IMAP veld = "imap.gmail.com"?
✅ Check: IMAP poort = 993?
```

**Als JA:** ✅ Provider presets werken!  
**Als NEE:** ❌ Check console errors

---

### **4. TEST FORM VALIDATION** (30 seconden)
```
✅ Action: Leeg alle velden
✅ Action: Klik "Test Verbinding"
✅ Check: Zie je validation errors?
✅ Check: Errors zijn in het Nederlands?
```

**Als JA:** ✅ Validation werkt!  
**Als NEE:** ❌ Form validation issue

---

### **5. TEST DATABASE (SUPABASE)** (1 minuut)
```
✅ Action: Open Supabase Dashboard
✅ Action: Ga naar Table Editor → email_accounts
✅ Action: Check columns
✅ Check: Zie je smtp_host column?
✅ Check: Zie je imap_host column?
✅ Check: Zie je smtp_password column?
```

**Als JA:** ✅ Database migration succesvol!  
**Als NEE:** ❌ Run migration SQL manually

**SQL om te runnen:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'email_accounts'
  AND column_name LIKE '%smtp%'
ORDER BY column_name;
```

**Verwacht resultaat:** 5 columns (smtp_host, smtp_port, smtp_username, smtp_password, smtp_encryption)

---

### **6. TEST EDGE FUNCTIONS** (1 minuut)
```
✅ Action: Open Supabase Dashboard
✅ Action: Ga naar Edge Functions
✅ Check: Bestaat "test-email-connection"?
✅ Check: Bestaat "imap-sync"?
✅ Check: Bestaat "smtp-send"?
✅ Check: Status = "Deployed" (groen)?
```

**Als JA:** ✅ Edge Functions deployed!  
**Als NEE:** ❌ Wacht 5 min voor Lovable deployment, check opnieuw

---

### **7. TEST CONNECTION (OPTIONEEL - met Test Account)** (2 minuten)
```
⚠️ Alleen als je een test Gmail account hebt!

✅ Action: Voer test@gmail.com in (jouw test account)
✅ Action: Voer FOUT wachtwoord in: "wrong123"
✅ Action: Klik "Test Verbinding"
✅ Check: Rode error message?
✅ Check: Error zegt "Authentication failed" ofzo?
```

**Als JA:** ✅ Connection test werkt!  
**Als NEE:** ❌ Check Edge Function logs

---

## 📊 **QUICK SCORE**

Vink af wat werkt:

- [ ] ✅ Frontend loads
- [ ] ✅ Setup wizard visible
- [ ] ✅ Provider presets work
- [ ] ✅ Form validation works
- [ ] ✅ Database columns exist
- [ ] ✅ Edge Functions deployed

**Score: ___/6**

**6/6 = PERFECT! 🎉**  
**5/6 = GOOD ✅**  
**4/6 = OK ⚠️ (maar check missing item)**  
**<4/6 = ISSUES ❌ (troubleshoot)**

---

## 🐛 **TROUBLESHOOTING**

### **Frontend niet updated?**
```bash
# Hard refresh in browser
Ctrl + Shift + R  (Windows)
Cmd + Shift + R   (Mac)

# Clear cache
Ctrl + Shift + Delete
```

### **Database columns niet zichtbaar?**
```sql
-- Run migration manually in Supabase SQL Editor
-- Copy from: supabase/migrations/20251003000000_email_smtp_imap_migration.sql
```

### **Edge Functions niet deployed?**
```
1. Check Lovable deployment log
2. Wacht 5-10 minuten
3. Refresh Supabase Edge Functions page
4. Still not there? Redeploy manually
```

### **Console errors?**
```javascript
// Check browser console (F12)
// Look for:
// - Import errors
// - Missing component errors  
// - API errors

// Common fix: Hard refresh (Ctrl+Shift+R)
```

---

## ✅ **FINAL STATUS**

**Date:** ___________  
**Time:** ___________  
**Tested by:** ___________

**Overall Status:**
- [ ] ✅ ALL WORKING - Production Ready!
- [ ] ⚠️ MOSTLY WORKING - Minor issues
- [ ] ❌ NOT WORKING - Need to debug

**Notes:**
___________________________________________

---

**⏱️ Total time: ~5 minutes**  
**🎯 Quick validation complete!**

