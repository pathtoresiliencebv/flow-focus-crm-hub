# 🎨 UI/UX MOCKUPS - PLANNING & MONTEUR WORKFLOW

## 📋 INHOUDSOPGAVE
1. [Administrator Web Interface](#administrator-web-interface)
2. [Monteur Mobiele App](#monteur-mobiele-app)
3. [Design System](#design-system)
4. [User Flows](#user-flows)
5. [Component Library](#component-library)

---

## 👨‍💼 ADMINISTRATOR WEB INTERFACE

### **1. PLANNING KALENDER - HOOFDSCHERM**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Smans CRM                                    👤 Admin  🔔 (3)   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📅  PLANNING KALENDER                                               │
│  ───────────────────────────────────────────────────────────────────│
│                                                                       │
│  [🔍 Zoeken...]  [📍 Locatie]  [👷 Monteurs▾]  [📊 View▾]          │
│                                                                       │
│  ⟨  Oktober 2025  ⟩                      [+ Planning Toevoegen]     │
│                                                                       │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                       │
│  │ Ma  │ Di  │ Wo  │ Do  │ Vr  │ Za  │ Zo  │                       │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                       │
│  │  30 │  1  │  2  │  3  │  4  │  5  │  6  │                       │
│  │     │     │ 🔵  │ 🟢  │     │     │     │                       │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                       │
│  │  7  │  8  │  9  │ 10  │ 11  │ 12  │ 13  │                       │
│  │ 🔴  │ 🔴  │ 🟢  │     │ 🔵  │     │     │                       │
│  │ 🟠  │     │ 🔵  │     │ 🔵  │     │     │                       │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                       │
│  │ 14  │ 15  │ 16  │ 17  │ 18  │ 19  │ 20  │                       │
│  │ 🟢  │ 🔵  │ 🔵  │     │ 🟠  │     │     │                       │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                       │
│                                                                       │
│  📊 LEGENDA:                                                         │
│  🔴 Klant Afspraak  🟢 Monteur Planning  🔵 Team Project  🟠 Intern │
│                                                                       │
│  👷 MONTEURS FILTER:                                                 │
│  [●] Jan Smit (3)  [●] Piet Vos (2)  [●] Kees de Jong (1)          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

CLICK GEDRAG:
- Klik op lege datum → "Planning Toevoegen" dialog
- Klik op gekleurde stip → "Planning Details" view
- Drag & drop → Planning verplaatsen
- Hover → Tooltip met details
```

---

### **2. KLANT AFSPRAAK PLANNEN - DIALOG (Multi-Step)**

#### **STAP 1: TYPE SELECTIE**

```
┌──────────────────────────────────────────┐
│  NIEUWE PLANNING                    [✕]  │
├──────────────────────────────────────────┤
│                                          │
│  Selecteer Type:                         │
│  ┌──────────────────────────────────┐  │
│  │  👤 KLANT AFSPRAAK               │  │
│  │  Plan een afspraak met een klant │  │
│  │  • Notificaties naar klant        │  │
│  │  • Monteur toewijzing             │  │
│  │  • Automatische bevestiging       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  👷 MONTEUR PLANNING             │  │
│  │  Interne planning voor monteur   │  │
│  │  • Geen klant notificaties        │  │
│  │  • Direct plannen                 │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  👥 TEAM PROJECT                 │  │
│  │  Multi-monteur planning           │  │
│  │  • Meerdere monteurs              │  │
│  │  • Coördinatie tools              │  │
│  └──────────────────────────────────┘  │
│                                          │
│           [Annuleren]  [Volgende→]      │
└──────────────────────────────────────────┘
```

#### **STAP 2: KLANT SELECTIE** (Als "Klant Afspraak" gekozen)

```
┌──────────────────────────────────────────┐
│  KLANT AFSPRAAK  (Stap 2/5)        [✕]  │
├──────────────────────────────────────────┤
│                                          │
│  Selecteer Klant:                        │
│  ┌────────────────────────────────────┐ │
│  │ 🔍 Zoek klant...                   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Recent:                                 │
│  ┌────────────────────────────────────┐ │
│  │ 📋 Jan Smit                        │ │
│  │    Hoofdstraat 123, Amsterdam      │ │
│  │    ✅ Email  ✅ Tel: 06-12345678   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 📋 Maria de Vries                  │ │
│  │    Kerkstraat 45, Utrecht          │ │
│  │    ✅ Email  ❌ Geen telefoon      │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 📋 Piet Bakker B.V.                │ │
│  │    Industrieweg 78, Rotterdam      │ │
│  │    ✅ Email  ✅ Tel: 010-1234567   │ │
│  │    🏢 Zakelijk                     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [+ Nieuwe Klant]                        │
│                                          │
│         [←Terug]  [Annuleren]  [Volgende→] │
└──────────────────────────────────────────┘

GESELECTEERDE KLANT:
┌────────────────────────────────────┐
│  ✓ Jan Smit                        │
│    Hoofdstraat 123, 1012 AB        │
│    📧 jan@email.nl                 │
│    📞 06-12345678                  │
│    🔔 Email ✓  SMS ✓               │
└────────────────────────────────────┘
```

#### **STAP 3: PROJECT & DETAILS**

```
┌──────────────────────────────────────────┐
│  KLANT AFSPRAAK  (Stap 3/5)        [✕]  │
├──────────────────────────────────────────┤
│                                          │
│  Project Koppeling:                      │
│  ○ Bestaand Project                      │
│  ● Nieuw Project                         │
│                                          │
│  Titel: *                                │
│  ┌────────────────────────────────────┐ │
│  │ Zonnepanelen installatie           │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Beschrijving:                           │
│  ┌────────────────────────────────────┐ │
│  │ Installatie 10 zonnepanelen        │ │
│  │ + omvormer op plat dak             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  📅 Datum & Tijd:                        │
│  ┌──────────────┐  ┌──────┐  ┌──────┐  │
│  │ 15-10-2025   │  │ 08:00│  │ 17:00│  │
│  └──────────────┘  └──────┘  └──────┘  │
│                                          │
│  ⏱️ Verwachte Duur:                      │
│  ┌────────────────────────────────────┐ │
│  │ 8 uur  [●━━━━━━━━━━━━━━] (1-12u)  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  📍 Locatie: (Auto-filled)               │
│  ┌────────────────────────────────────┐ │
│  │ Hoofdstraat 123, Amsterdam         │ │
│  │ [📍 Kaart]  [✏️ Wijzigen]          │ │
│  └────────────────────────────────────┘ │
│                                          │
│         [←Terug]  [Annuleren]  [Volgende→] │
└──────────────────────────────────────────┘
```

#### **STAP 4: MONTEUR SELECTIE**

```
┌──────────────────────────────────────────┐
│  KLANT AFSPRAAK  (Stap 4/5)        [✕]  │
├──────────────────────────────────────────┤
│                                          │
│  Monteur Toewijzing:                     │
│  ┌────────────────────────────────────┐ │
│  │ 🔍 Zoek monteur...                 │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Beschikbaar op 15 okt 2025:             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ● Jan Smit                          │ │
│  │   Certificering: Zonnepanelen A+    │ │
│  │   📅 Beschikbaar: 08:00 - 18:00    │ │
│  │   📊 Rating: ⭐⭐⭐⭐⭐ (4.8/5)      │ │
│  │   🛠️ Lopende projecten: 2           │ │
│  │   [Selecteer]                       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ○ Piet Vos                          │ │
│  │   Certificering: Zonnepanelen A     │ │
│  │   📅 Beperkt: 08:00 - 12:00        │ │
│  │   ⚠️ Al 1 afspraak die dag         │ │
│  │   📊 Rating: ⭐⭐⭐⭐ (4.2/5)        │ │
│  │   [Selecteer]                       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ☑️ Tweede monteur toevoegen (team)     │
│  ┌────────────────────────────────────┐ │
│  │ ○ Kees de Jong (Assistent)         │ │
│  │   📅 Beschikbaar: 08:00 - 18:00    │ │
│  │   [Selecteer]                       │ │
│  └────────────────────────────────────┘ │
│                                          │
│         [←Terug]  [Annuleren]  [Volgende→] │
└──────────────────────────────────────────┘
```

#### **STAP 5: NOTIFICATIES & BEVESTIGING**

```
┌──────────────────────────────────────────┐
│  KLANT AFSPRAAK  (Stap 5/5)        [✕]  │
├──────────────────────────────────────────┤
│                                          │
│  📧 Klant Notificaties:                  │
│  ☑️ Email versturen naar klant           │
│     └─ ✉️ jan@email.nl                  │
│  ☑️ SMS versturen naar klant             │
│     └─ 📱 06-12345678 (€0,09)           │
│  ☑️ iCal bijlage toevoegen               │
│  ☑️ Herinnering 1 dag voor afspraak      │
│                                          │
│  🔔 Monteur Notificaties:                │
│  ☑️ Push notificatie naar Jan Smit       │
│  ☑️ Email bevestiging                    │
│                                          │
│  📄 PREVIEW EMAIL NAAR KLANT:            │
│  ┌────────────────────────────────────┐ │
│  │ Onderwerp:                          │ │
│  │ Afspraak bevestigd - Zonnepanelen  │ │
│  │                                     │ │
│  │ Beste Jan,                          │ │
│  │                                     │ │
│  │ Uw afspraak is ingepland:          │ │
│  │ 📅 15 oktober 2025                  │ │
│  │ ⏰ 08:00 - 17:00                    │ │
│  │ 📍 Hoofdstraat 123, Amsterdam       │ │
│  │ 👷 Monteur: Jan Smit                │ │
│  │                                     │ │
│  │ [Bevestigen] [Wijzigen aanvragen]  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  📝 Speciale Instructies:                │
│  ┌────────────────────────────────────┐ │
│  │ Klant heeft hond - bel aan         │ │
│  │ Parkeren achter het gebouw         │ │
│  └────────────────────────────────────┘ │
│                                          │
│      [←Terug]  [Concept Opslaan]        │
│             [🚀 Plannen & Versturen]    │
└──────────────────────────────────────────┘

SUCCESS MELDING:
┌────────────────────────────────────┐
│  ✅ AFSPRAAK GEPLAND!              │
│                                    │
│  📧 Email verstuurd naar klant     │
│  📱 SMS verstuurd (€0,09)          │
│  🔔 Notificatie naar Jan Smit      │
│  📅 Toegevoegd aan kalender        │
│                                    │
│  [Sluiten]  [Nog een plannen]     │
└────────────────────────────────────┘
```

---

### **3. PLANNING DETAILS VIEW** (Als op planning wordt geklikt)

```
┌───────────────────────────────────────────────────────┐
│  PLANNING DETAILS                              [✕]    │
├───────────────────────────────────────────────────────┤
│                                                         │
│  🔴 KLANT AFSPRAAK                        [✏️ Bewerken]│
│  Status: ✅ Bevestigd door klant                       │
│                                                         │
│  📅 DATUM & TIJD                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  15 oktober 2025                                 │  │
│  │  ⏰ 08:00 - 17:00 (8 uur)                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  👤 KLANT                                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Jan Smit                                        │  │
│  │  📧 jan@email.nl                                 │  │
│  │  📱 06-12345678                                  │  │
│  │  📍 Hoofdstraat 123, Amsterdam                   │  │
│  │  [📞 Bellen]  [✉️ Emailen]  [🗺️ Navigeren]      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  🏗️ PROJECT                                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Zonnepanelen installatie                        │  │
│  │  10 panelen + omvormer op plat dak               │  │
│  │  [Project Details→]                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  👷 MONTEURS                                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ✓ Jan Smit (Hoofdmonteur)                      │  │
│  │     ⭐ 4.8/5  •  32 projecten dit jaar           │  │
│  │  ✓ Kees de Jong (Assistent)                     │  │
│  │     ⭐ 4.5/5  •  18 projecten dit jaar           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  📧 NOTIFICATIES                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Email:    ✅ Verstuurd (14 okt, 10:23)         │  │
│  │             ✅ Geopend (14 okt, 11:45)          │  │
│  │  SMS:      ✅ Verstuurd (14 okt, 10:23)         │  │
│  │  Monteur:  ✅ Bevestigd (14 okt, 10:30)         │  │
│  │  [📤 Opnieuw versturen]                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  📝 NOTITIES                                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │  • Klant heeft hond - bel aan                   │  │
│  │  • Parkeren achter het gebouw                    │  │
│  │  [+ Notitie toevoegen]                           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ACTIES:                                                │
│  [🗓️ Verplaatsen]  [✏️ Wijzigen]  [❌ Annuleren]      │
│                                                         │
└───────────────────────────────────────────────────────┘
```

---

## 📱 MONTEUR MOBIELE APP

### **1. LOGIN SCREEN**

```
┌─────────────────────────┐
│                         │
│      ┌─────────┐        │
│      │  SMANS  │        │
│      │   CRM   │        │
│      └─────────┘        │
│                         │
│   Monteur Portal        │
│                         │
│  ┌───────────────────┐  │
│  │ 📧 Email          │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 🔒 Wachtwoord     │  │
│  └───────────────────┘  │
│                         │
│  ☑️ Onthoud mij         │
│                         │
│  ┌───────────────────┐  │
│  │    INLOGGEN       │  │
│  └───────────────────┘  │
│                         │
│  Wachtwoord vergeten?   │
│                         │
│  v1.2.0 - Build 45      │
└─────────────────────────┘
```

---

### **2. DASHBOARD - HOOFDSCHERM**

```
┌─────────────────────────────────┐
│  ☰  Smans CRM      👤 Jan  🔔3  │
├─────────────────────────────────┤
│                                 │
│  🏠 DASHBOARD                   │
│                                 │
│  ⚠️ ACTIEVE WERKSESSIE          │
│  ┌─────────────────────────┐   │
│  │ ⏱️ 2u 34m - Bezig        │   │
│  │ Zonnepanelen Smit       │   │
│  │ [⏸️ Pauze] [⏹️ Stop]     │   │
│  └─────────────────────────┘   │
│                                 │
│  📅 VANDAAG - 15 oktober        │
│  ┌─────────────────────────┐   │
│  │ 08:00 - 12:00           │   │
│  │ 🔴 Klant Afspraak       │   │
│  │ Jan Smit                │   │
│  │ Hoofdstraat 123, AMS    │   │
│  │ ✅ Bevestigd            │   │
│  │ [▶️ Start]  [🗺️ Route]  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 13:00 - 17:00           │   │
│  │ 🟢 Monteur Planning     │   │
│  │ Maria de Vries          │   │
│  │ Kerkstraat 45, Utrecht  │   │
│  │ ⏰ Later vandaag        │   │
│  │ [Details]               │   │
│  └─────────────────────────┘   │
│                                 │
│  📊 ACTIEVE PROJECTEN           │
│  ┌─────────────────────────┐   │
│  │ Zonnepanelen Bakker     │   │
│  │ █████████░░  65%        │   │
│  │ Status: Bezig           │   │
│  │ [Verder werken]         │   │
│  └─────────────────────────┘   │
│                                 │
│  ✅ VANDAAG AFGEROND: 0         │
│  ⏰ TOTAAL UREN: 2u 34m         │
│                                 │
│ ────────────────────────────── │
│ [🏠 Home] [📅 Agenda] [📊 Stats]│
└─────────────────────────────────┘
```

---

### **3. PROJECT START FLOW**

#### **3A. PRE-START CHECK**

```
┌─────────────────────────────────┐
│  ← PROJECT STARTEN              │
├─────────────────────────────────┤
│                                 │
│  ZONNEPANELEN SMIT              │
│  Jan Smit - Hoofdstraat 123     │
│                                 │
│  VOORDAT JE BEGINT:             │
│                                 │
│  ☑️ Materiaal check              │
│  ┌─────────────────────────┐   │
│  │ • 10x Zonnepaneel       │   │
│  │ • 1x Omvormer           │   │
│  │ • Montagemateriaal      │   │
│  │ [✓ Alles aanwezig]      │   │
│  └─────────────────────────┘   │
│                                 │
│  ☑️ Veiligheid check            │
│  ┌─────────────────────────┐   │
│  │ • Ladder gecontroleerd  │   │
│  │ • Veiligheidslijnen     │   │
│  │ • Werkplek afgezet      │   │
│  │ [✓ Alles veilig]        │   │
│  └─────────────────────────┘   │
│                                 │
│  📍 GPS LOCATIE                 │
│  ┌─────────────────────────┐   │
│  │ Huidige locatie:        │   │
│  │ Hoofdstraat 123         │   │
│  │ ✅ Op locatie (12m)     │   │
│  │ [📍 Check-in]           │   │
│  └─────────────────────────┘   │
│                                 │
│  ☑️ Ik heb contact gehad met    │
│     de klant en ben klaar       │
│     om te beginnen              │
│                                 │
│  ┌───────────────────────────┐ │
│  │  🚀 PROJECT STARTEN       │ │
│  └───────────────────────────┘ │
│                                 │
│  [Annuleren]                    │
└─────────────────────────────────┘
```

#### **3B. PROJECT STARTED - CONFIRMATION**

```
┌─────────────────────────────────┐
│  ✅ PROJECT GESTART!            │
├─────────────────────────────────┤
│                                 │
│  ⏱️ TIMER ACTIEF                │
│  ┌───────────────────────────┐ │
│  │     00:00:03              │ │
│  │   Gestart om 08:15        │ │
│  └───────────────────────────┘ │
│                                 │
│  📍 Locatie vastgelegd          │
│  🔔 Administrator geïnformeerd  │
│  📊 Status: In Uitvoering       │
│                                 │
│  ZONNEPANELEN SMIT              │
│  Jan Smit                       │
│  Hoofdstraat 123, Amsterdam     │
│                                 │
│  ┌───────────────────────────┐ │
│  │  NAAR PROJECT DETAILS     │ │
│  └───────────────────────────┘ │
│                                 │
│  [Terug naar Dashboard]         │
└─────────────────────────────────┘
```

---

### **4. PROJECT DETAIL VIEW - TIJDENS WERK**

```
┌─────────────────────────────────┐
│  ← ZONNEPANELEN SMIT     [⋮]    │
├─────────────────────────────────┤
│  ⏱️ 02:34:12  [⏸️]  [⏹️]        │
│  Gestart: 08:15                 │
│  Pauze: 0m                      │
├─────────────────────────────────┤
│                                 │
│  TABS:                          │
│  [✅ Taken] [📸 Foto's]         │
│  [📦 Materiaal] [📝 Notities]   │
│                                 │
│ ─── TAKEN TAB ────────────────  │
│                                 │
│  Voortgang: 65%                 │
│  █████████░░                    │
│                                 │
│  BLOK 1: VOORBEREIDINGEN        │
│  ✓ Werkplek inrichten           │
│  ✓ Materiaal uitpakken          │
│  ✓ Veiligheid checken           │
│                                 │
│  BLOK 2: MONTAGE                │
│  ✓ Montagerails bevestigen      │
│  ✓ Panelen plaatsen (8/10)      │
│  ☐ Panelen plaatsen (2/10)      │
│  ☐ Bedrading aansluiten         │
│                                 │
│  BLOK 3: AANSLUITING            │
│  ☐ Omvormer installeren         │
│  ☐ Bekabeling naar meterkast    │
│  ☐ Systeem testen               │
│                                 │
│  BLOK 4: AFWERKING              │
│  ☐ Opruimen                     │
│  ☐ Klant instructie geven       │
│  ☐ Papierwerk afronden          │
│                                 │
│  ┌───────────────────────────┐ │
│  │  📸 FOTO MAKEN            │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  ⏸️ PAUZE NEMEN           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  ✅ PROJECT AFRONDEN      │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

### **5. FOTO'S TAB**

```
┌─────────────────────────────────┐
│  ← ZONNEPANELEN SMIT            │
│  ⏱️ 02:34:12                    │
├─────────────────────────────────┤
│                                 │
│  [✅ Taken] [📸 Foto's] ✓       │
│  [📦 Materiaal] [📝 Notities]   │
│                                 │
│ ─── FOTO'S ───────────────────  │
│                                 │
│  ┌───────────────────────────┐ │
│  │  📷 NIEUWE FOTO           │ │
│  │  [Camera] [Galerij]       │ │
│  └───────────────────────────┘ │
│                                 │
│  VOOR (2 foto's)                │
│  ┌────────┐ ┌────────┐         │
│  │ [IMG1] │ │ [IMG2] │         │
│  │ 08:20  │ │ 08:22  │         │
│  └────────┘ └────────┘         │
│                                 │
│  TIJDENS (5 foto's)             │
│  ┌────────┐ ┌────────┐         │
│  │ [IMG3] │ │ [IMG4] │         │
│  │ 09:15  │ │ 10:30  │         │
│  └────────┘ └────────┘         │
│  ┌────────┐ ┌────────┐         │
│  │ [IMG5] │ │ [IMG6] │         │
│  │ 11:20  │ │ 11:45  │         │
│  └────────┘ └────────┘         │
│  ┌────────┐                    │
│  │ [IMG7] │                    │
│  │ 12:10  │                    │
│  └────────┘                    │
│                                 │
│  NA (Nog geen foto's)           │
│  ┌───────────────────────────┐ │
│  │  ⚠️ Minimaal 1 foto       │ │
│  │     nodig voor oplevering │ │
│  └───────────────────────────┘ │
│                                 │
│  DETAIL (1 foto)                │
│  ┌────────┐                    │
│  │ [IMG8] │                    │
│  │ 10:05  │                    │
│  └────────┘                    │
│                                 │
└─────────────────────────────────┘

FOTO MAKEN DIALOG:
┌─────────────────────────────────┐
│  NIEUWE FOTO                    │
├─────────────────────────────────┤
│                                 │
│  [📷════════════════]           │
│  │                 │            │
│  │   CAMERA VIEW   │            │
│  │                 │            │
│  [══════════════════]           │
│                                 │
│  Categorie:                     │
│  ● Voor  ○ Tijdens  ○ Na        │
│  ○ Detail  ○ Overzicht          │
│                                 │
│  ┌───────────────────────────┐ │
│  │  📸 FOTO MAKEN            │ │
│  └───────────────────────────┘ │
│                                 │
│  [Annuleren]                    │
└─────────────────────────────────┘
```

---

### **6. MATERIAAL TAB**

```
┌─────────────────────────────────┐
│  ← ZONNEPANELEN SMIT            │
│  ⏱️ 02:34:12                    │
├─────────────────────────────────┤
│                                 │
│  [✅ Taken] [📸 Foto's]         │
│  [📦 Materiaal] ✓ [📝 Notities] │
│                                 │
│ ─── MATERIAAL ────────────────  │
│                                 │
│  ┌───────────────────────────┐ │
│  │  📱 SCAN QR CODE          │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  ➕ HANDMATIG TOEVOEGEN   │ │
│  └───────────────────────────┘ │
│                                 │
│  GEBRUIKT MATERIAAL:            │
│                                 │
│  🔆 Zonnepanelen                │
│  ┌─────────────────────────┐   │
│  │ Zonnepaneel 400W        │   │
│  │ 10x @ €285,00           │   │
│  │ Totaal: €2.850,00       │   │
│  │ [✏️] [🗑️]               │   │
│  └─────────────────────────┘   │
│                                 │
│  ⚡ Bedrading                   │
│  ┌─────────────────────────┐   │
│  │ MC4 Kabel 6mm² Rood     │   │
│  │ 50m @ €2,50/m           │   │
│  │ Totaal: €125,00         │   │
│  │ [✏️] [🗑️]               │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ MC4 Kabel 6mm² Zwart    │   │
│  │ 50m @ €2,50/m           │   │
│  │ Totaal: €125,00         │   │
│  │ [✏️] [🗑️]               │   │
│  └─────────────────────────┘   │
│                                 │
│  🔧 Montage                     │
│  ┌─────────────────────────┐   │
│  │ Montagerail 4m          │   │
│  │ 8x @ €45,00             │   │
│  │ Totaal: €360,00         │   │
│  │ [✏️] [🗑️]               │   │
│  └─────────────────────────┘   │
│                                 │
│  ───────────────────────────    │
│  TOTAAL MATERIAAL: €3.460,00    │
│                                 │
└─────────────────────────────────┘

QR SCAN DIALOG:
┌─────────────────────────────────┐
│  QR CODE SCANNER                │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │  ╔═══════════════════╗   │ │
│  │  ║                   ║   │ │
│  │  ║    [QR CODE]      ║   │ │
│  │  ║                   ║   │ │
│  │  ╚═══════════════════╝   │ │
│  │                           │ │
│  │  Richt camera op QR code │ │
│  └───────────────────────────┘ │
│                                 │
│  [❌ Annuleren]                 │
└─────────────────────────────────┘

GEVONDEN MATERIAAL:
┌─────────────────────────────────┐
│  MATERIAAL GEVONDEN!            │
├─────────────────────────────────┤
│                                 │
│  ✅ Zonnepaneel 400W            │
│  SKU: SUN-400-2024              │
│                                 │
│  Prijs: €285,00 per stuk        │
│  Op voorraad: 45                │
│                                 │
│  Aantal:                        │
│  ┌───────────────────────────┐ │
│  │  [-]  [  10  ]  [+]       │ │
│  └───────────────────────────┘ │
│                                 │
│  Totaal: €2.850,00              │
│                                 │
│  Notities: (optioneel)          │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  ✅ TOEVOEGEN             │ │
│  └───────────────────────────┘ │
│                                 │
│  [Annuleren]                    │
└─────────────────────────────────┘
```

---

### **7. PROJECT AFRONDEN - WIZARD (7 STAPPEN)**

#### **STAP 1: WERK SAMENVATTING**

```
┌─────────────────────────────────┐
│  PROJECT AFRONDEN  (1/7)        │
├─────────────────────────────────┤
│                                 │
│  📝 WERK SAMENVATTING           │
│                                 │
│  Wat is uitgevoerd? *           │
│  ┌───────────────────────────┐ │
│  │ Installatie van 10        │ │
│  │ zonnepanelen incl.        │ │
│  │ omvormer en bekabeling.   │ │
│  │ Systeem getest en in      │ │
│  │ gebruik genomen.          │ │
│  └───────────────────────────┘ │
│                                 │
│  Afwijkingen/problemen?         │
│  ┌───────────────────────────┐ │
│  │ Oude bekabeling vervangen │ │
│  │ i.v.m. slijtage           │ │
│  └───────────────────────────┘ │
│                                 │
│  Aanbevelingen:                 │
│  ┌───────────────────────────┐ │
│  │ Systeem jaarlijks laten   │ │
│  │ inspecteren               │ │
│  └───────────────────────────┘ │
│                                 │
│  Weersomstandigheden:           │
│  ○ Zonnig  ● Bewolkt            │
│  ○ Regen   ○ Wind               │
│                                 │
│  Kwaliteit check:               │
│  ⭐⭐⭐⭐⭐ (Mijn beoordeling)   │
│                                 │
│         [Annuleren]  [Volgende→]│
└─────────────────────────────────┘
```

#### **STAP 2: FOTO'S CONTROLE**

```
┌─────────────────────────────────┐
│  PROJECT AFRONDEN  (2/7)        │
├─────────────────────────────────┤
│                                 │
│  📸 FOTO'S CONTROLE             │
│                                 │
│  Controleer of alle foto's      │
│  compleet zijn:                 │
│                                 │
│  ✅ VOOR (2 foto's)             │
│  ┌────────┐ ┌────────┐         │
│  │ [IMG1] │ │ [IMG2] │         │
│  └────────┘ └────────┘         │
│                                 │
│  ✅ TIJDENS (5 foto's)          │
│  ┌────────┐ ┌────────┐         │
│  │ [IMG3] │ │ [IMG4] │ ...     │
│  └────────┘ └────────┘         │
│                                 │
│  ✅ NA (3 foto's)               │
│  ┌────────┐ ┌────────┐         │
│  │ [IMG9] │ │ [IMG10]│ ...     │
│  └────────┘ └────────┘         │
│                                 │
│  ✅ DETAIL (2 foto's)           │
│  ┌────────┐ ┌────────┐         │
│  │ [IMG12]│ │ [IMG13]│         │
│  └────────┘ └────────┘         │
│                                 │
│  ┌───────────────────────────┐ │
│  │  📷 MEER FOTO'S TOEVOEGEN │ │
│  └───────────────────────────┘ │
│                                 │
│  Totaal: 12 foto's              │
│                                 │
│        [←Terug]  [Volgende→]    │
└─────────────────────────────────┘
```

#### **STAP 3: MATERIAAL BEVESTIGING**

```
┌─────────────────────────────────┐
│  PROJECT AFRONDEN  (3/7)        │
├─────────────────────────────────┤
│                                 │
│  📦 MATERIAALGEBRUIK            │
│                                 │
│  Controleer en bevestig:        │
│                                 │
│  🔆 Zonnepanelen                │
│  ┌─────────────────────────┐   │
│  │ Zonnepaneel 400W        │   │
│  │ 10x @ €285,00           │   │
│  │ Totaal: €2.850,00       │   │
│  │ [✏️ Wijzig]             │   │
│  └─────────────────────────┘   │
│                                 │
│  ⚡ Bedrading                   │
│  ┌─────────────────────────┐   │
│  │ MC4 Kabel (rood + zwart)│   │
│  │ 100m @ €2,50/m          │   │
│  │ Totaal: €250,00         │   │
│  │ [✏️ Wijzig]             │   │
│  └─────────────────────────┘   │
│                                 │
│  🔧 Montage                     │
│  ┌─────────────────────────┐   │
│  │ Montagerail + bevestiging│   │
│  │ Totaal: €360,00         │   │
│  │ [✏️ Wijzig]             │   │
│  └─────────────────────────┘   │
│                                 │
│  ───────────────────────────    │
│  TOTAAL: €3.460,00              │
│                                 │
│  Extra kosten (optioneel):      │
│  ┌─────────────────────────┐   │
│  │ Oude bekabeling vervangen│   │
│  │ €150,00                 │   │
│  └─────────────────────────┘   │
│                                 │
│  EINDTOTAAL: €3.610,00          │
│                                 │
│        [←Terug]  [Volgende→]    │
└─────────────────────────────────┘
```

#### **STAP 4: TIJDSREGISTRATIE**

```
┌─────────────────────────────────┐
│  PROJECT AFRONDEN  (4/7)        │
├─────────────────────────────────┤
│                                 │
│  ⏱️ TIJDSREGISTRATIE            │
│                                 │
│  Automatisch geregistreerd:     │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Gestart:  08:15          │ │
│  │  Gestopt:  16:45          │ │
│  │  ───────────────────────  │ │
│  │  Totaal:   8u 30m         │ │
│  └───────────────────────────┘ │
│                                 │
│  Pauzes:                        │
│  ┌───────────────────────────┐ │
│  │  Lunch:    12:00 - 12:30  │ │
│  │            (30 min)       │ │
│  │  Koffie:   10:00 - 10:15  │ │
│  │            (15 min)       │ │
│  │  ───────────────────────  │ │
│  │  Totaal:   45 min         │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  NETTO WERKTIJD           │ │
│  │     7u 45m                │ │
│  └───────────────────────────┘ │
│                                 │
│  ☑️ Tijd klopt                  │
│                                 │
│  Tijd handmatig aanpassen?      │
│  ┌────┐  ┌────┐                │
│  │ 7  │u │ 45 │m               │
│  └────┘  └────┘                │
│                                 │
│  Reden aanpassing (optioneel):  │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│        [←Terug]  [Volgende→]    │
└─────────────────────────────────┘
```

#### **STAP 5: KLANTTEVREDENHEID**

```
┌─────────────────────────────────┐
│  PROJECT AFRONDEN  (5/7)        │
├─────────────────────────────────┤
│                                 │
│  😊 KLANTTEVREDENHEID           │
│                                 │
│  Hoe tevreden is de klant?      │
│                                 │
│  ┌───────────────────────────┐ │
│  │   ⭐ ⭐ ⭐ ⭐ ⭐           │ │
│  │                           │ │
│  │   Zeer tevreden           │ │
│  └───────────────────────────┘ │
│                                 │
│  Opties:                        │
│  ⭐⭐⭐⭐⭐ Zeer tevreden         │
│  ⭐⭐⭐⭐   Tevreden             │
│  ⭐⭐⭐     Neutraal             │
│  ⭐⭐       Ontevreden           │
│  ⭐         Zeer ontevreden     │
│                                 │
│  Feedback van klant:            │
│  ┌───────────────────────────┐ │
│  │ "Heel blij met het        │ │
│  │  resultaat! Professioneel │ │
│  │  werk en netjes           │ │
│  │  opgeleverd."             │ │
│  └───────────────────────────┘ │
│                                 │
│  Klachten/opmerkingen:          │
│  ┌───────────────────────────┐ │
│  │ Geen                      │ │
│  └───────────────────────────┘ │
│                                 │
│  Follow-up nodig?               │
│  ○ Ja    ● Nee                  │
│                                 │
│  Klant wil offerte voor:        │
│  ☑️ Uitbreiding (5 extra panelen)│
│                                 │
│        [←Terug]  [Volgende→]    │
└─────────────────────────────────┘
```

#### **STAP 6: HANDTEKENINGEN**

```
┌─────────────────────────────────┐
│  PROJECT AFRONDEN  (6/7)        │
├─────────────────────────────────┤
│                                 │
│  ✍️ KLANT HANDTEKENING          │
│                                 │
│  Geef telefoon aan klant        │
│  voor handtekening:             │
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │  [TEKEN GEBIED]           │ │
│  │                           │ │
│  │                           │ │
│  │                           │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  [🗑️ Wissen]  [✓ Akkoord]      │
│                                 │
│  Naam klant:                    │
│  ┌───────────────────────────┐ │
│  │ Jan Smit                  │ │
│  └───────────────────────────┘ │
│                                 │
│  ───────────────────────────    │
│                                 │
│  ✍️ MONTEUR HANDTEKENING        │
│                                 │
│  Uw handtekening:               │
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │  [TEKEN GEBIED]           │ │
│  │                           │ │
│  │                           │ │
│  │                           │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  [🗑️ Wissen]  [✓ Akkoord]      │
│                                 │
│        [←Terug]  [Volgende→]    │
└─────────────────────────────────┘
```

#### **STAP 7: REVIEW & VERZENDEN**

```
┌─────────────────────────────────┐
│  PROJECT AFRONDEN  (7/7)        │
├─────────────────────────────────┤
│                                 │
│  📋 WERKBON OVERZICHT           │
│                                 │
│  ✅ Werk samenvatting           │
│  ✅ 12 foto's                   │
│  ✅ Materiaalgebruik (€3.610)   │
│  ✅ Tijdsregistratie (7u 45m)   │
│  ✅ Klanttevredenheid (⭐⭐⭐⭐⭐)│
│  ✅ Handtekeningen               │
│                                 │
│  📄 PDF WERKBON                 │
│  ┌───────────────────────────┐ │
│  │  WERKBON #2025-001        │ │
│  │  Zonnepanelen Smit        │ │
│  │  15 oktober 2025          │ │
│  │  [👁️ Preview]             │ │
│  └───────────────────────────┘ │
│                                 │
│  📧 VERZENDEN                   │
│  ☑️ Email naar klant            │
│     (jan@email.nl)              │
│  ☑️ CC naar kantoor             │
│     (info@smans.nl)             │
│  ☑️ Upload naar systeem         │
│                                 │
│  💰 FINANCIEEL                  │
│  Materiaal:  €3.610,00          │
│  Arbeid:     €620,00 (8u x €80) │
│  ──────────────────             │
│  Totaal:     €4.230,00          │
│                                 │
│  ┌───────────────────────────┐ │
│  │  🚀 PROJECT AFRONDEN      │ │
│  │     & WERKBON VERZENDEN   │ │
│  └───────────────────────────┘ │
│                                 │
│  [←Terug]  [💾 Concept opslaan] │
└─────────────────────────────────┘

SUCCESS SCREEN:
┌─────────────────────────────────┐
│  ✅ PROJECT AFGEROND!           │
├─────────────────────────────────┤
│                                 │
│  ZONNEPANELEN SMIT              │
│                                 │
│  ✓ Werkbon gegenereerd          │
│  ✓ Email verstuurd naar klant   │
│  ✓ Project status: Afgerond     │
│  ✓ Timer gestopt                │
│  ✓ GPS check-out                │
│                                 │
│  📊 SAMENVATTING:               │
│  Werktijd:  7u 45m              │
│  Materiaal: €3.610,00           │
│  Totaal:    €4.230,00           │
│  Rating:    ⭐⭐⭐⭐⭐            │
│                                 │
│  🎉 Goed werk!                  │
│                                 │
│  ┌───────────────────────────┐ │
│  │  TERUG NAAR DASHBOARD     │ │
│  └───────────────────────────┘ │
│                                 │
│  [📄 Werkbon bekijken]          │
└─────────────────────────────────┘
```

---

## 🎨 DESIGN SYSTEM

### **KLEUREN PALETTE**

```
PRIMARY COLORS:
- Brand Blue:     #3B82F6  (Buttons, Links)
- Brand Dark:     #1E40AF  (Headers, Important)
- Brand Light:    #DBEAFE  (Backgrounds)

SECONDARY COLORS:
- Success Green:  #10B981  (Completed, Success)
- Warning Orange: #F59E0B  (Warnings, Pending)
- Error Red:      #EF4444  (Errors, Critical)
- Info Blue:      #3B82F6  (Info messages)

STATUS COLORS:
- Klant Afspraak: #EF4444  (Red)
- Monteur Planning: #10B981 (Green)
- Team Project:   #3B82F6  (Blue)
- Intern:         #F59E0B  (Orange)

TEXT COLORS:
- Primary Text:   #1F2937  (Gray-800)
- Secondary Text: #6B7280  (Gray-500)
- Muted Text:     #9CA3AF  (Gray-400)
- White Text:     #FFFFFF

BACKGROUNDS:
- White:          #FFFFFF
- Light Gray:     #F9FAFB  (Gray-50)
- Medium Gray:    #F3F4F6  (Gray-100)
- Dark:           #111827  (Gray-900)
```

### **TYPOGRAPHY**

```
FONT FAMILY:
- Primary: Inter, system-ui, sans-serif
- Monospace: 'Courier New', monospace (for codes)

SIZES:
- H1 (Page Title):    32px / 2rem / font-bold
- H2 (Section):       24px / 1.5rem / font-semibold
- H3 (Subsection):    20px / 1.25rem / font-semibold
- Body (Normal):      16px / 1rem / font-normal
- Small (Caption):    14px / 0.875rem / font-normal
- Tiny (Meta):        12px / 0.75rem / font-normal

LINE HEIGHT:
- Tight:    1.25
- Normal:   1.5
- Relaxed:  1.75
```

### **SPACING**

```
SCALE (Tailwind default):
- 0:   0px
- 1:   4px
- 2:   8px
- 3:   12px
- 4:   16px
- 5:   20px
- 6:   24px
- 8:   32px
- 10:  40px
- 12:  48px
- 16:  64px

COMMON USAGE:
- Component padding:    p-4 (16px)
- Section spacing:      mb-6 (24px)
- Page margins:         mx-8 (32px)
- Card padding:         p-6 (24px)
```

### **COMPONENTS**

#### **BUTTON STYLES**

```css
.btn-primary {
  background: #3B82F6;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.btn-secondary {
  background: white;
  color: #3B82F6;
  border: 2px solid #3B82F6;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}

.btn-success {
  background: #10B981;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}

.btn-danger {
  background: #EF4444;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}

.btn-lg {
  padding: 16px 32px;
  font-size: 18px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
}
```

#### **CARD STYLES**

```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #E5E7EB;
}

.card-hover {
  transition: all 0.2s;
}

.card-hover:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

#### **INPUT STYLES**

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-error {
  border-color: #EF4444;
}

.input-success {
  border-color: #10B981;
}
```

---

## 🔄 USER FLOWS

### **FLOW 1: Administrator Plant Klant Afspraak**

```
START
  ↓
[Login als Administrator]
  ↓
[Open Planning Kalender]
  ↓
[Klik op datum] → [Klik "+ Planning Toevoegen"]
  ↓
[Selecteer "Klant Afspraak"]
  ↓
[Zoek en selecteer Klant]
  ├─ Bestaande klant: Selecteer uit lijst
  └─ Nieuwe klant: [+ Nieuwe Klant]
      ↓
      [Vul klantgegevens in]
      ↓
      [Opslaan klant]
  ↓
[Koppel aan Project]
  ├─ Bestaand project: Selecteer uit lijst
  └─ Nieuw project: Vul titel + beschrijving
  ↓
[Vul Datum, Tijd, Duur in]
  ↓
[Selecteer Locatie] (auto-filled van klant adres)
  ↓
[Selecteer Monteur(s)]
  ├─ Check beschikbaarheid
  ├─ Bekijk rating & ervaring
  └─ Optioneel: Voeg tweede monteur toe
  ↓
[Stel Notificaties in]
  ├─ ☑ Email naar klant
  ├─ ☑ SMS naar klant
  ├─ ☑ iCal bijlage
  └─ ☑ Push naar monteur
  ↓
[Preview notificaties]
  ↓
[Bevestig en Verstuur]
  ↓
SUCCES: "Afspraak Gepland!"
  ├─ Email verstuurd naar klant
  ├─ SMS verstuurd
  ├─ Push notificatie naar monteur
  └─ Planning zichtbaar in kalender
  ↓
END
```

### **FLOW 2: Monteur Voert Project Uit (Complete Cycle)**

```
START
  ↓
[Login op Mobiele App]
  ↓
[Dashboard: Zie Vandaag Planning]
  ├─ Afspraak 1: 08:00 - 12:00 (Klant Afspraak)
  └─ Afspraak 2: 13:00 - 17:00 (Monteur Planning)
  ↓
[Selecteer eerste afspraak]
  ↓
[Bekijk Project Details]
  ├─ Klant info
  ├─ Adres
  ├─ Taken overzicht
  └─ Materiaal lijst
  ↓
[Klik "🗺️ Route"] → Google Maps / Apple Maps
  ↓
[Reis naar locatie]
  ↓
[Aankomst op locatie]
  ↓
[Klik "▶️ Start Project"]
  ↓
[Pre-Start Checklist]
  ├─ ☑ Materiaal check
  ├─ ☑ Veiligheid check
  └─ ☑ GPS Check-in
  ↓
[Bevestig: "🚀 Project Starten"]
  ↓
GESTART:
  ├─ ⏱️ Timer start automatisch
  ├─ 📍 GPS locatie vastgelegd
  ├─ 📊 Project status → "In Uitvoering"
  └─ 🔔 Notificatie naar administrator
  ↓
TIJDENS WERK:
│
├─ [Taken Tab]
│   ├─ Vink taken af
│   └─ Zie voortgang (%)
│
├─ [Foto's Tab]
│   ├─ Maak "Voor" foto's
│   ├─ Maak "Tijdens" foto's
│   └─ Categoriseer foto's
│
├─ [Materiaal Tab]
│   ├─ Scan QR codes
│   ├─ Voeg materiaal handmatig toe
│   └─ Zie totaal kosten
│
├─ [Notities Tab]
│   └─ Voeg werknotities toe
│
└─ [⏸️ Pauze nemen indien nodig]
     ↓
     [⏯️ Pauze hervatten]
  ↓
[Alle taken afgerond]
  ↓
[Klik "✅ Project Afronden"]
  ↓
AFRONDEN WIZARD (7 Stappen):
│
├─ STAP 1: Werk Samenvatting
│   ├─ Wat is uitgevoerd?
│   ├─ Afwijkingen?
│   ├─ Aanbevelingen
│   └─ Weersomstandigheden
│
├─ STAP 2: Foto's Controle
│   ├─ Check "Voor" foto's
│   ├─ Check "Tijdens" foto's
│   ├─ Check "Na" foto's (minimaal 1!)
│   └─ Optioneel: Voeg meer toe
│
├─ STAP 3: Materiaalgebruik
│   ├─ Controleer lijst
│   ├─ Wijzig hoeveelheden
│   ├─ Voeg extra kosten toe
│   └─ Zie totaal
│
├─ STAP 4: Tijdsregistratie
│   ├─ Auto-geregistreerde tijd
│   ├─ Pauzes overzicht
│   ├─ Netto werktijd
│   └─ Optioneel: Handmatig aanpassen
│
├─ STAP 5: Klanttevredenheid
│   ├─ Rating (1-5 sterren)
│   ├─ Feedback klant
│   ├─ Klachten/opmerkingen
│   └─ Follow-up nodig?
│
├─ STAP 6: Handtekeningen
│   ├─ Klant tekent
│   ├─ Naam klant bevestigen
│   ├─ Monteur tekent
│   └─ Beide akkoord
│
└─ STAP 7: Review & Verzenden
     ├─ Overzicht alles
     ├─ Preview werkbon PDF
     ├─ Email opties
     └─ [🚀 Verzenden]
  ↓
AFGEROND:
  ├─ ✓ Werkbon gegenereerd (PDF)
  ├─ ✓ Email verstuurd naar klant
  ├─ ✓ Email CC naar kantoor
  ├─ ✓ Project status → "Afgerond"
  ├─ ⏰ Timer gestopt
  ├─ 📍 GPS check-out
  └─ 🔔 Notificatie naar administrator
  ↓
[Terug naar Dashboard]
  ↓
[Zie volgende afspraak of statistieken]
  ↓
END
```

---

## 🧩 COMPONENT LIBRARY

### **1. PLANNING CARD** (Voor kalender view)

```typescript
interface PlanningCardProps {
  type: 'klant_afspraak' | 'monteur' | 'team' | 'intern';
  title: string;
  time: string;
  location?: string;
  customerName?: string;
  confirmed: boolean;
  onClick: () => void;
}

<PlanningCard
  type="klant_afspraak"
  title="Zonnepanelen installatie"
  time="08:00 - 12:00"
  location="Hoofdstraat 123, Amsterdam"
  customerName="Jan Smit"
  confirmed={true}
  onClick={() => openDetails()}
/>
```

### **2. MONTEUR AVAILABILITY INDICATOR**

```typescript
interface MonteurAvailabilityProps {
  monteur: User;
  date: Date;
  existingBookings: number;
  rating: number;
}

<MonteurAvailability
  monteur={janSmit}
  date={new Date('2025-10-15')}
  existingBookings={2}
  rating={4.8}
/>
```

### **3. TIMER COMPONENT** (Voor mobiele app)

```typescript
interface TimerProps {
  startTime: Date;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

<Timer
  startTime={new Date('2025-10-15T08:15:00')}
  isPaused={false}
  onPause={() => pauseWork()}
  onResume={() => resumeWork()}
  onStop={() => stopWork()}
/>
```

### **4. TASK CHECKLIST**

```typescript
interface TaskChecklistProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  showProgress: boolean;
}

<TaskChecklist
  tasks={projectTasks}
  onToggle={(id, completed) => updateTask(id, completed)}
  showProgress={true}
/>
```

### **5. PHOTO GRID**

```typescript
interface PhotoGridProps {
  photos: Photo[];
  onCapture: () => void;
  onCategorize: (photoId: string, category: string) => void;
  requiredCategories: string[];
}

<PhotoGrid
  photos={projectPhotos}
  onCapture={() => openCamera()}
  onCategorize={(id, cat) => updateCategory(id, cat)}
  requiredCategories={['voor', 'na']}
/>
```

### **6. MATERIAL SCANNER**

```typescript
interface MaterialScannerProps {
  onScan: (qrCode: string) => void;
  onManualAdd: () => void;
  materials: Material[];
}

<MaterialScanner
  onScan={(code) => lookupMaterial(code)}
  onManualAdd={() => openManualDialog()}
  materials={usedMaterials}
/>
```

### **7. SIGNATURE PAD**

```typescript
interface SignaturePadProps {
  label: string;
  onSave: (signature: string) => void;
  onClear: () => void;
  required: boolean;
}

<SignaturePad
  label="Klant Handtekening"
  onSave={(sig) => saveSignature(sig)}
  onClear={() => clearPad()}
  required={true}
/>
```

---

## 📐 RESPONSIVE DESIGN

### **BREAKPOINTS**

```css
/* Mobile First Approach */
@media (min-width: 640px) {  /* sm: Small tablets */}
@media (min-width: 768px) {  /* md: Tablets */}
@media (min-width: 1024px) { /* lg: Laptops */}
@media (min-width: 1280px) { /* xl: Desktops */}
@media (min-width: 1536px) { /* 2xl: Large desktops */}
```

### **MOBILE (< 640px)**
- Single column layout
- Full-width buttons
- Collapsible sidebars
- Bottom navigation
- Touch-friendly tap targets (min 44x44px)

### **TABLET (640px - 1024px)**
- 2-column layout waar mogelijk
- Sidebar visible
- Hover states enabled
- Larger content areas

### **DESKTOP (> 1024px)**
- Multi-column layouts
- Fixed sidebars
- Rich hover interactions
- Keyboard shortcuts enabled
- Multiple panels side-by-side

---

**EINDE VAN UI/UX MOCKUPS DOCUMENT**

*Versie: 1.0*
*Datum: 8 oktober 2025*
*Status: Complete Design System*

