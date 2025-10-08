# 👷 MONTEUR BESCHIKBAARHEID GUIDE

## 🎯 HOE TE GEBRUIKEN ALS ADMIN

### **STAP 1: GA NAAR GEBRUIKERSBEHEER**

**Navigatie:**
```
Dashboard → Gebruikers tab
```

Of via sidebar:
```
☰ Menu → Gebruikers
```

---

### **STAP 2: SELECTEER EEN MONTEUR**

**In de gebruikerslijst:**
```
1. Zoek de monteur (bijv. "Gregory")
2. Klik op de rij van de monteur
   OF
3. Klik op "..." acties menu → "Beschikbaarheid"
```

---

### **STAP 3: BESCHIKBAARHEID DIALOG OPENT**

**Je ziet nu een dialog met 2 tabs:**

**Tab 1: 📅 WEEKSCHEMA**
```
Standaard werkuren per dag instellen
```

**Tab 2: 🏖️ VRIJE DAGEN**
```
Vakantie, ziek, verlof registreren
```

---

## 📅 TAB 1: WEEKSCHEMA INSTELLEN

### **OPTIE A: STANDAARD WERKWEEK TOEVOEGEN**

**1. Klik op knop: "Standaard Werkweek Toevoegen"**
```
Dit voegt automatisch toe:
├─ Maandag:    08:00 - 17:00 (pauze 12:00-13:00)
├─ Dinsdag:    08:00 - 17:00 (pauze 12:00-13:00)
├─ Woensdag:   08:00 - 17:00 (pauze 12:00-13:00)
├─ Donderdag:  08:00 - 17:00 (pauze 12:00-13:00)
└─ Vrijdag:    08:00 - 17:00 (pauze 12:00-13:00)
```

**2. Succes melding:**
```
✅ Standaard werkweek toegevoegd
   Ma-Vr, 08:00-17:00 met 1 uur pauze
```

---

### **OPTIE B: HANDMATIG PER DAG INSTELLEN**

**Voor elke dag kun je instellen:**

**Maandag (voorbeeld):**
```
┌─────────────────────────────────────┐
│ 📅 Maandag                          │
├─────────────────────────────────────┤
│ ☑ Beschikbaar                       │
│                                     │
│ Start tijd:    [08:00] ⏰           │
│ Eind tijd:     [17:00] ⏰           │
│                                     │
│ Pauze start:   [12:00] ☕           │
│ Pauze eind:    [13:00] ☕           │
│                                     │
│ Notities:      [_______________]    │
│                                     │
│ [💾 Opslaan] [🗑️ Verwijder]         │
└─────────────────────────────────────┘
```

**Velden uitleg:**

| Veld | Betekenis | Voorbeeld |
|------|-----------|-----------|
| **☑ Beschikbaar** | Monteur werkt deze dag | Aan = Ja, Uit = Vrij |
| **Start tijd** | Begin werkdag | 08:00 |
| **Eind tijd** | Einde werkdag | 17:00 |
| **Pauze start** | Begin lunchpauze | 12:00 |
| **Pauze eind** | Einde lunchpauze | 13:00 |
| **Notities** | Extra info | "Alleen 's ochtends" |

---

### **VOORBEELDEN WERKSCHEMA'S:**

#### **Voorbeeld 1: Voltijd (Ma-Vr)**
```
Maandag:    ☑ 08:00 - 17:00 (pauze 12:00-13:00)
Dinsdag:    ☑ 08:00 - 17:00 (pauze 12:00-13:00)
Woensdag:   ☑ 08:00 - 17:00 (pauze 12:00-13:00)
Donderdag:  ☑ 08:00 - 17:00 (pauze 12:00-13:00)
Vrijdag:    ☑ 08:00 - 17:00 (pauze 12:00-13:00)
Zaterdag:   ☐ (niet beschikbaar)
Zondag:     ☐ (niet beschikbaar)

Totaal: 40 uur/week (exclusief pauzes: 35 uur)
```

#### **Voorbeeld 2: Parttime (Ma-Wo-Vr)**
```
Maandag:    ☑ 08:00 - 17:00
Dinsdag:    ☐ (vrije dag)
Woensdag:   ☑ 08:00 - 17:00
Donderdag:  ☐ (vrije dag)
Vrijdag:    ☑ 08:00 - 17:00
Zaterdag:   ☐
Zondag:     ☐

Totaal: 24 uur/week (exclusief pauzes: 21 uur)
```

#### **Voorbeeld 3: Vroege Shift**
```
Maandag:    ☑ 06:00 - 15:00 (pauze 11:00-11:30)
Dinsdag:    ☑ 06:00 - 15:00 (pauze 11:00-11:30)
Woensdag:   ☑ 06:00 - 15:00 (pauze 11:00-11:30)
Donderdag:  ☑ 06:00 - 15:00 (pauze 11:00-11:30)
Vrijdag:    ☑ 06:00 - 15:00 (pauze 11:00-11:30)

Totaal: 40 uur/week (exclusief pauzes: 37.5 uur)
```

