# 📅 PLANNING WORKFLOW GUIDE - SMANS CRM

## 🎯 COMPLETE WORKFLOW UITLEG

### **PROJECT STATUSSEN:**

```
1. TE-PLANNEN   → Project is aangemaakt, nog geen datum
2. GEPLAND      → Planning gemaakt, monteur toegewezen
3. IN-UITVOERING → Monteur is gestart met project
4. HERKEURING   → Project moet opnieuw bekeken worden  
5. AFGEROND     → Project compleet + werkbon verstuurd
```

---

## 👥 ROLLEN & TOEGANG

### **ADMINISTRATOR / ADMINISTRATIE:**
✅ Kan alle projecten zien
✅ Kan projecten aanmaken
✅ Kan planning maken
✅ Kan monteurs toewijzen
✅ Heeft toegang tot Planning scherm

### **MONTEUR (Installateur):**
✅ Ziet alleen eigen toegewezen projecten
✅ Kan projecten starten/afronden
❌ Kan **GEEN** planning maken
❌ Heeft **GEEN** toegang tot Planning scherm

---

## 📋 STAP-VOOR-STAP WORKFLOW

### **STAP 1: PROJECT AANMAKEN**

**Waar:** Dashboard → Projecten tab → "Nieuw Project" knop

**Wat gebeurt er:**
```
Admin maakt nieuw project aan:
├─ Klant selecteren
├─ Project titel & beschrijving
├─ Taken toevoegen (optioneel)
├─ Status = "TE-PLANNEN" (automatisch)
└─ Project wordt opgeslagen
```

**Status:** `te-plannen`

---

### **STAP 2: PLANNING MAKEN**

**Waar:** Planning tab (alleen voor Admin/Administratie!)

**Hoe:**

**Methode A: Via Planning Kalender**
```
1. Ga naar "Planning" tab
2. Klik op een datum in de kalender
3. Sidebar opent rechts
4. Zoek project in "Te plannen projecten" lijst
5. Selecteer project
6. Selecteer monteur
7. Kies tijd (start/eind)
8. Klik "Toevoegen"
```

**Methode B: Via Project Detail**
```
1. Ga naar Project
2. Klik op "Planning" tab in project
3. Klik "Planning toevoegen"
4. Selecteer datum, monteur, tijd
5. Klik "Toevoegen"
```

**Wat gebeurt er:**
```
Planning wordt aangemaakt:
├─ planning_items tabel: nieuw record
│  ├─ project_id → gekoppeld aan project
│  ├─ assigned_user_id → monteur ID
│  ├─ start_date, start_time, end_time
│  └─ status = "Gepland"
│
├─ Project status → "GEPLAND"
│
└─ (Optioneel) Email naar klant met iCal
   └─ Als notify_customer = true
```

**Status:** `gepland`

---

### **STAP 3: MONTEUR ZIET PROJECT**

**Waar:** 
- **Desktop:** Dashboard → Eigen projecten sectie
- **Mobiel:** MobileDashboard → Project lijst

**Wat ziet monteur:**
```
Project kaart met:
├─ Project titel
├─ Klant naam & adres
├─ 📅 Planning datum & tijd
├─ Status badge: "GEPLAND"
├─ Voortgang percentage
└─ Klik om details te zien
```

**Monteur kan:**
- Project details bekijken
- Taken zien
- Contact info klant zien
- Navigatie naar adres starten

---

### **STAP 4: PROJECT STARTEN**

**Waar:** 
- **Desktop:** Project detail → "Start Project" knop
- **Mobiel:** Project detail → "Start Project" knop

**Wat gebeurt er:**
```
Project wordt gestart:
├─ Status → "IN-UITVOERING"
├─ GPS check-in (mobiel)
├─ Time tracking start
└─ Taken kunnen worden afgevinkt
```

**Status:** `in-uitvoering`

---

### **STAP 5: WERK UITVOEREN**

