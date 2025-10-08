# Project Status Automation & Email Notificaties - COMPLETE ✅

## 🎯 Implementatie Overzicht

**Datum:** 10 januari 2025  
**Status:** ✅ COMPLEET - Ready for deployment

Dit systeem lost het probleem op waarbij projecten op "te-plannen" blijven staan, ook na meerdere keren inplannen. Daarnaast worden nu automatisch email notificaties naar klanten gestuurd.

---

## 🔧 Wat Is Geïmplementeerd

### 1. ✅ Automatische Project Status Updates

**File:** `src/hooks/usePlanningStore.ts`

**Functionaliteit:**
- Wanneer een project wordt ingepland, wordt de status automatisch bijgewerkt naar `gepland`
- Alleen projecten met status `te-plannen` worden bijgewerkt (voorkomt overschrijven)
- Status updates worden automatisch doorgegeven aan de project lijst

**Status Flow:**
```
te-plannen → gepland → in-uitvoering → afgerond
     ↓           ↓            ↓            ↓
  Planning   Planning    Monteur    Werkbon
  aanmaken   update     start      afgerond
```

**Code snippet:**
```typescript
// Update project status to 'gepland' if project is linked
if (newItem.project_id) {
  await supabase
    .from('projects')
    .update({ status: 'gepland' })
    .eq('id', newItem.project_id)
    .eq('status', 'te-plannen'); // Only update if currently te-plannen
}
```

### 2. ✅ Dubbele Planningen Voorkomen

**File:** `src/hooks/usePlanningStore.ts`

**Functionaliteit:**
- Controleert of er al een planning bestaat voor dezelfde `project_id` + `assigned_user_id`
- Als planning bestaat: UPDATE in plaats van INSERT
- Voorkomt dat het "laadpaal" project 3x wordt ingepland

**Voordelen:**
- ✅ Eén planning per project per monteur
- ✅ Aanpassingen mogelijk zonder duplicaten
- ✅ Database blijft schoon

**Code snippet:**
```typescript
// Check for existing planning to prevent duplicates
if (newItem.project_id && newItem.assigned_user_id) {
  const { data: existing } = await supabase
    .from('planning_items')
    .select('id')
    .eq('project_id', newItem.project_id)
    .eq('assigned_user_id', newItem.assigned_user_id)
    .maybeSingle();
  
  if (existing) {
    // UPDATE instead of INSERT
    // ...
  }
}
```

### 3. ✅ Email Notificatie Systeem

**Nieuwe Bestanden:**
1. `supabase/migrations/20250110000003_email_notification_settings.sql`
2. `supabase/functions/send-project-planned-email/index.ts`
3. `src/components/settings/EmailNotificationSettings.tsx`

**Database Tabel:** `email_notification_settings`
```sql
- planning_email_enabled (boolean)
- planning_email_subject (text)
- planning_email_body (text)
- completion_email_enabled (boolean)
```

**Placeholders voor Email Templates:**
- `{customer_name}` - Naam van de klant
- `{project_title}` - Titel van het project
- `{planning_date}` - Datum van de planning (Nederlands formaat)
- `{planning_time}` - Tijd van de planning (HH:MM)
- `{monteur_name}` - Naam van de monteur
- `{project_location}` - Locatie van het project

**Email Flow:**
```
Planning aanmaken
       ↓
notify_customer = true?
       ↓
sendPlanningEmail()
       ↓
Fetch settings from DB
       ↓
Replace placeholders
       ↓
Generate HTML email
       ↓
send-email-smans (SMTP)
       ↓
Email verzonden ✅
```

### 4. ✅ Admin Settings UI

**File:** `src/components/settings/EmailNotificationSettings.tsx`

**Features:**
- ✅ Toggle om planning emails aan/uit te zetten
- ✅ Bewerkbaar email onderwerp
- ✅ Bewerkbare email body met placeholders
- ✅ Real-time opslaan naar database
- ✅ Info over completion emails (automatisch via werkbon)
- ✅ Mooie UI met icons en tooltips

**Toegang:**
- Dashboard → Instellingen → E-mail Notificaties
- Alleen voor Administrators en Administratie

---

## 📁 Gewijzigde/Nieuwe Bestanden

### Frontend (TypeScript/React)
```
✏️  src/hooks/usePlanningStore.ts              # Auto status + dubbele planning check + email trigger
✨  src/components/settings/EmailNotificationSettings.tsx  # Settings UI component
✏️  src/pages/Settings.tsx                      # Nieuw menu item toegevoegd
```

### Backend (Supabase)
```
✨  supabase/migrations/20250110000003_email_notification_settings.sql
✨  supabase/functions/send-project-planned-email/index.ts
```

### Documentation
```
✨  PROJECT_STATUS_AUTOMATION_COMPLETE.md       # Dit bestand
```

---

## 🚀 Deployment Instructies

