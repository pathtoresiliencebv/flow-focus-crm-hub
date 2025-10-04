# 📧 SMTP/IMAP Email Systeem - Installatie Instructies

## 🚀 Wat is er gebouwd?

Een volledig functioneel email systeem waarmee gebruikers:
- ✅ SMTP/IMAP accounts kunnen koppelen (Gmail, Outlook, Yahoo, custom servers)
- ✅ Emails kunnen ONTVANGEN via IMAP sync
- ✅ Emails kunnen VERSTUREN via SMTP
- ✅ Gmail OAuth ondersteuning (bestaand)

---

## 📋 Stap 1: Database Setup

### Open Supabase SQL Editor en voer uit:

```sql
-- Voer dit bestand uit: email-system/ADD-SMTP-COLUMNS.sql
```

Dit voegt de volgende kolommen toe aan `email_accounts`:

**SMTP Kolommen:**
- `smtp_host` - Server hostname (bijv. smtp.gmail.com)
- `smtp_port` - Poort nummer (587 voor TLS, 465 voor SSL)
- `smtp_username` - Gebruikersnaam
- `smtp_password` - Wachtwoord
- `smtp_secure` - Boolean voor TLS/SSL

**IMAP Kolommen:**
- `imap_host` - Server hostname (bijv. imap.gmail.com)  
- `imap_port` - Poort nummer (meestal 993)
- `imap_username` - Gebruikersnaam
- `imap_password` - Wachtwoord

**Extra:**
- `display_name` - Weergavenaam voor het account

### Verificatie:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_accounts' 
AND column_name LIKE '%smtp%' OR column_name LIKE '%imap%';
```

---

## 📋 Stap 2: Edge Functions Deployen

Deploy de 3 nieuwe edge functions:

```bash
# 1. Test SMTP/IMAP verbindingen
supabase functions deploy test-smtp-connection

# 2. IMAP Sync - Emails ophalen
supabase functions deploy imap-sync