**Monteur doet:**
```
Tijdens het werk:
├─ ✅ Taken afvinken
├─ 📸 Foto's maken (before/during/after)
├─ 💶 Bonnetjes scannen (optioneel)
├─ ⏱️ Time tracking loopt
└─ 📝 Notities toevoegen
```

---

### **STAP 6: PROJECT AFRONDEN**

**Waar:** Project detail → "Project Afronden" knop

**7-Stappen Wizard:**
```
STAP 1: Taken selecteren
└─ Selecteer uitgevoerde taken voor werkbon

STAP 2: Beschrijving
└─ Schrijf wat er gedaan is

STAP 3: Foto's
└─ Upload/maak foto's (before/during/after/detail/overview)

STAP 4: Materialen
└─ Optioneel: materialen toevoegen

STAP 5: Tevredenheid
└─ Klant geeft 1-5 sterren

STAP 6: Handtekeningen
└─ Klant & Monteur tekenen digitaal

STAP 7: Aanbevelingen
└─ Optioneel: aanbevelingen voor klant
```

**Wat gebeurt er:**
```
Project completion:
├─ project_completions record aangemaakt
├─ completion_photos opgeslagen
├─ GPS check-out
├─ Time tracking stop
├─ Status → "AFGEROND"
│
├─ Werkbon PDF genereren
│  └─ Edge Function: generate-work-order
│  └─ PDF opgeslagen in Storage
│
└─ Email naar klant
   └─ Edge Function: send-completion-email
   └─ PDF als bijlage
```

**Status:** `afgerond`

---

## 🔍 WAAROM ZIE JE GEEN TE-PLANNEN PROJECTEN?

### **Mogelijke Oorzaken:**

**1. Je bent ingelogd als Monteur**
```
❌ Monteurs kunnen GEEN planning maken
❌ Monteurs zien GEEN "Planning" tab
✅ Alleen Admin/Administratie kan plannen

Oplossing:
→ Log in als Administrator
→ Dan zie je Planning tab
```

**2. Alle projecten zijn al gepland**
```
Check project statussen:
├─ Te-plannen: 0 projecten ← Dit is waarom!
├─ Gepland: X projecten
├─ In-uitvoering: Y projecten
└─ Afgerond: Z projecten

Oplossing:
→ Maak nieuw project aan
→ Status wordt automatisch "te-plannen"
```

**3. Filter of zoekterm actief**
```
Check of:
├─ Zoekbalk gevuld is
├─ Filter actief is
└─ Datum range ingesteld is

Oplossing:
→ Clear filters
→ Clear zoekterm
```

**4. RLS Policy blokkeert view**
```
Check of je de juiste rol hebt:
- Administrator ✅
- Administratie ✅  
- Installateur ❌ (geen planning toegang)

Oplossing:
→ Check je rol in Settings
→ Admin moet juiste rol toewijzen
```

---

## 🛠️ HOE TE GEBRUIKEN

### **A. NIEUW PROJECT PLANNEN**

**1. Maak project aan:**
```
Dashboard → Projecten → Nieuw Project
├─ Vul project details in
├─ Status = "te-plannen" (auto)
└─ Save
```

**2. Maak planning:**
```
Planning tab → Klik op datum
├─ Sidebar: "Te plannen projecten"
├─ Selecteer je nieuwe project
├─ Kies monteur
├─ Kies tijd
└─ Toevoegen
```

**3. Project is nu zichtbaar voor monteur:**
```
Monteur login:
├─ Ziet project in dashboard
├─ Status: "GEPLAND"
└─ Kan starten op planning datum
```

---

### **B. BESTAAND PROJECT HERPLANNEN**

**Als project status = "gepland" of "in-uitvoering":**

**Optie 1: Planning aanpassen**
```
Planning tab → Zoek planning item
├─ Klik op event
├─ Edit planning
└─ Save
```

**Optie 2: Nieuwe planning maken**
```
Project detail → Planning tab
├─ Voeg nieuwe planning toe
└─ Oude planning verwijderen
```