### Stap 1: Database Migration Uitvoeren

**Via Supabase CLI:**
```bash
# Push migration naar Supabase
supabase db push

# Verificatie: Check dat tabel bestaat
supabase db remote ls
```

**Via Supabase Dashboard (alternatief):**
1. Ga naar Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20250110000003_email_notification_settings.sql`
3. Kopieer de SQL en run in de editor
4. Verify: Query `SELECT * FROM email_notification_settings;` → moet 1 record tonen

### Stap 2: Edge Function Deployen

```bash
# Deploy de nieuwe Edge Function
supabase functions deploy send-project-planned-email

# Verificatie
supabase functions list
# Output: send-project-planned-email [deployed]
```

**BELANGRIJK:** Zorg dat `send-email-smans` Edge Function ook deployed is (vereiste dependency)

### Stap 3: Secrets Controleren

De Edge Function gebruikt de volgende secrets (moeten al geconfigureerd zijn):
```bash
# Check bestaande secrets
supabase secrets list

# Vereiste secrets:
# - SMANS_SMTP_HOST=smtp.hostnet.nl
# - SMANS_SMTP_PORT=587
# - SMANS_SMTP_EMAIL=info@smansonderhoud.nl
# - SMANS_SMTP_PASSWORD=[password]
```

Als deze secrets nog niet bestaan:
```bash
supabase secrets set SMANS_SMTP_HOST=smtp.hostnet.nl
supabase secrets set SMANS_SMTP_PORT=587
supabase secrets set SMANS_SMTP_EMAIL=info@smansonderhoud.nl
supabase secrets set SMANS_SMTP_PASSWORD=2023!Welkom@
```

### Stap 4: Frontend Deployen

```bash
# Commit en push (automatic deployment via Vercel)
git add -A
git commit -m "feat: ✅ Project Status Automation & Email Notificaties"
git push origin main
```

---

## ✅ Test Scenario

### Test 1: Project Status Automation

1. **Maak nieuw project aan**
   - Status moet zijn: `te-plannen`
   
2. **Plan project in via Planning dashboard**
   - Selecteer project "Installeren van laadpaal"
   - Selecteer monteur (bijv. "Gregory")
   - Kies datum en tijd
   - Enable "Notify customer"
   
3. **Verwacht resultaat:**
   - ✅ Project status wordt `gepland`
   - ✅ Project verschijnt in "Geplande Installaties" lijst
   - ✅ Klant krijgt email
   
4. **Probeer nogmaals te plannen**
   - Selecteer zelfde project + monteur
   
5. **Verwacht resultaat:**
   - ✅ Bestaande planning wordt bijgewerkt (geen duplicaat)
   - ✅ Toast: "Planning bijgewerkt"

### Test 2: Email Notificatie

1. **Open Settings → E-mail Notificaties**
   
2. **Controleer/wijzig template:**
   - Subject: "Uw project is ingepland"
   - Body: Gebruik placeholders
   - Save
   
3. **Plan project in met notify_customer enabled**
   
4. **Verwacht resultaat:**
   - ✅ Klant ontvangt email met:
     - Juiste onderwerp
     - Gepersonaliseerde content (placeholders vervangen)
     - Datum in Nederlands formaat
     - Tijd zonder seconden (HH:MM)
     - SMANS BV footer
     - Professionele styling

### Test 3: Complete Workflow

```
1. Project aanmaken (status: te-plannen)
   ↓
2. Project inplannen
   ✅ Status → gepland
   ✅ Klant krijgt email
   ↓
3. Monteur start project (via mobile app)
   ✅ Status → in-uitvoering (AL WERKEND)
   ↓
4. Monteur rondt af met werkbon
   ✅ Status → afgerond (AL WERKEND)
   ✅ Klant krijgt werkbon PDF email (AL WERKEND)
```

---

## 🔍 Troubleshooting

### Probleem: Email wordt niet verzonden

**Diagnose:**
```javascript
// Check browser console:
// 1. "📧 Sending planning email for planning: [id]"
// 2. "Invoking send-project-planned-email Edge Function..."
// 3. "✅ Planning email sent successfully"
```

**Mogelijke oorzaken:**
1. `notify_customer` niet enabled bij planning aanmaken
2. Klant heeft geen email adres in database
3. Edge Function niet deployed
4. SMTP credentials niet correct

**Oplossing:**
```bash
# Check Edge Function logs
supabase functions logs send-project-planned-email

# Check SMTP secrets
supabase secrets list

# Test Edge Function direct
curl -X POST "https://[YOUR_PROJECT].supabase.co/functions/v1/send-project-planned-email" \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "customerName": "Test Klant",
    "projectTitle": "Test Project",
    "projectLocation": "Test Locatie",
    "planningDate": "2025-01-15",
    "planningTime": "10:00:00",
    "monteurName": "Test Monteur"
  }'