# 3. SMTP Send - Emails versturen
supabase functions deploy smtp-send
```

### Verificatie:
```bash
supabase functions list
```

Je zou moeten zien:
- ✅ `test-smtp-connection`
- ✅ `imap-sync`
- ✅ `smtp-send`
- ✅ `gmail-sync` (bestaand)
- ✅ `gmail-oauth-init` (bestaand)
- ✅ `gmail-oauth-callback` (bestaand)

---

## 📋 Stap 3: Testen

### 3.1 SMTP Account Koppelen (Gmail Voorbeeld)

1. **Gmail App Password Maken:**
   - Ga naar: https://myaccount.google.com/apppasswords
   - Selecteer "Mail" + je apparaat
   - Klik "Generate"
   - Kopieer het 16-cijferige wachtwoord

2. **In de App:**
   - Ga naar Email tab
   - Klik "SMTP/IMAP Koppelen"
   - Klik "Gmail" preset
   - Vul in:
     - Email: `jouw@gmail.com`
     - SMTP Username: `jouw@gmail.com`
     - SMTP Password: `[app password]`
     - IMAP Username: `jouw@gmail.com`
     - IMAP Password: `[app password]`
   - Klik "Test Verbinding"
   - Als OK: Klik "Opslaan & Verbinden"

### 3.2 Emails Ophalen (IMAP Sync)

1. Klik op de refresh knop in de email interface
2. De `imap-sync` edge function haalt de laatste 50 emails op
3. Check de console/logs voor sync status

### 3.3 Email Versturen (SMTP Send)

1. Klik "Nieuwe Email"
2. Vul in:
   - Aan: ontvanger email
   - Onderwerp: test onderwerp
   - Bericht: test bericht
3. Klik "Verzenden"
4. Check je sent folder / inbox van ontvanger

---

## 🔧 Veelgebruikte Instellingen

### Gmail
**SMTP:**
- Host: `smtp.gmail.com`
- Port: `587` (TLS)
- Secure: `TLS`

**IMAP:**
- Host: `imap.gmail.com`
- Port: `993`

**Credentials:**
- Username: je Gmail adres
- Password: App Password (niet je normale wachtwoord!)

### Outlook/Office 365
**SMTP:**
- Host: `smtp-mail.outlook.com`
- Port: `587` (TLS)

**IMAP:**
- Host: `outlook.office365.com`
- Port: `993`

### Yahoo Mail
**SMTP:**
- Host: `smtp.mail.yahoo.com`
- Port: `587` (TLS)

**IMAP:**
- Host: `imap.mail.yahoo.com`
- Port: `993`

---

## 🐛 Troubleshooting

### "Connection refused" Error
- ✓ Check host en port zijn correct
- ✓ Check firewall settings
- ✓ Check of IMAP/SMTP enabled is in je email account

### "Authentication failed" Error  
- ✓ Voor Gmail: gebruik App Password, niet normale wachtwoord
- ✓ Voor Outlook: check "Let apps use SMTP AUTH" in settings
- ✓ Verify credentials zijn correct

### "TLS error"
- ✓ Probeer andere port (587 vs 465)
- ✓ Switch tussen TLS en SSL

### Emails worden niet opgehaald
- ✓ Check IMAP is enabled in email account
- ✓ Check port 993 is correct
- ✓ Check firewall/network settings

### Emails versturen mislukt
- ✓ Check SMTP is enabled  
- ✓ Check port 587 (TLS) of 465 (SSL)
- ✓ Voor Gmail: 2FA moet enabled zijn voor App Passwords

---

## 🔒 Beveiliging

### Wachtwoord Opslag
- Wachtwoorden worden opgeslagen in Supabase database
- RLS policies zorgen dat users alleen hun eigen data zien
- **Aanbeveling:** Voor productie, gebruik Supabase Vault voor wachtwoord encryptie

### App-Specifieke Wachtwoorden
- Gebruik **ALTIJD** app-specifieke wachtwoorden waar mogelijk
- Nooit je hoofdwachtwoord opslaan
- Gmail: App Passwords (vereist 2FA)
- Yahoo: App Passwords
- Outlook: Let apps use SMTP AUTH

### TLS/SSL
- Gebruik **ALTIJD** TLS (port 587) of SSL (port 465)
- Nooit plain text (port 25)

---

## ✨ Features

### ✅ Wat werkt nu:
- [x] SMTP/IMAP account koppelen met configuratie dialog
- [x] Quick presets (Gmail, Outlook, Yahoo)
- [x] Test verbinding voordat opslaan
- [x] IMAP sync - laatste 50 emails ophalen
- [x] SMTP send - emails versturen
- [x] Email composer met Cc/Bcc
- [x] Multi-account support
- [x] Gmail OAuth (bestaand)

### 🚧 Toekomstige Features:
- [ ] Automatische sync scheduler (elke 5 min)
- [ ] Email attachments support
- [ ] Rich text editor (HTML emails)
- [ ] Email templates
- [ ] Bulk email actions
- [ ] Search & filters
- [ ] Labels/folders beheer
- [ ] Email signatures
- [ ] Read receipts
- [ ] Auto-reply

---

## 📊 Architecture

```
Frontend (React)
    ↓
useEmailAccounts Hook
    ↓
Supabase Edge Functions
    ↓ (IMAP)        ↓ (SMTP)
imap-sync       smtp-send
    ↓                ↓
Email Server    Email Server
    ↓                ↓
Database        Recipient
```

---

## 🎯 Next Steps

1. ✅ Voer database migratie uit
2. ✅ Deploy edge functions  
3. ✅ Test met Gmail account
4. ✅ Test email versturen
5. ⏳ Implementeer auto-sync scheduler
6. ⏳ Voeg attachments support toe
7. ⏳ Implementeer rich text editor

---

## 📞 Support

Bij problemen:
1. Check console logs (browser + Supabase edge functions)
2. Verify database kolommen zijn toegevoegd
3. Verify edge functions zijn deployed
4. Test verbinding via "Test Verbinding" knop
5. Check email provider documentatie voor correcte settings

**Email Providers Docs:**
- [Gmail SMTP/IMAP](https://support.google.com/mail/answer/7126229)
- [Outlook SMTP/IMAP](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
- [Yahoo SMTP/IMAP](https://help.yahoo.com/kb/SLN4075.html)

