# Offerte Archivering - Functionaliteit & Instructies

## ✅ **Wat is geïmplementeerd:**

### **1. Archivering Systeem**
- ✅ Soft-delete functionaliteit (offertes worden gearchiveerd, niet verwijderd)
- ✅ Aparte tab voor "Gearchiveerde Offertes"
- ✅ Herstel functionaliteit voor gearchiveerde offertes
- ✅ Permanent verwijderen voor gearchiveerde offertes
- ✅ Bevestigingsdialogen voor alle delete acties

### **2. UI Verbeteringen**
- ✅ Duidelijke "Archiveren" knop (oranje) voor actieve offertes
- ✅ "Herstellen" knop voor gearchiveerde offertes
- ✅ "Permanent verwijderen" knop (rood) voor gearchiveerde offertes
- ✅ Archive icon 📦 voor archiveren
- ✅ Trash icon 🗑️ voor permanent verwijderen
- ✅ RotateCcw icon 🔄 voor herstellen

### **3. Bevestigingsdialogen**
**Voor Archiveren:**
- Oranje kleurthema
- Toont offertegegevens (nummer, klant, bedrag)
- Melding dat offerte kan worden hersteld

**Voor Permanent Verwijderen:**
- Rood kleurthema (destructive)
- Waarschuwing dat actie niet ongedaan gemaakt kan worden
- Toont offertegegevens ter bevestiging

### **4. Toast Notificaties**
- ✅ "Offerte gearchiveerd ✓" - met instructie waar te vinden
- ✅ "Offerte hersteld ✓" - met bevestiging dat offerte actief is
- ✅ "Offerte permanent verwijderd ✓" - met waarschuwing

---

## 📋 **Hoe het werkt:**

### **Actieve Offertes Tab:**
1. Klik op "Acties" (⋯) bij een offerte
2. Selecteer "Archiveren" 📦
3. Bevestig in de dialoog
4. Offerte verdwijnt uit actieve offertes
5. Toast notificatie verschijnt
6. Offerte is te vinden in "Gearchiveerde Offertes" tab

### **Gearchiveerde Offertes Tab:**
**Herstellen:**
1. Ga naar "Gearchiveerde Offertes" tab
2. Klik op "Acties" (⋯) bij een offerte
3. Selecteer "Herstellen" 🔄
4. Offerte keert terug naar actieve offertes

**Permanent Verwijderen:**
1. Ga naar "Gearchiveerde Offertes" tab
2. Klik op "Acties" (⋯) bij een offerte
3. Selecteer "Permanent verwijderen" 🗑️
4. Bevestig in de rode waarschuwingsdialoog
5. Offerte wordt definitief verwijderd

---

## 🗄️ **Database Structuur:**

### **Kolommen in `quotes` tabel:**
```sql
is_archived         BOOLEAN DEFAULT FALSE
archived_at         TIMESTAMP WITH TIME ZONE
archived_by         UUID REFERENCES auth.users(id)
```

### **Functies:**
- `deleteQuote()` → Soft delete (archiveren)
- `restoreQuote()` → Herstellen uit archief
- `permanentDeleteQuote()` → Definitief verwijderen

---

## 🧪 **Testen:**

### **Optie 1: Via UI**
1. Open de app
2. Ga naar Offertes
3. Test archiveren van een concept offerte
4. Controleer in "Gearchiveerde Offertes" tab
5. Test herstellen
6. Test permanent verwijderen

### **Optie 2: Via SQL**
Voer uit in Supabase SQL Editor:
```bash
# Bestand: TEST-QUOTE-ARCHIVING.sql
```

Dit script controleert:
- ✅ Database kolommen bestaan
- ✅ Telling van actieve vs gearchiveerde offertes
- ✅ Recente archieven
- ✅ Data consistentie (geen NULL waarden)

---

## 🔧 **Troubleshooting:**

### **Probleem: Offerte verdwijnt niet na archiveren**
```sql
-- Check is_archived status
SELECT id, quote_number, is_archived, archived_at 
FROM quotes 
WHERE quote_number = 'OFF-2025-001';

-- Handmatig archiveren (indien nodig)
UPDATE quotes 
SET is_archived = true, archived_at = NOW()
WHERE id = 'quote-id-here';
```

### **Probleem: Gearchiveerde offertes niet zichtbaar**
```sql
-- Controleer of er gearchiveerde offertes zijn
SELECT COUNT(*) FROM quotes WHERE is_archived = true;

-- Toon alle gearchiveerde offertes
SELECT quote_number, customer_name, archived_at 
FROM quotes 
WHERE is_archived = true
ORDER BY archived_at DESC;
```

### **Probleem: NULL waarden in is_archived**
```sql
-- Fix NULL waarden
UPDATE quotes 
SET is_archived = false 
WHERE is_archived IS NULL;
```

---

## 🎯 **Best Practices:**

1. **Archiveer regelmatig:**
   - Oude concept offertes
   - Afgewezen offertes
   - Verlopen offertes

2. **Gebruik Herstellen voor:**
   - Per ongeluk gearchiveerde offertes
   - Offertes die toch nog relevant zijn

3. **Permanent Verwijderen alleen voor:**
   - Test offertes
   - Dubbele offertes
   - Verouderde offertes (> 1 jaar)

4. **Controle:**
   - Controleer regelmatig het archief
   - Ruim definitief op na 2+ jaar
   - Maak backups voor permanent verwijderen

---

## 📝 **Changelog:**

**v1.0 - Archivering Systeem**
- ✅ Soft-delete met archivering
- ✅ Herstel functionaliteit
- ✅ Permanent verwijderen
- ✅ Bevestigingsdialogen
- ✅ Duidelijke UI labels en iconen
- ✅ Toast notificaties

**Database kolommen al aanwezig sinds:**
- `is_archived` - Migration 20250914175044
- `archived_at` - Migration 20250914175044
- `archived_by` - Migration 20250914175044

---

## 🚀 **Volgende Stappen (Optioneel):**

1. **Auto-archivering:**
   - Automatisch archiveren van oude concept offertes (> 6 maanden)
   - Cron job voor periodieke opschoning

2. **Rapportage:**
   - Dashboard statistieken (actief vs gearchiveerd)
   - Archivering trends
   - Storage optimalisatie

3. **Audit Trail:**
   - Loggen wie wat heeft gearchiveerd/hersteld
   - Reden voor archivering vastleggen

4. **Export:**
   - Export van gearchiveerde offertes
   - Bulk archivering/herstel

---

**Status:** ✅ Volledig geïmplementeerd en getest
**Versie:** 1.0
**Datum:** Oktober 2025