---

### **C. PLANNING MET KLANT COMMUNICATIE**

**Planning met email naar klant:**

```
Planning tab → "Nieuwe Planning" → Type: "Klant Afspraak"
├─ Project selecteren (optioneel)
├─ Klant selecteren
├─ Monteur(s) toewijzen
├─ Datum & tijd
├─ Expected duration
├─ Special instructions
├─ ☑ Notify customer ← BELANGRIJK!
├─ ☑ Notify SMS (optioneel)
└─ Save

Dan gebeurt automatisch:
├─ Planning aangemaakt
├─ Email naar klant (met iCal)
├─ 24h reminder (automatisch)
└─ Bevestigingslink voor klant
```

---

## 📱 MOBIEL vs DESKTOP

### **Desktop (Admin/Administratie):**
```
Volledige CRM:
├─ Dashboard met overzicht
├─ Projecten lijst
├─ Planning kalender ✅
├─ Klanten beheer
├─ Facturen
├─ Offertes
├─ Time registration
└─ Alle admin functies
```

### **Mobiel (Monteur):**
```
Simplified Interface:
├─ "Mijn Projecten" lijst
├─ Project details
├─ Taken afvinken
├─ Foto's maken
├─ Bonnetjes scannen
├─ Time tracking
├─ Project afronden
└─ ❌ GEEN planning maken
```

---

## 🎨 UI LOCATIES

### **Planning Tab (Admin only):**
```
Desktop:
└─ Sidebar → "Planning" menu item
   └─ Kalender view
      ├─ Week/Maand/Dag view
      ├─ Planning events
      └─ "Te plannen projecten" sidebar
```

### **Project in Planning Tab:**
```
Desktop:
└─ Project detail → "Planning" tab
   └─ Project-specific planning
      ├─ Bestaande planningen
      └─ "Planning toevoegen" button
```

### **Te-Plannen Projecten Lijst:**
```
Desktop:
└─ Planning tab → Klik op datum
   └─ Sidebar rechts
      └─ Sectie: "Te plannen projecten"
         └─ Filter: status = 'te-plannen' OR 'gepland'
```

---

## 🚨 TROUBLESHOOTING

### **"Ik zie geen Planning tab"**
```
Check:
├─ Ben je Administrator/Administratie?
├─ Is je rol correct ingesteld?
└─ Refresh de pagina

Oplossing:
→ Log in als admin account
→ Check Settings → Users → Je eigen rol
```

### **"Te plannen projecten lijst is leeg"**
```
Check:
├─ Zijn er projecten met status "te-plannen"?
├─ Maak test project aan
└─ Refresh planning pagina

Test:
1. Dashboard → Projecten
2. Nieuw Project aanmaken
3. Check status = "te-plannen"
4. Ga naar Planning tab
5. Klik op datum
6. Project zou in sidebar moeten staan
```

### **"Monteur ziet project niet"**
```
Check:
├─ Is planning aangemaakt?
├─ Is monteur assigned_user_id?
├─ Is project status = "gepland"?

Fix:
1. Planning tab → Check planning item
2. Verify assigned_user_id = monteur ID
3. Check project.status = "gepland"
```

### **"Planning email komt niet aan"**
```
Check:
├─ Is SMTP geconfigureerd?
├─ Is notify_customer = true?
├─ Is klant email correct?

Fix:
1. Check SMANS_SMTP_DEPLOYMENT_GUIDE.md
2. Test email met curl command
3. Check Edge Function logs
```

---

## 🎯 BEST PRACTICES

### **Planning Tips:**
1. ✅ Plan projecten 1-2 dagen van tevoren
2. ✅ Gebruik "expected duration" voor realistische planning
3. ✅ Notify customer = true voor betere communicatie
4. ✅ Voeg special instructions toe als er bijzonderheden zijn
5. ✅ Multi-monteur teams voor grote projecten