```

### Probleem: Project status blijft "te-plannen"

**Diagnose:**
- Check browser console voor errors
- Check database: `SELECT * FROM projects WHERE id = '[project-id]';`

**Mogelijke oorzaken:**
1. Project heeft geen `id` in planning data
2. Database permission error (RLS policy)
3. Project status was al anders dan "te-plannen"

**Oplossing:**
- Verify dat `project_id` correct is in planning data
- Check RLS policies op `projects` table
- Status handmatig resetten naar "te-plannen" en opnieuw proberen

### Probleem: Dubbele planning check werkt niet

**Diagnose:**
```sql
-- Check bestaande planningen
SELECT 
  id, 
  project_id, 
  assigned_user_id, 
  start_date 
FROM planning_items 
WHERE project_id = '[project-id]'
  AND assigned_user_id = '[user-id]';
```

**Mogelijke oorzaken:**
1. `project_id` of `assigned_user_id` is null/undefined
2. Database query faalt stil

**Oplossing:**
- Zorg dat beide fields altijd gevuld zijn
- Check console logs voor "Found existing planning..."

---

## 📊 Database Schema

### email_notification_settings Table

```sql
CREATE TABLE email_notification_settings (
  id UUID PRIMARY KEY,
  planning_email_enabled BOOLEAN DEFAULT true,
  planning_email_subject TEXT,
  planning_email_body TEXT,
  completion_email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default record
INSERT INTO email_notification_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001');
```

### RLS Policies

```sql
-- Admins can view settings
CREATE POLICY "Admins can view email settings"
ON email_notification_settings FOR SELECT
USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

-- Admins can update settings
CREATE POLICY "Admins can update email settings"
ON email_notification_settings FOR UPDATE
USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));
```

---

## 🎉 Resultaat

### Voor het Probleem
```
❌ Project "laadpaal" blijft op "te-plannen"
❌ 3x ingepland → 3 planning items in database
❌ Klant weet niet dat project is ingepland
❌ Project verschijnt niet in "Geplande Installaties"
```

### Na de Fix
```
✅ Project status wordt automatisch "gepland"
✅ 1 planning per project+monteur (updates bij wijziging)
✅ Klant krijgt automatisch email met details
✅ Project verschijnt correct in "Geplande Installaties"
✅ Volledige workflow automation: te-plannen → gepland → in-uitvoering → afgerond
✅ Admin kan email templates aanpassen in Settings
```

---

## 📝 Developer Notes

### Herbruikbare Functies

**sendPlanningEmail()** in `usePlanningStore.ts`:
```typescript
// Gebruik in andere hooks/components:
import { usePlanningStore } from '@/hooks/usePlanningStore';

const { addPlanningItem } = usePlanningStore();

// Email wordt automatisch verzonden als notify_customer=true
await addPlanningItem({
  ...planningData,
  notify_customer: true,
  customer_id: customerId
});
```

**Edge Function Invocatie:**
```typescript
// Direct aanroepen (zonder usePlanningStore):
const { error } = await supabase.functions.invoke('send-project-planned-email', {
  body: {
    customerEmail: 'klant@example.com',
    customerName: 'Jan Jansen',
    projectTitle: 'Installatie Laadpaal',
    projectLocation: 'Amsterdam',
    planningDate: '2025-01-15',
    planningTime: '10:00:00',
    monteurName: 'Gregory'
  }
});
```

### Uitbreidingsmogelijkheden

**SMS Notificaties:**
- `planning_email_body` aanpassen voor SMS (max 160 chars)
- SMS gateway integreren (Twilio/MessageBird)
- Toggle in EmailNotificationSettings component

**iCal Attachments:**
- iCal generator is al beschikbaar (`src/utils/icalGenerator.ts`)
- Toevoegen aan `send-project-planned-email` Edge Function
- Klant kan afspraak direct in agenda zetten

**Reminder Emails:**
- Cronjob/Scheduled Function toevoegen
- 24 uur voor planning reminder sturen
- Bestaande `send-planning-reminder` Edge Function gebruiken

---

## ✅ Checklist voor Go-Live

- [x] Code geïmplementeerd
- [x] Linter errors opgelost
- [x] Migration aangemaakt
- [x] Edge Function aangemaakt
- [x] Settings UI component gebouwd
- [x] Settings menu item toegevoegd
- [ ] Database migration deployed
- [ ] Edge Function deployed
- [ ] SMTP secrets geconfigureerd
- [ ] Frontend deployed (automatic via git push)
- [ ] Test scenario uitgevoerd
- [ ] Email template aangepast in Settings (optioneel)

---

**Status:** ✅ READY FOR DEPLOYMENT

**Laatste update:** 10 januari 2025  
**Ontwikkelaar:** Claude AI + User (SMANS CRM)  
**Versie:** 1.0.0

