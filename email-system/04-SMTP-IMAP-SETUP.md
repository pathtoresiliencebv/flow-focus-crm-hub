# SMTP/IMAP Email Setup

## Overzicht

Naast Gmail OAuth ondersteunen we nu ook directe SMTP/IMAP verbindingen. Dit maakt het mogelijk om elk email account te koppelen, inclusief:

- Gmail (met app-specifiek wachtwoord)
- Outlook/Office 365
- Yahoo Mail
- Custom email servers
- Bedrijfsmail servers

## Database Setup

### 1. Voer SQL uit in Supabase Dashboard

```bash
# Open email-system/ADD-SMTP-COLUMNS.sql in Supabase SQL Editor en voer uit
```

Dit voegt de volgende kolommen toe aan `email_accounts`:

**SMTP Kolommen:**
- `smtp_host` - Server hostname (bijv. smtp.gmail.com)
- `smtp_port` - Poort nummer (587 voor TLS, 465 voor SSL)
- `smtp_username` - Gebruikersnaam
- `smtp_password` - Wachtwoord (encrypted)
- `smtp_secure` - Boolean voor TLS/SSL

**IMAP Kolommen:**
- `imap_host` - Server hostname (bijv. imap.gmail.com)
- `imap_port` - Poort nummer (meestal 993)
- `imap_username` - Gebruikersnaam
- `imap_password` - Wachtwoord (encrypted)

**Extra:**
- `display_name` - Weergavenaam voor het account

## Edge Function Deployment

De `test-smtp-connection` edge function test of de SMTP en IMAP verbindingen werken.

### Deploy:
```bash
supabase functions deploy test-smtp-connection
```

## Veelgebruikte Instellingen

### Gmail (met App Password)

**SMTP:**
- Host: `smtp.gmail.com`
- Port: `587`
- Security: TLS
- Username: je Gmail adres
- Password: [App Password](https://myaccount.google.com/apppasswords)

**IMAP:**
- Host: `imap.gmail.com`
- Port: `993`
- Username: je Gmail adres
- Password: Zelfde App Password

**Gmail App Password aanmaken:**
1. Ga naar https://myaccount.google.com/apppasswords
2. Selecteer "Mail" en je apparaat
3. Klik "Generate"
4. Kopieer het 16-cijferige wachtwoord
5. Gebruik dit in plaats van je normale wachtwoord

### Outlook/Office 365

**SMTP:**
- Host: `smtp-mail.outlook.com` of `smtp.office365.com`
- Port: `587`
- Security: TLS

**IMAP:**
- Host: `outlook.office365.com`
- Port: `993`

### Yahoo Mail

**SMTP:**
- Host: `smtp.mail.yahoo.com`
- Port: `587`
- Security: TLS

**IMAP:**
- Host: `imap.mail.yahoo.com`
- Port: `993`

**Yahoo App Password:**
1. Ga naar Account Security
2. Klik "Generate app password"
3. Selecteer "Other App"
4. Gebruik dit wachtwoord

## Beveiliging

### Wachtwoord Encryptie

Wachtwoorden worden opgeslagen in de database. Voor extra beveiliging kun je:

1. **Supabase Vault gebruiken** (aanbevolen):
```sql
-- Verplaats wachtwoorden naar Vault
INSERT INTO vault.secrets (name, secret)
VALUES ('smtp_password_' || account_id, smtp_password);

-- Update email_accounts om te verwijzen naar vault
UPDATE email_accounts 
SET smtp_password = 'vault:smtp_password_' || id
WHERE provider = 'smtp';
```

2. **RLS Policies** zorgen ervoor dat gebruikers alleen hun eigen credentials kunnen zien

3. **App-specifieke wachtwoorden** gebruiken in plaats van hoofdwachtwoorden

## UI Componenten

### SMTPConfigDialog Component

Een volledige dialog voor het configureren van SMTP/IMAP instellingen:

**Features:**
- ✓ Tabbed interface (Account Info, SMTP, IMAP)
- ✓ Quick presets (Gmail, Outlook, Yahoo)
- ✓ Test verbinding voordat opslaan
- ✓ Tooltips met hulp
- ✓ Validatie van verplichte velden
- ✓ Loading states

### ConnectEmailAccount Component

Bijgewerkt om beide opties te tonen:
- Gmail via OAuth (makkelijk, geen technische kennis nodig)
- SMTP/IMAP (voor alle providers, meer controle)

## Testing

### Test SMTP Verbinding

```typescript
const { data, error } = await supabase.functions.invoke('test-smtp-connection', {
  body: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'user@gmail.com',
    smtpPassword: 'app_password',
    smtpSecure: 'TLS',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapUsername: 'user@gmail.com',
    imapPassword: 'app_password',
  }
});
```

## Troubleshooting

### "Connection refused"
- Controleer of de host en port correct zijn
- Controleer of je firewall uitgaande verbindingen toestaat

### "Authentication failed"
- Voor Gmail: gebruik een App Password, niet je normale wachtwoord
- Controleer of IMAP/SMTP enabled is in je email account instellingen
- Voor Outlook: controleer of "Let apps use SMTP AUTH" enabled is

### "TLS error"
- Probeer een andere port (587 vs 465)
- Switch tussen TLS en SSL

## Volgende Stappen

1. ✅ Database schema uitgebreid
2. ✅ UI componenten gemaakt
3. ✅ Test edge function
4. ⏳ IMAP sync implementeren (emails ophalen)
5. ⏳ SMTP send implementeren (emails versturen)
6. ⏳ Automatische sync scheduler

## Beveiliging Checklist

- [ ] Wachtwoorden encrypted in database
- [ ] RLS policies actief
- [ ] HTTPS/TLS voor alle verbindingen
- [ ] App-specifieke wachtwoorden aanbevolen
- [ ] Rate limiting op edge functions
- [ ] Audit logging voor email acties