#### **Voorbeeld 4: Weekend Monteur**
```
Maandag:    ☐ (vrij)
Dinsdag:    ☐ (vrij)
Woensdag:   ☐ (vrij)
Donderdag:  ☐ (vrij)
Vrijdag:    ☐ (vrij)
Zaterdag:   ☑ 08:00 - 18:00 (pauze 13:00-14:00)
Zondag:     ☑ 08:00 - 18:00 (pauze 13:00-14:00)

Totaal: 18 uur/weekend (exclusief pauzes: 16 uur)
```

---

## 🏖️ TAB 2: VRIJE DAGEN / VERLOF

### **VERLOF AANVRAGEN TOEVOEGEN**

**1. Klik op: "+ Verlof Toevoegen"**

**2. Vul formulier in:**
```
┌─────────────────────────────────────┐
│ Verlof Aanvraag                     │
├─────────────────────────────────────┤
│ Type:        [Vakantie ▼]           │
│              - Vakantie             │
│              - Ziek                 │
│              - Persoonlijk          │
│              - Anders               │
│                                     │
│ Start datum: [📅 01-02-2025]        │
│ Eind datum:  [📅 07-02-2025]        │
│                                     │
│ Reden:       [Familie vakantie]    │
│                                     │
│ Status:      [Goedgekeurd ▼]       │
│              - In behandeling       │
│              - Goedgekeurd          │
│              - Afgewezen            │
│                                     │
│ [💾 Opslaan] [❌ Annuleren]         │
└─────────────────────────────────────┘
```

**3. Verlof wordt toegevoegd aan lijst**
```
┌─────────────────────────────────────────────┐
│ 🏖️ Vakantie                                 │
│ 01-02-2025 t/m 07-02-2025 (7 dagen)        │
│ Status: ✅ Goedgekeurd                      │
│ Reden: Familie vakantie                    │
│ [✏️ Bewerk] [🗑️ Verwijder]                  │
└─────────────────────────────────────────────┘
```

---

## 🎯 HOE WERKT HET IN DE PLANNING?

### **PLANNING SUGGESTIES**

Wanneer admin planning maakt, kan het systeem:

**1. Toon beschikbare monteurs:**
```
Voor 15 januari 2025, 10:00-17:00:

✅ Jan Smans    - Beschikbaar (08:00-17:00)
✅ Piet de Vries - Beschikbaar (08:00-17:00)
⚠️ Kees Jansen  - Beperkt beschikbaar (14:00-17:00)
❌ Henk Bakker  - Niet beschikbaar (Vakantie)
```

**2. Conflict waarschuwingen:**
```
⚠️ Let op: Jan Smans heeft al 2 planningen op deze dag
⚠️ Let op: Dit is buiten de werkuren van Piet (na 17:00)
❌ Fout: Henk Bakker heeft verlof op deze datum
```

**3. Optimale suggesties:**
```
💡 Suggestie: Piet de Vries is ideaal (geen conflicten)
💡 Suggestie: Kees Jansen heeft nog 4 uur beschikbaar
```

---

## 💾 DATABASE STRUCTUUR