### **Monteur Tips:**
1. ✅ Check planning elke ochtend
2. ✅ Start project bij aankomst (GPS check-in)
3. ✅ Maak foto's voor/tijdens/na werk
4. ✅ Vink taken af tijdens werk
5. ✅ Rond project af voor je vertrekt
6. ✅ Laat klant tekenen en beoordelen

### **Admin Tips:**
1. ✅ Update project status regelmatig
2. ✅ Check completed projects dagelijks
3. ✅ Monitor monteur workload
4. ✅ Plan reistijd tussen projecten
5. ✅ Gebruik planning notifications

---

## 📊 DATABASE STRUCTUUR

### **Projects Table:**
```sql
projects:
├─ id
├─ title
├─ description
├─ customer_id → customers.id
├─ assigned_user_id → auth.users.id (monteur)
├─ status → 'te-plannen' | 'gepland' | 'in-uitvoering' | 'afgerond'
├─ date → project datum
└─ created_at, updated_at
```

### **Planning Items Table:**
```sql
planning_items:
├─ id
├─ project_id → projects.id (optioneel)
├─ customer_id → customers.id (optioneel)
├─ assigned_user_id → auth.users.id (monteur)
├─ user_id → auth.users.id (creator)
├─ title
├─ description
├─ start_date → 'YYYY-MM-DD'
├─ start_time → 'HH:MM:SS'
├─ end_time → 'HH:MM:SS'
├─ location
├─ status → 'Gepland' | 'Bevestigd' | 'Afgerond'
├─ planning_type → 'customer' | 'internal' | 'maintenance'
├─ expected_duration_minutes
├─ notify_customer → boolean
└─ notify_sms → boolean
```

---

## 🔄 STATUS FLOW DIAGRAM

```
┌─────────────────┐
│   TE-PLANNEN    │ ← Project aangemaakt
└────────┬────────┘
         │
         │ Admin maakt planning
         │ + wijst monteur toe
         ↓
┌─────────────────┐
│    GEPLAND      │ ← Monteur ziet project
└────────┬────────┘
         │
         │ Monteur start project
         │ + GPS check-in
         ↓
┌─────────────────┐
│  IN-UITVOERING  │ ← Werk wordt gedaan
└────────┬────────┘   + Taken afvinken
         │             + Foto's maken
         │             + Bonnetjes
         │
         │ Monteur rondt af
         │ + Handtekeningen
         │ + PDF genereren
         ↓
┌─────────────────┐
│   AFGEROND      │ ← Werkbon naar klant
└─────────────────┘
```

---

## ✅ QUICK CHECKLIST

**Voor nieuw project plannen:**
- [ ] Ingelogd als Admin/Administratie
- [ ] Project aangemaakt (status = te-plannen)
- [ ] Klant gekoppeld aan project
- [ ] Planning tab geopend
- [ ] Datum geklikt in kalender
- [ ] Project gezien in "Te plannen projecten"
- [ ] Monteur geselecteerd
- [ ] Tijd ingesteld
- [ ] Planning toegevoegd
- [ ] Project status = "gepland"
- [ ] Monteur ziet project in dashboard

**Voor project afronden:**
- [ ] Monteur heeft project gestart
- [ ] Taken zijn afgevinkt
- [ ] Foto's zijn gemaakt
- [ ] Project afronden geklikt
- [ ] 7-step wizard doorlopen
- [ ] Handtekeningen gezet
- [ ] PDF gegenereerd
- [ ] Email verzonden naar klant
- [ ] Project status = "afgerond"

---

## 📞 SUPPORT

**Problemen met planning?**
1. Check deze guide eerst
2. Check SMANS_SMTP_DEPLOYMENT_GUIDE.md voor email
3. Check FASE_3_COMPLETE.md voor planning features
4. Check database queries in guide

**Laatste Update:** 8 januari 2025  
**Versie:** 2.0  
**Contact:** SMANS BV Development Team

