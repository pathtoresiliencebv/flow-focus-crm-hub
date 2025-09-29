# Enhanced Project Delivery Workflow

## Overzicht
Uitgebreide project oplevering met materialen, bonnetjes, foto's en handtekeningen voor complete documentatie.

## Nieuwe Functionaliteiten

### Materialen Registratie
- **Component**: `MobileMaterialsReceipts.tsx`
- **Database**: `project_materials` tabel
- **Velden**: Naam, aantal, eenheidsprijs, leverancier, foto

### Bonnetjes Management
- **Database**: `project_receipts` tabel
- **Velden**: Datum, leverancier, bedrag, beschrijving, foto
- **Categories**: Material, tools, other

### Project Oplevering Stappen
1. **Taken Overzicht**: Welke taken zijn voltooid
2. **Foto's Oplevering**: Eindresultaat documentatie
3. **Materialen**: Gebruikte materialen registreren
4. **Bonnetjes**: Upload van aankoop bewijzen
5. **Klant Handtekening**: Digitale goedkeuring
6. **Monteur Handtekening**: Bevestiging installateur

## Database Schema

### project_materials
```sql
CREATE TABLE project_materials (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  material_name TEXT NOT NULL,
  quantity NUMERIC,
  unit_price NUMERIC,
  total_cost NUMERIC,
  supplier TEXT,
  receipt_photo_url TEXT,
  added_by UUID NOT NULL
);
```

### project_receipts
```sql
CREATE TABLE project_receipts (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  receipt_date DATE,
  supplier TEXT,
  total_amount NUMERIC,
  description TEXT,
  receipt_photo_url TEXT NOT NULL,
  category TEXT DEFAULT 'material',
  added_by UUID NOT NULL
);
```

## Mobile Interface

### Tabs Layout
- **Taken**: Task completion overview
- **Tijd**: Time registration
- **Foto's**: Delivery photos
- **Materialen**: Materials & receipts management
- **Chat**: Project communication

### Materials & Receipts Tab
- **Materialen**: Add used materials with costs
- **Bonnetjes**: Upload receipt photos
- **Totals**: Automatic cost calculation
- **Categories**: Organize by type

## Workflow Integration

### Project Start
- Installateur kan project starten
- Status wijzigt naar 'in-uitvoering'
- Taken worden zichtbaar

### During Work
- Materialen toevoegen tijdens werk
- Bonnetjes uploaden direct
- Foto's maken van voortgang
- Tijd registreren

### Project Completion
- Alle taken afgevinkt
- Materialen en bonnetjes compleet
- Oplevering foto's gemaakt
- Handtekeningen verzameld

## Admin Benefits
- **Cost Tracking**: Exact overzicht van kosten
- **Documentation**: Complete project documentatie
- **Receipts**: Alle bonnetjes centraal
- **Approval**: Digitale handtekeningen

## Installateur Benefits
- **Guidance**: Duidelijke takenlijst
- **Efficiency**: Alles in één app
- **Documentation**: Direct uploaden
- **Completion**: Overzichtelijk proces

## Quality Assurance
- **Task Verification**: Alle taken afgevinkt
- **Photo Evidence**: Visuele bewijsvoering
- **Cost Control**: Materiaal tracking
- **Sign-off**: Formele goedkeuring