### **user_availability Table:**
```sql
CREATE TABLE user_availability (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  day_of_week INTEGER, -- 0=Zondag, 1=Maandag, ... 6=Zaterdag
  start_time TIME,     -- Bijv. '08:00:00'
  end_time TIME,       -- Bijv. '17:00:00'
  is_available BOOLEAN DEFAULT true,
  break_start_time TIME, -- Bijv. '12:00:00'
  break_end_time TIME,   -- Bijv. '13:00:00'
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### **user_time_off Table:**
```sql
CREATE TABLE user_time_off (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  start_date DATE,
  end_date DATE,
  type VARCHAR(20), -- 'vacation', 'sick', 'personal', 'other'
  reason TEXT,
  status VARCHAR(20), -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## ✨ FEATURES

### **VOOR ADMIN:**
✅ **Weekschema beheer**
  - Instellen werkuren per dag
  - Pauzetijden configureren
  - On/Off schakelaar per dag
  - Notities per dag

✅ **Verlofbeheer**
  - Vakantie registreren
  - Ziekteverlof bijhouden
  - Persoonlijk verlof
  - Goedkeuren/Afwijzen

✅ **Standaard templates**
  - Voltijd werkweek (40u)
  - Parttime opties
  - Weekend shifts
  - Custom schema's

✅ **Overzicht & Rapportage**
  - Totaal uren per week
  - Beschikbaarheid per monteur
  - Verlof overzicht
  - Conflict detectie

### **VOOR MONTEUR (toekomst):**
⏳ Eigen beschikbaarheid bekijken
⏳ Verlof aanvragen (admin keurt goed)
⏳ Beschikbaarheid update (admin keurt goed)
⏳ Notificaties bij wijzigingen

---

## 🚀 HOE TE ACTIVEREN

### **STAP 1: Check of tabel bestaat**

```sql
-- Check user_availability
SELECT * FROM user_availability LIMIT 1;

-- Check user_time_off
SELECT * FROM user_time_off LIMIT 1;
```

### **STAP 2: Ga naar Gebruikersbeheer**

```
Dashboard → Gebruikers tab
```

### **STAP 3: Selecteer monteur**

```
Klik op monteur → "..." menu → Beschikbaarheid
```

### **STAP 4: Voeg standaard werkweek toe**

```
Klik: "Standaard Werkweek Toevoegen"
```

### **STAP 5: Pas aan indien nodig**

```
Wijzig uren per dag
Toggle aan/uit
Voeg pauzes toe
Save
```

---

## 📊 GEBRUIK IN PLANNING

### **Wanneer je planning maakt:**

**Planning Scherm:**
```
1. Klik op datum in kalender
2. Sidebar: "Te plannen projecten"
3. Selecteer project
4. Selecteer monteur ← HIER ZIE JE BESCHIKBAARHEID!
```

**Monteur Dropdown:**
```
[Select Monteur ▼]
├─ Jan Smans ✅ (Beschikbaar 08:00-17:00)
├─ Piet de Vries ⚠️ (Beperkt: 14:00-17:00)
└─ Henk Bakker ❌ (Vakantie t/m 15-01)
```

**Waarschuwing bij conflict:**
```
⚠️ Waarschuwing:
Deze tijd valt buiten de werkuren van Jan Smans.
Werkuren: 08:00 - 17:00
Gepland: 07:00 - 18:00

[Toch Plannen] [Tijd Aanpassen]
```

---

## 💡 TIPS & BEST PRACTICES

### **1. Stel beschikbaarheid in bij onboarding**
```
Nieuwe monteur → Direct beschikbaarheid instellen
```

### **2. Update bij contractwijzigingen**
```
Parttime → Voltijd: Update werkdagen
Shift change: Update uren
```

### **3. Plan verlof vooruit**
```
Vakantie bekend? → Direct in systeem
Team weet van tevoren wie afwezig is
```

### **4. Check beschikbaarheid voor planning**
```
Voor planning maken:
1. Check monteur beschikbaarheid
2. Check bestaande planningen
3. Check verlof
4. Plan optimaal
```

### **5. Gebruik notities**
```
"Alleen 's ochtends beschikbaar"
"Bij voorkeur niet op vrijdag"
"Rijbewijs B verplicht"
```

---

## 🔍 CONFLICT DETECTIE (Toekomst)

### **Automatische Checks:**

**Bij planning maken:**
```
✅ Is monteur beschikbaar op deze dag?
✅ Valt tijd binnen werkuren?
✅ Geen verlof op deze datum?
✅ Geen overlap met andere planningen?
✅ Genoeg reistijd tussen projecten?
```

**Waarschuwingen:**
```
⚠️ Soft conflict: Buiten normale werkuren
❌ Hard conflict: Verlof of niet beschikbaar
💡 Suggestie: Alternatieve monteur of tijd
```

---

## 🎯 SAMENVATTING

### **HOE GEBRUIK JE HET?**

**Als Admin:**
```
1. Dashboard → Gebruikers
2. Klik monteur → Beschikbaarheid
3. Tab 1: Weekschema instellen
   └─ Optie: "Standaard Werkweek" knop
   └─ Of: Handmatig per dag
4. Tab 2: Verlof toevoegen
   └─ Vakantie, ziek, etc.
5. Save & Klaar!
```

**Bij Planning Maken:**
```
1. Planning tab → Datum kiezen
2. Monteur selecteren
3. Systeem toont beschikbaarheid
4. Waarschuwing bij conflict
5. Plan project
```

**Voordelen:**
```
✅ Geen planning buiten werkuren
✅ Geen planning tijdens verlof
✅ Betere workload spreiding
✅ Minder conflicten
✅ Hogere tevredenheid monteurs
```

---

## 🚨 TROUBLESHOOTING

### **"Ik zie geen Beschikbaarheid optie"**
```
Check:
├─ Ben je Administrator?
├─ Is gebruiker een Installateur?
└─ Update pagina

Fix:
→ Zorg dat je admin rechten hebt
```

### **"Standaard werkweek knop werkt niet"**
```
Check:
├─ Is er al een schema voor deze monteur?
└─ Verwijder bestaand schema eerst

Fix:
→ Verwijder oude schema eerst
→ Dan pas "Standaard Werkweek"
```

### **"Planning valideert niet op beschikbaarheid"**
```
Dit is TOEKOMSTIGE feature:
⏳ Automatische validatie komt nog

Nu:
→ Handmatig checken beschikbaarheid
→ Check weekschema monteur
```

---

**🎊 NU WEET JE HOE MONTEUR BESCHIKBAARHEID WERKT! 🎊**

**Vragen?**
- Check PLANNING_WORKFLOW_GUIDE.md
- Check deze guide
- Test met een monteur account

**Laatste Update:** 8 januari 2025  
**Versie:** 1.0  
**Contact:** SMANS BV Development Team

