# Monteur Requirements - User Stories & Workflows

## Primaire Monteur Persona
**Jan de Installateur**
- 35 jaar, 10+ jaar ervaring
- Gebruikt dagelijks smartphone voor werk
- Werkt vaak op locaties met slechte internetverbinding
- Waardeert efficiëntie en eenvoud
- Heeft geen tijd voor complexe systemen

## Core User Stories

### 1. Project Planning & Overzicht
```
Als monteur wil ik mijn dagplanning zien,
zodat ik weet welke projecten ik moet uitvoeren.

Acceptatie Criteria:
- Zie lijst van projecten voor vandaag/deze week
- Zie projectdetails: adres, klant, geschatte tijd
- Zie driving directions naar locatie
- Kan project status zien (te starten, bezig, afgerond)
- Krijg push notifications voor nieuwe/gewijzigde projecten
```

### 2. Project Start
```
Als monteur wil ik een project kunnen starten,
zodat ik tijd kan registreren en taken kan beginnen.

Acceptatie Criteria:
- Eén tap om project te starten
- Automatische tijdregistratie start
- GPS locatie wordt vastgelegd
- Project status wijzigt naar 'in uitvoering'
- Taken worden zichtbaar
```

### 3. Taken Management
```
Als monteur wil ik taken kunnen afvinken,
zodat ik overzicht houd van de voortgang.

Acceptatie Criteria:
- Zie alle taken van het project
- Kan taken afvinken als voltooid
- Zie voortgang percentage
- Taken zijn gegroepeerd per blok/categorie
- Info-teksten zijn zichtbaar voor context
```

### 4. Tijd Registratie
```
Als monteur wil ik automatisch tijd registreren,
zodat ik geen tijd vergeet bij te houden.

Acceptatie Criteria:
- Automatische start bij project begin
- Handmatig pauzes toevoegen
- Automatische stop bij project einde
- Kan achteraf tijd aanpassen
- Zie totaal gewerkte tijd per dag/week
```

### 5. Materialen Bijhouden
```
Als monteur wil ik gebruikte materialen registreren,
zodat het kantoor weet wat er gebruikt is.

Acceptatie Criteria:
- Kan materiaal toevoegen met naam en aantal
- Kan leverancier en prijs invullen
- Kan foto van bon/factuur maken
- Automatische berekening totale kosten
- Sync naar centrale database
```

### 6. Foto Documentatie
```
Als monteur wil ik foto's maken van mijn werk,
zodat het resultaat gedocumenteerd is.

Acceptatie Criteria:
- Foto's maken tijdens project
- Foto's categoriseren (voor/tijdens/na)
- Automatische metadata (tijd, locatie, project)
- Compression voor data gebruik
- Offline opslag met sync
```

### 7. Bonnetjes Scannen
```
Als monteur wil ik bonnetjes kunnen scannen,
zodat alle kosten gedocumenteerd zijn.

Acceptatie Criteria:
- Camera scan met auto-crop
- OCR text recognition (basic)
- Categoriseren van bonnetjes
- Link aan specifiek project
- Backup naar cloud storage
```

### 8. Chat Communicatie
```
Als monteur wil ik kunnen chatten met kantoor,
zodat ik vragen kan stellen en updates kan geven.

Acceptatie Criteria:
- Direct chat met administratie
- Project-specifieke chats
- Foto's delen in chat
- Push notifications voor berichten
- Offline berichten worden verzonden bij sync
```

### 9. Project Oplevering
```
Als monteur wil ik een project kunnen opleveren,
zodat de klant kan tekenen en het project afgerond is.

Acceptatie Criteria:
- Overzicht van voltooide taken
- Overzicht van gebruikte materialen
- Foto's van eindresultaat
- Digitale handtekening klant
- Digitale handtekening monteur
- Automatische PDF generatie
```

## Detailed Workflows

### Workflow 1: Dagstart Monteur
1. **App openen** (biometric login)
2. **Dashboard zien** met projecten van vandaag
3. **Eerste project selecteren**
4. **Navigeren naar locatie** (GPS integration)
5. **Project starten** (één tap)
6. **Taken bekijken** en beginnen

### Workflow 2: Project Uitvoering
1. **Taken afvinken** tijdens werk
2. **Foto's maken** van voortgang
3. **Materialen bijhouden** real-time
4. **Bonnetjes scannen** direct
5. **Chat met kantoor** bij vragen
6. **Pauzes registreren** handmatig

### Workflow 3: Project Oplevering
1. **Alle taken controleren** (100% voltooid)
2. **Foto's van eindresultaat** maken
3. **Materialen samenvatten**
4. **Klant handtekening** verzamelen
5. **Eigen handtekening** plaatsen
6. **Project afronden** (auto-sync)

## User Interface Requirements

### Dashboard Requirements
- **Clean, minimalistic design**
- **Grote touch targets** (minimum 44px)
- **High contrast** voor leesbaarheid buiten
- **Status indicators** (offline/online, sync status)
- **Search & filter** functionaliteit

### Navigation Requirements
- **Tab-based navigation** (iOS) / **Drawer navigation** (Android)
- **Floating action button** voor snelle acties
- **Breadcrumb navigation** voor diepere levels
- **Swipe gestures** voor efficiëntie

### Form Requirements
- **Auto-complete** waar mogelijk
- **Input validation** met duidelijke feedback
- **Auto-save** functionaliteit
- **Voice input** voor tekst velden
- **Barcode scanning** voor materialen

## Performance Requirements
- **App start**: < 3 seconden
- **Screen transitions**: < 500ms
- **Photo capture**: < 2 seconden to save
- **Sync operations**: Background, non-blocking
- **Offline mode**: 100% core functionality

## Accessibility Requirements
- **VoiceOver/TalkBack** support
- **High contrast mode** support
- **Large text** support
- **One-handed operation** friendly
- **Landscape orientation** support

## Error Handling Requirements
- **Network errors**: Graceful degradation
- **Camera errors**: Alternative input methods
- **Sync conflicts**: User-friendly resolution
- **App crashes**: Auto-recovery and data preservation
- **Form errors**: Inline validation with clear messages