# 🔐 EMAIL ENCRYPTION KEY SETUP

**KRITIEK:** Voor IMAP sync moet je de encryption key instellen!

---

## 🚀 STAP 1: GENEREER EEN ENCRYPTION KEY

Gebruik één van deze methoden om een 32-character key te genereren:

### **Optie A: Online Generator (Simpelst)**
1. Ga naar: https://www.random.org/strings/
2. Settings:
   - String length: 32
   - Characters: Alphanumeric
   - Aantal: 1
3. Klik "Get Strings"
4. Kopieer de gegenereerde string

### **Optie B: PowerShell**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### **Optie C: Node.js**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

### **Voorbeeld Key:**
```
xK9#mP2$nQ7&rT5@wY8!zA3%bC6^dE1*
```

⚠️ **GEBRUIK DIT NIET IN PRODUCTIE!** Genereer je eigen unieke key!

---

## 🔧 STAP 2: STEL KEY IN SUPABASE IN

1. **Open Supabase Dashboard:**
   - Ga naar: https://supabase.com
   - Selecteer je project: **Flow Focus CRM**

2. **Ga naar Edge Functions Secrets:**
   - Klik op **"Edge Functions"** in het linkermenu
   - Klik op **"Manage secrets"** (of Settings → Edge Functions)

3. **Voeg Secret Toe:**
   - Klik **"Add Secret"** of **"New Secret"**
   - **Name:** `EMAIL_ENCRYPTION_KEY`
   - **Value:** [Plak je gegenereerde 32-character key]
   - Klik **"Save"** of **"Add"**

4. **Verify:**
   - De secret zou nu moeten verschijnen in de lijst
   - ✅ Je ziet: `EMAIL_ENCRYPTION_KEY` (value is verborgen)

---

## ✅ STAP 3: TEST DE SETUP

### **A) Test in je CRM:**

1. **Ga naar je CRM:**
   - Open: https://smanscrm.nl
   - Hard refresh: `Ctrl + Shift + R`

2. **Klik "Postvak IN":**
   - Je zou de Roundcube interface moeten zien

3. **Klik "Test Verbinding":**
   - Voer je email credentials in
   - Klik "Test Verbinding"
   - ✅ **Verwacht:** Groene success message binnen 5-10 seconden

4. **Klik "Opslaan & Activeren":**
   - Account wordt opgeslagen

5. **Klik "Synchroniseer" button:**
   - ✅ **Verwacht:** "Synchronisatie voltooid - X berichten gesynchroniseerd"
   - ❌ **Als error:** Check Supabase Edge Function logs

### **B) Check Supabase Database:**

Run deze query in Supabase SQL Editor:

```sql
-- Check synced emails
SELECT 
  t.subject,
  t.snippet,
  t.last_message_at,
  t.is_read
FROM email_threads t
JOIN email_accounts a ON t.account_id = a.id
ORDER BY t.last_message_at DESC
LIMIT 10;
```

**Verwacht:**
- Je zou je laatste 10 emails moeten zien!

---

## 🐛 TROUBLESHOOTING

### **Error: "EMAIL_ENCRYPTION_KEY not set"**
❌ **Probleem:** Encryption key niet ingesteld  
✅ **Oplossing:** Voer STAP 2 opnieuw uit

### **Error: "Authentication failed"**
❌ **Probleem:** Verkeerd wachtwoord of username  
✅ **Oplossing:**
- Voor Gmail: Gebruik **App Password**, niet normaal wachtwoord
- Check of je username = email address

### **Error: "Connection timeout"**
❌ **Probleem:** Kan niet verbinden met IMAP server  
✅ **Oplossing:**
- Check of IMAP host correct is (bijv. `imap.gmail.com`)
- Check of port correct is (993 voor SSL, 143 voor TLS)
- Check firewall/network instellingen

### **Test verbinding blijft laden**
❌ **Probleem:** Edge Function hangt  
✅ **Oplossing:**
- Wacht 30 seconden (timeout)
- Check Supabase Edge Function logs
- Verify dat Edge Functions deployed zijn

### **Geen emails verschijnen**
❌ **Probleem:** Sync werkt maar emails niet zichtbaar  
✅ **Oplossing:**
- Hard refresh browser (`Ctrl + Shift + R`)
- Check database query hierboven
- Klik opnieuw op "Synchroniseer"

---

## 📊 CHECK EDGE FUNCTION LOGS

Als iets niet werkt:

1. **Open Supabase Dashboard**
2. **Ga naar Edge Functions**
3. **Klik op "Logs"**
4. **Filter op functie:** `imap-sync` of `test-email-connection`
5. **Check errors**

---

## ✅ SUCCESS CHECKLIST

Vink af wat werkt:

```
□ Encryption key gegenereerd (32 chars)
□ Key ingesteld in Supabase Secrets
□ Test verbinding succesvol (groene message)
□ Account opgeslagen
□ Synchroniseer button clicked
□ Emails verschijnen in lijst
□ Database query toont emails
```

**Als alles ✅ is: PERFECT! Email sync werkt!** 🎉

---

## 🎯 VOLGENDE STAPPEN

**Na succesvolle setup:**

1. ✅ **Roundcube interface:** Werkt!
2. ✅ **IMAP sync:** Werkt!
3. ✅ **Emails tonen:** Werkt!
4. ⏳ **Email versturen:** Implementeren (SMTP send functie bestaat al)
5. ⏳ **FullCalendar:** Planning implementeren

---

**Volg deze stappen en laat me weten waar je vast loopt!** 🚀

