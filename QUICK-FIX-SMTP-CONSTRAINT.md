# 🔧 QUICK FIX: SMTP Provider Constraint

## ❌ **PROBLEEM:**
```
new row for relation "email_accounts" violates check constraint "email_accounts_provider_check"
```

De database constraint staat alleen `'gmail'`, `'outlook'`, `'imap'` toe, maar we proberen `'smtp'` in te voegen.

---

## ✅ **OPLOSSING:**

### **Optie 1: Voer SQL uit in Supabase (AANBEVOLEN)**

```sql
-- Drop oude constraint
ALTER TABLE email_accounts 
DROP CONSTRAINT IF EXISTS email_accounts_provider_check;

-- Voeg nieuwe constraint toe met 'smtp'
ALTER TABLE email_accounts 
ADD CONSTRAINT email_accounts_provider_check 
CHECK (provider IN ('gmail', 'outlook', 'imap', 'smtp'));
```

### **Optie 2: Voer hele ADD-SMTP-COLUMNS.sql opnieuw uit**

Het bestand `email-system/ADD-SMTP-COLUMNS.sql` is bijgewerkt en bevat nu de fix.

---

## 📋 **STAPPEN:**

1. **Open Supabase Dashboard** → SQL Editor
2. **Kopieer en plak** bovenstaande SQL
3. **Klik Run**
4. **Verify:**
   ```sql
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conrelid = 'email_accounts'::regclass 
   AND conname = 'email_accounts_provider_check';
   ```
   
   Je zou moeten zien:
   ```
   CHECK ((provider)::text = ANY (ARRAY[('gmail'::character varying)::text, ('outlook'::character varying)::text, ('imap'::character varying)::text, ('smtp'::character varying)::text]))
   ```

5. **Test SMTP account toevoegen** in de app!

---

## 🎯 **NA DE FIX:**

Je kunt nu:
- ✅ SMTP accounts koppelen via de UI
- ✅ Alle 4 providers gebruiken: `gmail`, `outlook`, `imap`, `smtp`
- ✅ Emails versturen en ontvangen

---

## 📄 **GERELATEERDE BESTANDEN:**

- `email-system/FIX-PROVIDER-CONSTRAINT.sql` - Standalone fix
- `email-system/ADD-SMTP-COLUMNS.sql` - Volledig schema update (inclusief fix)

