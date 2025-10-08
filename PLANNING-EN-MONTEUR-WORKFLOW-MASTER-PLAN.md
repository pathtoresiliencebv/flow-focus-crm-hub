# 🏗️ PLANNING & MONTEUR WORKFLOW - MASTER IMPLEMENTATIE PLAN

## 📋 INHOUDSOPGAVE
1. [Huidige Situatie Analyse](#huidige-situatie)
2. [Gewenste Functionaliteit](#gewenste-functionaliteit)
3. [Database Schema Updates](#database-schema)
4. [Administrator Planning Functionaliteit](#administrator-planning)
5. [Monteur Mobiele App Workflow](#monteur-workflow)
6. [Werkbon Systeem](#werkbon-systeem)
7. [Implementatie Roadmap](#implementatie-roadmap)
8. [Testing Plan](#testing-plan)

---

## 🔍 HUIDIGE SITUATIE ANALYSE

### **Bestaande Database Tabellen**

#### 1. **`planning_items`** ✅
```sql
- id (uuid, PK)
- user_id (uuid, FK auth.users) -- Creator
- assigned_user_id (uuid, FK auth.users) -- Monteur
- project_id (text) -- Link naar project
- title (text)
- description (text)
- start_date (date)
- start_time (time)
- end_time (time)
- location (text)
- status (text) -- 'Gepland', 'In uitvoering', 'Afgerond'
- created_at, updated_at
- google_calendar_event_id (text)
```

#### 2. **`projects`** ✅
```sql
- id (uuid, PK)
- title (text)
- customer_id (uuid, FK customers)
- assigned_user_id (uuid) -- Toegewezen monteur
- quote_id (uuid, FK quotes)
- date (date)
- value (numeric)
- status (enum) -- 'te-plannen', 'gepland', 'in-uitvoering', 'herkeuring', 'afgerond'
- description (text)
- completion_date (date)
- completion_id (uuid, FK project_completions)
- created_at, updated_at
```

#### 3. **`project_completions`** ✅
```sql
- id (uuid, PK)
- project_id (uuid, FK projects)
- installer_id (uuid, FK auth.users)
- completion_date (date)
- work_performed (text)
- materials_used (text)
- recommendations (text)
- notes (text)
- customer_satisfaction (integer 1-5)
- customer_signature (text, base64)
- installer_signature (text, base64)
- pdf_url (text)
- status (varchar) -- 'draft', 'completed', 'sent'
- email_sent_at (timestamptz)
- created_at, updated_at
```

#### 4. **`completion_photos`** ✅
```sql
- id (uuid, PK)
- completion_id (uuid, FK project_completions)
- photo_url (text)
- description (text)
- category (varchar) -- 'before', 'during', 'after', 'detail', 'overview'
- file_name (varchar)
- file_size (bigint)
- uploaded_at, created_at
```

#### 5. **`project_tasks`** ✅
```sql
- id (uuid, PK)
- project_id (uuid, FK projects)
- block_title (text)
- task_description (text)
- is_info_block (boolean)
- info_text (text)
- is_completed (boolean)
- order_index (integer)
- source_quote_item_id (text)
- created_at, updated_at
```

### **Bestaande Frontend Components**

#### Web App (Administrator/Desktop)
- ✅ `SimplifiedPlanningManagement.tsx` - Kalender view met planning
- ✅ `ProjectDetail.tsx` - Project details met planning tab
- ✅ `ProjectDeliveryDialog.tsx` - Desktop project oplevering
- ✅ `usePlanningStore.ts` - Planning state management
- ✅ `useCrmStore.ts` - Projects & customers management
- ✅ `useProjectDelivery.ts` - Project completion logic

#### Mobile Components (Monteur)
- ✅ `MobileProjectView.tsx` - Project overzicht voor monteur
- ✅ `MobileProjectDelivery.tsx` - Mobiele oplevering flow
- ✅ `InstallateurProjectCard.tsx` - Project card voor monteur
- ⚠️ `MobileWorkOrder.tsx` - Werkbon component (beperkt)
- ⚠️ `MobileWorkReportGenerator.tsx` - Werkbon generator (basis)

### **Wat Werkt Goed** ✅
1. Planning items kunnen aangemaakt worden door administrators
2. Monteurs kunnen hun toegewezen projecten zien
3. Project status flow is geïmplementeerd (gepland → in-uitvoering → afgerond)
4. Project completion met handtekeningen werkt
5. Foto's uploaden bij oplevering werkt
6. RLS policies zijn correct ingesteld voor security

### **Wat Ontbreekt** ❌
1. **Administrator kan niet planning maken voor klanten** - Nu alleen voor monteurs
2. **Klant notificaties bij planning** - Geen email/SMS naar klant
3. **Planning vanuit klant perspectief** - Klant kan niet eigen beschikbaarheid aangeven
4. **Uitgebreide werkbon functionaliteit:**
   - Materiaalgebruik tracking
   - Tijdsregistratie (start/stop)
   - Foto's tijdens werk (niet alleen bij oplevering)
   - Notities tijdens werk
   - QR code scanning voor materialen
5. **Mobiele app native features:**
   - GPS locatie tracking
   - Offline mode
   - Push notificaties
   - Camera integratie
6. **Reporting & Analytics:**
   - Werkbon overzicht per monteur
   - Tijdsregistratie rapportage
   - Materiaalverbruik overzicht
   - KPI dashboard

---

## 🎯 GEWENSTE FUNCTIONALITEIT

### **FASE 1: Administrator Planning voor Klanten**

#### **Gebruik Case:**
> Administrator belt klant, bespreekt beschikbaarheid, en plant direct een monteur in op een voor de klant geschikte datum/tijd.

#### **Requirements:**
1. **Planning Dialoog Update:**
   - Optie om planning type te kiezen: "Monteur" of "Klant Afspraak"
   - Voor klant afspraak: verplichte klant selectie
   - Automatisch klant adres als locatie overnemen
   - Optie om meerdere monteurs toe te wijzen (team work)
   - Verwachte duur van werk
   - Speciale instructies/notities

2. **Klant Notificaties:**
   - Automatische email naar klant met afspraak details
   - SMS optie (Twilio/MessageBird integratie)
   - iCal bijlage voor in agenda
   - Herinnering 1 dag voor afspraak

3. **Klant Portal (Toekomstig):**
   - Klant kan afspraken zien
   - Bevestigen/Wijzigen aanvragen
   - Monteur tracking op dag van afspraak

#### **UI Flow:**
```
Administrator Dashboard
  → Planning Kalender
    → Klik op datum/tijd
      → "Planning Toevoegen" Dialog
        → Type: [Monteur Planning | Klant Afspraak]
        → IF Klant Afspraak:
            → Klant Selectie (met zoekfunctie)
            → Project Selectie (optioneel, kan nieuw project zijn)
            → Monteur(s) Selectie (1 of meer)
            → Datum & Tijd
            → Verwachte Duur
            → Locatie (auto-fill van klant adres)
            → Notities/Instructies
            → Notificatie Opties:
              ☑ Email naar klant
              ☑ SMS naar klant (indien telefoonnummer)
              ☑ Notificatie naar monteur(s)
        → [Opslaan & Notificeren]
```

---

### **FASE 2: Monteur Mobiele App - Volledig Workflow**

#### **Gebruik Case:**
> Monteur logt in op mobiele app, ziet zijn planning voor vandaag, start project, registreert werk, maakt foto's, vult werkbon in, laat klant tekenen, en rondt project af.

#### **App Structuren:**

##### **A. Mobiele Dashboard**
```
🏠 Dashboard (Monteur View)
├── 📅 Vandaag Planning
│   ├── Afspraak 1 (08:00 - 12:00)
│   │   ├── Klant: Jan Smit
│   │   ├── Adres: Hoofdstraat 123
│   │   ├── Project: Zonnepanelen installatie
│   │   ├── Status: [Start Project] knop
│   │   └── [Navigeer] knop (Maps integratie)
│   └── Afspraak 2 (13:00 - 17:00)
│       └── ...
├── 📊 Actieve Projecten (In Uitvoering)
│   └── Project X - 65% voltooid
├── ✅ Afgeronde Projecten (Deze Week)
└── 📄 Werkbonnen (Concepten)
```

##### **B. Project Start Flow**
```
Project Card
  → [Start Project] knop
    → ⏰ Automatische tijdsregistratie start
    → 📍 GPS locatie vastleggen (check-in)
    → Project Status: "gepland" → "in-uitvoering"
    → Planning Status: "Gepland" → "In uitvoering"
    → Notificatie naar administrator: "Monteur X gestart met Project Y"
```

##### **C. Tijdens Werk**
```
Project Detail View (In Uitvoering)
├── ⏱️ Timer (auto-running)
│   ├── Gestart om: 08:15
│   ├── Verstreken tijd: 2u 34m
│   └── [Pauze] / [Doorgaan] knoppen
├── ✅ Taken Checklist
│   ├── ☑ Zonnepanelen monteren (8/10)
│   ├── ☐ Bedrading aansluiten
│   └── ☐ Systeem testen
├── 📸 Foto's Toevoegen
│   ├── [Maak Foto] (direct camera)
│   ├── [Upload Foto] (galerij)
│   └── Categorie: [Voor] [Tijdens] [Na] [Detail]
├── 📦 Materiaal Gebruik
│   ├── [Scan QR] code
│   ├── [Handmatig Toevoegen]
│   └── Lijst: 10x Zonnepaneel, 50m Kabel, ...
├── 📝 Notities
│   └── [Voeg notitie toe]
└── [Project Afronden] knop
```

##### **D. Project Afronden Flow**
```
[Project Afronden] knop
  → Step 1: Werk Samenvatting
      - Wat is uitgevoerd?
      - Eventuele afwijkingen?
      - Aanbevelingen
  → Step 2: Foto's Controle
      - Overzicht van alle foto's
      - Verplicht: minimaal 1 "voor" en 1 "na" foto
      - Optie om foto's te verwijderen/toevoegen
  → Step 3: Materiaalgebruik Bevestiging
      - Lijst van gebruikte materialen
      - Hoeveelheden bevestigen
      - Prijs indicatie (indien beschikbaar)
  → Step 4: Tijdsregistratie
      - Totale werktijd: 6u 23m
      - Pauzes: 30m
      - Netto werktijd: 5u 53m
      - [Wijzigen] optie
  → Step 5: Klanttevredenheid
      - Rating: ⭐⭐⭐⭐⭐ (1-5 sterren)
      - Eventuele klachten/feedback?
  → Step 6: Handtekeningen
      - Klant Handtekening
      - Naam klant (bevestigen)
      - Monteur Handtekening
  → Step 7: Werkbon Genereren
      - PDF Genereren
      - Direct naar klant emailen: [Ja/Nee]
      - Kopie naar administrator: [Ja/Nee]
  → ✅ Project Status → "afgerond"
  → 📧 Notificaties versturen
  → ⏰ Timer stoppen
  → 📍 GPS check-out
```

---

## 🗄️ DATABASE SCHEMA UPDATES

### **Nieuwe Tabellen Nodig**

#### 1. **`planning_participants`** (Nieuwe Tabel)
> Voor multi-monteur planning en klant betrokkenheid

```sql
CREATE TABLE public.planning_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  planning_id UUID REFERENCES public.planning_items(id) ON DELETE CASCADE NOT NULL,
  participant_type VARCHAR(50) NOT NULL, -- 'monteur', 'klant', 'administrator'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  role VARCHAR(50), -- 'hoofdmonteur', 'assistent', 'contactpersoon'
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_planning_participants_planning_id ON public.planning_participants(planning_id);
CREATE INDEX idx_planning_participants_user_id ON public.planning_participants(user_id);
CREATE INDEX idx_planning_participants_customer_id ON public.planning_participants(customer_id);
```

#### 2. **`work_time_logs`** (Nieuwe Tabel)
> Voor gedetailleerde tijdsregistratie per project

```sql
CREATE TABLE public.work_time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  installer_id UUID REFERENCES auth.users(id) NOT NULL,
  planning_id UUID REFERENCES public.planning_items(id) ON DELETE SET NULL,
  
  -- Tijdsregistratie
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  break_duration_minutes INTEGER DEFAULT 0,
  total_duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (ended_at - started_at))/60 - break_duration_minutes
  ) STORED,
  
  -- Locatie (GPS)
  start_location_lat DECIMAL(10, 8),
  start_location_lng DECIMAL(11, 8),
  end_location_lat DECIMAL(10, 8),
  end_location_lng DECIMAL(11, 8),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed'
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_time_logs_project_id ON public.work_time_logs(project_id);
CREATE INDEX idx_work_time_logs_installer_id ON public.work_time_logs(installer_id);
CREATE INDEX idx_work_time_logs_started_at ON public.work_time_logs(started_at DESC);
```

#### 3. **`material_usage`** (Nieuwe Tabel)
> Voor materiaalverbruik tracking

```sql
CREATE TABLE public.material_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  completion_id UUID REFERENCES public.project_completions(id) ON DELETE CASCADE,
  installer_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Materiaal info
  material_name VARCHAR(255) NOT NULL,
  material_code VARCHAR(100), -- SKU/EAN/QR code
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'stuks', -- 'stuks', 'meter', 'kg', 'liter'
  
  -- Prijs (optioneel)
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Extra info
  category VARCHAR(100), -- 'zonnepanelen', 'bedrading', 'montage', etc.
  notes TEXT,
  photo_url TEXT,
  
  -- Tracking
  scanned_from_qr BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_material_usage_project_id ON public.material_usage(project_id);
CREATE INDEX idx_material_usage_installer_id ON public.material_usage(installer_id);
CREATE INDEX idx_material_usage_material_code ON public.material_usage(material_code);
```

#### 4. **`customer_notifications`** (Nieuwe Tabel)
> Voor tracking van notificaties naar klanten

```sql
CREATE TABLE public.customer_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  planning_id UUID REFERENCES public.planning_items(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Notificatie type
  notification_type VARCHAR(50) NOT NULL, -- 'planning_created', 'reminder', 'completion', 'invoice'
  channel VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push'
  
  -- Content
  subject TEXT,
  message TEXT,
  
  -- Status
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'opened'
  error_message TEXT,
  
  -- Metadata
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  metadata JSONB, -- Extra data (ical attachment, etc.)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_notifications_customer_id ON public.customer_notifications(customer_id);
CREATE INDEX idx_customer_notifications_planning_id ON public.customer_notifications(planning_id);
CREATE INDEX idx_customer_notifications_status ON public.customer_notifications(status);
CREATE INDEX idx_customer_notifications_sent_at ON public.customer_notifications(sent_at DESC);
```

### **Bestaande Tabellen Uitbreiden**

#### **`planning_items` Updates:**
```sql
-- Add nieuwe velden voor klant afspraken
ALTER TABLE public.planning_items
ADD COLUMN planning_type VARCHAR(50) DEFAULT 'monteur', -- 'monteur', 'klant_afspraak', 'intern'
ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN expected_duration_minutes INTEGER DEFAULT 480, -- Default 8 uur
ADD COLUMN team_size INTEGER DEFAULT 1,
ADD COLUMN special_instructions TEXT,
ADD COLUMN notify_customer BOOLEAN DEFAULT false,
ADD COLUMN notify_sms BOOLEAN DEFAULT false,
ADD COLUMN confirmed_by_customer BOOLEAN DEFAULT false,
ADD COLUMN confirmed_at TIMESTAMPTZ;

CREATE INDEX idx_planning_items_customer_id ON public.planning_items(customer_id);
CREATE INDEX idx_planning_items_planning_type ON public.planning_items(planning_type);
```

#### **`project_completions` Updates:**
```sql
-- Add extra velden voor uitgebreide werkbon
ALTER TABLE public.project_completions
ADD COLUMN total_work_hours DECIMAL(5, 2),
ADD COLUMN break_duration_minutes INTEGER DEFAULT 0,
ADD COLUMN net_work_hours DECIMAL(5, 2),
ADD COLUMN materials_cost DECIMAL(10, 2),
ADD COLUMN labor_cost DECIMAL(10, 2),
ADD COLUMN total_cost DECIMAL(10, 2),
ADD COLUMN work_summary_json JSONB, -- Structured werk data
ADD COLUMN customer_feedback TEXT,
ADD COLUMN internal_notes TEXT;
```

---

## 👨‍💼 ADMINISTRATOR PLANNING FUNCTIONALITEIT

### **Component Updates**

#### **1. `SimplifiedPlanningManagement.tsx` - Hoofdcomponent Update**

**Nieuwe Features:**
- Planning type selectie (Monteur vs Klant Afspraak)
- Klant zoeken en selecteren
- Multi-monteur selectie
- Automatische notificatie opties
- Verwachte duur instellen

**Code Structuur:**
```typescript
interface PlanningFormData {
  // Basis
  type: 'monteur' | 'klant_afspraak' | 'intern';
  title: string;
  description: string;
  
  // Tijd & Locatie
  date: Date;
  startTime: string;
  endTime: string;
  expectedDuration: number; // minutes
  location: string;
  
  // Betrokkenen
  customerId?: string; // Voor klant afspraken
  projectId?: string; // Link naar project (optioneel)
  assignedMonteurs: string[]; // Array van user IDs
  
  // Notificaties
  notifyCustomer: boolean;
  notifySMS: boolean;
  notifyMonteurs: boolean;
  
  // Extra
  specialInstructions?: string;
  requiresConfirmation: boolean;
}
```

#### **2. Nieuwe Component: `CustomerPlanningDialog.tsx`**

**Purpose:** Dedicated dialoog voor klant afspraken plannen

**Features:**
- Klant autocomplete met recent klanten
- Project associatie (bestaand of nieuw)
- Multi-monteur selectie met beschikbaarheid check
- Automatische reistijd berekening
- Notificatie preview
- Conflict detectie (dubbele bookings)

**UI Flow:**
```tsx
<CustomerPlanningDialog>
  <Step 1: Klant Selectie>
    - Zoek klant
    - Toon klant details
    - Adres voor locatie
  </Step>
  
  <Step 2: Project Koppeling>
    - Bestaand project selecteren?
    - Of nieuwe project titel
  </Step>
  
  <Step 3: Planning Details>
    - Datum & Tijd picker
    - Verwachte duur
    - Monteur(s) selectie
    - Check beschikbaarheid
  </Step>
  
  <Step 4: Notificaties>
    - ☑ Email naar klant
    - ☑ SMS naar klant (als tel.nr beschikbaar)
    - ☑ Push naar monteur(s)
    - Preview van bericht
  </Step>
  
  <Step 5: Bevestiging>
    - Overzicht van afspraak
    - [Opslaan & Versturen]
  </Step>
</CustomerPlanningDialog>
```

#### **3. `CustomerNotificationService.ts` - Nieuwe Service**

**Purpose:** Handle alle klant notificaties

```typescript
class CustomerNotificationService {
  async sendPlanningNotification(
    planning: PlanningItem,
    customer: Customer,
    options: NotificationOptions
  ): Promise<NotificationResult> {
    const results: NotificationResult = {
      email: null,
      sms: null
    };
    
    // Email verzenden
    if (options.sendEmail && customer.email) {
      results.email = await this.sendEmail({
        to: customer.email,
        subject: `Afspraak Gepland - ${planning.title}`,
        template: 'planning-confirmation',
        data: {
          customerName: customer.name,
          date: format(planning.start_date, 'dd MMMM yyyy'),
          time: `${planning.start_time} - ${planning.end_time}`,
          address: planning.location,
          description: planning.description,
          monteurs: await this.getMonteurNames(planning.assigned_user_id)
        },
        attachments: [
          await this.generateICalAttachment(planning)
        ]
      });
      
      // Log notificatie in database
      await this.logNotification({
        customer_id: customer.id,
        planning_id: planning.id,
        type: 'planning_created',
        channel: 'email',
        recipient_email: customer.email,
        status: results.email.success ? 'sent' : 'failed'
      });
    }
    
    // SMS verzenden (via Twilio/MessageBird)
    if (options.sendSMS && customer.phone) {
      results.sms = await this.sendSMS({
        to: customer.phone,
        message: `Beste ${customer.name}, u heeft een afspraak op ${format(planning.start_date, 'dd-MM-yyyy')} om ${planning.start_time}. Locatie: ${planning.location}. Groet, Smans CRM`
      });
      
      await this.logNotification({
        customer_id: customer.id,
        planning_id: planning.id,
        type: 'planning_created',
        channel: 'sms',
        recipient_phone: customer.phone,
        status: results.sms.success ? 'sent' : 'failed'
      });
    }
    
    return results;
  }
  
  async sendReminderNotification(
    planning: PlanningItem,
    customer: Customer,
    hoursBefore: number = 24
  ): Promise<void> {
    // Herinnering 24u voor afspraak
    // Kan via cronjob/scheduled function
  }
  
  async generateICalAttachment(planning: PlanningItem): Promise<Buffer> {
    // Generate .ics file voor in klant agenda
    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Smans CRM//Planning//NL
BEGIN:VEVENT
UID:${planning.id}@smanscrm.nl
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(planning.start_date, planning.start_time)}
DTEND:${formatICalDate(planning.start_date, planning.end_time)}
SUMMARY:${planning.title}
DESCRIPTION:${planning.description || ''}
LOCATION:${planning.location || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    
    return Buffer.from(ical, 'utf-8');
  }
}
```

---

## 📱 MONTEUR MOBIELE APP WORKFLOW

### **App Structure**

#### **1. Login & Dashboard**

```typescript
// MonteurDashboard.tsx
export const MonteurDashboard = () => {
  const { user, profile } = useAuth();
  const { planningItems } = useMonteurPlanning(); // Filter op user.id
  const { activeProjects, completedToday } = useMonteurProjects();
  const { activeWorkSession } = useWorkTimeTracking();
  
  // Vandaag planning filteren
  const todayPlanning = planningItems.filter(p => 
    isToday(new Date(p.start_date))
  );
  
  return (
    <div className="mobile-dashboard">
      {/* Active Work Session Banner */}
      {activeWorkSession && (
        <ActiveSessionBanner 
          session={activeWorkSession}
          onPause={() => pauseWork(activeWorkSession.id)}
          onStop={() => completeWork(activeWorkSession.id)}
        />
      )}
      
      {/* Vandaag Planning */}
      <Section title="Vandaag Planning">
        {todayPlanning.map(planning => (
          <PlanningCard 
            key={planning.id}
            planning={planning}
            onStart={() => startProject(planning.project_id)}
            onNavigate={() => openMaps(planning.location)}
          />
        ))}
      </Section>
      
      {/* Actieve Projecten */}
      <Section title="Actieve Projecten">
        {activeProjects.map(project => (
          <ProjectCard 
            key={project.id}
            project={project}
            onContinue={() => continueProject(project.id)}
            onComplete={() => openCompletionFlow(project.id)}
          />
        ))}
      </Section>
      
      {/* Stats */}
      <Section title="Vandaag">
        <Stats>
          <Stat label="Afgerond" value={completedToday} icon="✅" />
          <Stat label="Uren" value={totalHoursToday} icon="⏰" />
        </Stats>
      </Section>
    </div>
  );
};
```

#### **2. Project Start Flow**

```typescript
// useProjectStart.ts
export const useProjectStart = () => {
  const { user } = useAuth();
  const { getCurrentLocation } = useGeolocation();
  
  const startProject = async (projectId: string) => {
    try {
      // 1. GPS Check-in
      const location = await getCurrentLocation();
      
      // 2. Start Time Log
      const { data: timeLog } = await supabase
        .from('work_time_logs')
        .insert({
          project_id: projectId,
          installer_id: user.id,
          started_at: new Date().toISOString(),
          start_location_lat: location.latitude,
          start_location_lng: location.longitude,
          status: 'active'
        })
        .select()
        .single();
      
      // 3. Update Project Status
      await supabase
        .from('projects')
        .update({ status: 'in-uitvoering' })
        .eq('id', projectId);
      
      // 4. Update Planning Status
      await supabase
        .from('planning_items')
        .update({ status: 'In uitvoering' })
        .eq('project_id', projectId)
        .eq('assigned_user_id', user.id);
      
      // 5. Notificeer Administrator
      await sendNotification({
        type: 'project_started',
        userId: user.id,
        projectId,
        message: `${user.full_name} is gestart met project`
      });
      
      // 6. Start local timer
      startLocalTimer(timeLog.id);
      
      return { success: true, timeLogId: timeLog.id };
    } catch (error) {
      console.error('Error starting project:', error);
      throw error;
    }
  };
  
  return { startProject };
};
```

#### **3. Tijdens Werk - Project Detail View**

```typescript
// MonteurProjectDetail.tsx
export const MonteurProjectDetail = ({ projectId }: Props) => {
  const { project, tasks } = useProject(projectId);
  const { activeTimeLog, elapsedTime } = useActiveWorkSession(projectId);
  const { materials, addMaterial } = useMaterialTracking(projectId);
  const { photos, uploadPhoto } = useProjectPhotos(projectId);
  const [notes, setNotes] = useState('');
  
  return (
    <div className="project-detail-mobile">
      {/* Header met Timer */}
      <Header>
        <BackButton />
        <Title>{project.title}</Title>
        <Timer 
          startTime={activeTimeLog.started_at}
          elapsedTime={elapsedTime}
          isPaused={activeTimeLog.status === 'paused'}
          onPause={() => pauseWork(activeTimeLog.id)}
          onResume={() => resumeWork(activeTimeLog.id)}
        />
      </Header>
      
      {/* Tabs */}
      <Tabs>
        <Tab label="Taken" icon="✅">
          <TaskList 
            tasks={tasks}
            onToggle={(taskId, completed) => updateTask(taskId, completed)}
          />
        </Tab>
        
        <Tab label="Foto's" icon="📸">
          <PhotoGallery 
            photos={photos}
            onCapture={() => capturePhoto()}
            onUpload={(file) => uploadPhoto(file)}
            onCategorize={(photoId, category) => updatePhotoCategory(photoId, category)}
          />
        </Tab>
        
        <Tab label="Materiaal" icon="📦">
          <MaterialList 
            materials={materials}
            onScanQR={() => scanQRCode()}
            onAdd={() => showAddMaterialDialog()}
          />
        </Tab>
        
        <Tab label="Notities" icon="📝">
          <NotesEditor 
            value={notes}
            onChange={setNotes}
            onSave={() => saveNotes(projectId, notes)}
          />
        </Tab>
      </Tabs>
      
      {/* Actions */}
      <Footer>
        <Button 
          variant="primary" 
          size="large"
          onClick={() => openCompletionFlow(projectId)}
        >
          Project Afronden
        </Button>
      </Footer>
    </div>
  );
};
```

#### **4. Material Tracking met QR**

```typescript
// useMaterialTracking.ts
export const useMaterialTracking = (projectId: string) => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialUsage[]>([]);
  
  const scanQRCode = async () => {
    try {
      // Use Capacitor Barcode Scanner
      const result = await BarcodeScanner.scan();
      
      if (result.hasContent) {
        // Lookup material in database
        const material = await lookupMaterial(result.content);
        
        if (material) {
          // Auto-fill material dialog
          await addMaterial({
            material_name: material.name,
            material_code: result.content,
            quantity: 1,
            unit: material.unit,
            unit_price: material.price,
            category: material.category,
            scanned_from_qr: true
          });
        } else {
          // Onbekend materiaal, handmatig invoeren
          showManualMaterialDialog(result.content);
        }
      }
    } catch (error) {
      console.error('QR scan error:', error);
      showError('QR code kon niet gescand worden');
    }
  };
  
  const addMaterial = async (materialData: Partial<MaterialUsage>) => {
    const { data, error } = await supabase
      .from('material_usage')
      .insert({
        project_id: projectId,
        installer_id: user.id,
        ...materialData,
        used_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (!error) {
      setMaterials(prev => [...prev, data]);
      showSuccess(`${data.material_name} toegevoegd`);
    }
  };
  
  return {
    materials,
    addMaterial,
    scanQRCode
  };
};
```

#### **5. Project Completion Flow (Uitgebreid)**

```typescript
// MonteurCompletionFlow.tsx
export const MonteurCompletionFlow = ({ projectId }: Props) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CompletionFormData>({
    workSummary: '',
    recommendations: '',
    materials: [],
    totalHours: 0,
    breakMinutes: 0,
    photos: [],
    customerSatisfaction: 5,
    customerFeedback: '',
    customerSignature: '',
    monteurSignature: ''
  });
  
  const totalSteps = 7;
  
  const handleComplete = async () => {
    try {
      // 1. Stop work time log
      const timeLog = await stopWorkSession(projectId);
      
      // 2. Create completion record
      const completion = await createCompletion({
        project_id: projectId,
        installer_id: user.id,
        completion_date: new Date().toISOString(),
        work_performed: formData.workSummary,
        recommendations: formData.recommendations,
        materials_used: JSON.stringify(formData.materials),
        total_work_hours: timeLog.total_duration_minutes / 60,
        break_duration_minutes: formData.breakMinutes,
        customer_satisfaction: formData.customerSatisfaction,
        customer_signature: formData.customerSignature,
        installer_signature: formData.monteurSignature,
        customer_feedback: formData.customerFeedback
      });
      
      // 3. Upload photos
      for (const photo of formData.photos) {
        await uploadCompletionPhoto(completion.id, photo);
      }
      
      // 4. Generate PDF work report
      const pdfUrl = await generateWorkReport(completion.id);
      
      // 5. Update completion with PDF
      await updateCompletion(completion.id, { 
        pdf_url: pdfUrl,
        status: 'completed' 
      });
      
      // 6. Update project status
      await completeProject(projectId, completion.id);
      
      // 7. Send notifications
      await sendCompletionNotifications(projectId, completion.id);
      
      showSuccess('Project succesvol afgerond!');
      navigate('/dashboard');
    } catch (error) {
      showError('Fout bij afronden project');
    }
  };
  
  return (
    <div className="completion-flow">
      <ProgressBar current={step} total={totalSteps} />
      
      {step === 1 && (
        <StepWorkSummary 
          data={formData}
          onChange={(data) => setFormData({ ...formData, ...data })}
          onNext={() => setStep(2)}
        />
      )}
      
      {step === 2 && (
        <StepPhotos 
          photos={formData.photos}
          onChange={(photos) => setFormData({ ...formData, photos })}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      
      {step === 3 && (
        <StepMaterials 
          materials={formData.materials}
          onChange={(materials) => setFormData({ ...formData, materials })}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      
      {step === 4 && (
        <StepTimeTracking 
          totalHours={formData.totalHours}
          breakMinutes={formData.breakMinutes}
          onChange={(data) => setFormData({ ...formData, ...data })}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      
      {step === 5 && (
        <StepCustomerFeedback 
          satisfaction={formData.customerSatisfaction}
          feedback={formData.customerFeedback}
          onChange={(data) => setFormData({ ...formData, ...data })}
          onNext={() => setStep(6)}
          onBack={() => setStep(4)}
        />
      )}
      
      {step === 6 && (
        <StepSignatures 
          customerSignature={formData.customerSignature}
          monteurSignature={formData.monteurSignature}
          onChange={(data) => setFormData({ ...formData, ...data })}
          onNext={() => setStep(7)}
          onBack={() => setStep(5)}
        />
      )}
      
      {step === 7 && (
        <StepReview 
          data={formData}
          onComplete={handleComplete}
          onBack={() => setStep(6)}
        />
      )}
    </div>
  );
};
```

---

## 📄 WERKBON SYSTEEM

### **Werkbon Template & PDF Generatie**

#### **Werkbon Structure**

```typescript
interface WorkReport {
  // Header
  reportNumber: string; // WB-2025-001
  reportDate: Date;
  
  // Project Info
  projectTitle: string;
  projectDescription: string;
  
  // Customer Info
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  
  // Monteur Info
  installerName: string;
  installerPhone: string;
  
  // Work Details
  workDate: Date;
  startTime: string;
  endTime: string;
  totalHours: number;
  breakMinutes: number;
  netHours: number;
  
  // Work Performed
  workSummary: string;
  tasksCompleted: Task[];
  
  // Materials
  materialsUsed: Material[];
  totalMaterialsCost: number;
  
  // Photos
  beforePhotos: Photo[];
  duringPhotos: Photo[];
  afterPhotos: Photo[];
  
  // Recommendations
  recommendations: string;
  
  // Customer Feedback
  customerSatisfaction: number; // 1-5
  customerFeedback: string;
  
  // Signatures
  customerSignature: string; // base64
  installerSignature: string; // base64
  customerName: string; // Printed name
  signedAt: Date;
  
  // Costs (optioneel)
  laborCost?: number;
  materialsCost?: number;
  totalCost?: number;
}
```

#### **PDF Template (React-PDF)**

```tsx
// components/WorkReportPDF.tsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #000'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2563eb'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  label: {
    width: '30%',
    fontWeight: 'bold'
  },
  value: {
    width: '70%'
  },
  table: {
    display: 'table',
    width: '100%',
    marginBottom: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ccc'
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold'
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  photo: {
    width: '48%',
    height: 150,
    objectFit: 'cover'
  },
  signature: {
    width: 200,
    height: 100,
    border: '1pt solid #000'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8
  }
});

export const WorkReportPDF = ({ report }: { report: WorkReport }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WERKBON</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Werkbon Nr:</Text>
          <Text style={styles.value}>{report.reportNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Datum:</Text>
          <Text style={styles.value}>{format(report.reportDate, 'dd MMMM yyyy')}</Text>
        </View>
      </View>
      
      {/* Project Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Informatie</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Project:</Text>
          <Text style={styles.value}>{report.projectTitle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Beschrijving:</Text>
          <Text style={styles.value}>{report.projectDescription}</Text>
        </View>
      </View>
      
      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Klant Gegevens</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Naam:</Text>
          <Text style={styles.value}>{report.customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Adres:</Text>
          <Text style={styles.value}>{report.customerAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Telefoon:</Text>
          <Text style={styles.value}>{report.customerPhone}</Text>
        </View>
      </View>
      
      {/* Work Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Werk Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Werkdatum:</Text>
          <Text style={styles.value}>{format(report.workDate, 'dd MMMM yyyy')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Werktijd:</Text>
          <Text style={styles.value}>{report.startTime} - {report.endTime}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Totale uren:</Text>
          <Text style={styles.value}>{report.totalHours}u (Pauze: {report.breakMinutes}min)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Netto uren:</Text>
          <Text style={styles.value}>{report.netHours}u</Text>
        </View>
      </View>
      
      {/* Work Performed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uitgevoerd Werk</Text>
        <Text>{report.workSummary}</Text>
        
        {report.tasksCompleted.length > 0 && (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={{ width: '10%' }}>✓</Text>
              <Text style={{ width: '90%' }}>Taak</Text>
            </View>
            {report.tasksCompleted.map((task, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ width: '10%' }}>✅</Text>
                <Text style={{ width: '90%' }}>{task.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {/* Materials */}
      {report.materialsUsed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gebruikte Materialen</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={{ width: '50%' }}>Materiaal</Text>
              <Text style={{ width: '20%' }}>Aantal</Text>
              <Text style={{ width: '15%' }}>Eenheid</Text>
              <Text style={{ width: '15%' }}>Prijs</Text>
            </View>
            {report.materialsUsed.map((material, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ width: '50%' }}>{material.name}</Text>
                <Text style={{ width: '20%' }}>{material.quantity}</Text>
                <Text style={{ width: '15%' }}>{material.unit}</Text>
                <Text style={{ width: '15%' }}>€{material.totalPrice?.toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Totaal Materiaal:</Text>
            <Text style={styles.value}>€{report.totalMaterialsCost.toFixed(2)}</Text>
          </View>
        </View>
      )}
      
      {/* Photos */}
      {(report.beforePhotos.length > 0 || report.afterPhotos.length > 0) && (
        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>Foto's</Text>
          
          {report.beforePhotos.length > 0 && (
            <>
              <Text>Voor:</Text>
              <View style={styles.photoGrid}>
                {report.beforePhotos.slice(0, 4).map((photo, i) => (
                  <Image key={i} src={photo.url} style={styles.photo} />
                ))}
              </View>
            </>
          )}
          
          {report.afterPhotos.length > 0 && (
            <>
              <Text>Na:</Text>
              <View style={styles.photoGrid}>
                {report.afterPhotos.slice(0, 4).map((photo, i) => (
                  <Image key={i} src={photo.url} style={styles.photo} />
                ))}
              </View>
            </>
          )}
        </View>
      )}
      
      {/* Recommendations */}
      {report.recommendations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aanbevelingen</Text>
          <Text>{report.recommendations}</Text>
        </View>
      )}
      
      {/* Customer Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Klanttevredenheid</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Rating:</Text>
          <Text style={styles.value}>{'⭐'.repeat(report.customerSatisfaction)} ({report.customerSatisfaction}/5)</Text>
        </View>
        {report.customerFeedback && (
          <Text>{report.customerFeedback}</Text>
        )}
      </View>
      
      {/* Signatures */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Handtekeningen</Text>
        <View style={styles.row}>
          <View style={{ width: '48%' }}>
            <Text>Klant:</Text>
            <Image src={report.customerSignature} style={styles.signature} />
            <Text>{report.customerName}</Text>
            <Text>{format(report.signedAt, 'dd-MM-yyyy HH:mm')}</Text>
          </View>
          <View style={{ width: '48%' }}>
            <Text>Monteur:</Text>
            <Image src={report.installerSignature} style={styles.signature} />
            <Text>{report.installerName}</Text>
            <Text>{format(report.signedAt, 'dd-MM-yyyy HH:mm')}</Text>
          </View>
        </View>
      </View>
      
      {/* Footer */}
      <Text style={styles.footer}>
        Dit document is elektronisch gegenereerd en rechtsgeldig ondertekend. | Smans CRM © {new Date().getFullYear()}
      </Text>
    </Page>
  </Document>
);
```

#### **PDF Generation Service**

```typescript
// services/workReportService.ts
import { pdf } from '@react-pdf/renderer';
import { WorkReportPDF } from '@/components/WorkReportPDF';

export class WorkReportService {
  async generateWorkReport(completionId: string): Promise<string> {
    // 1. Fetch all data
    const completion = await this.getCompletionData(completionId);
    const project = await this.getProjectData(completion.project_id);
    const customer = await this.getCustomerData(project.customer_id);
    const installer = await this.getInstallerData(completion.installer_id);
    const materials = await this.getMaterials(completionId);
    const photos = await this.getPhotos(completionId);
    const tasks = await this.getCompletedTasks(project.id);
    const timeLog = await this.getTimeLog(project.id, completion.installer_id);
    
    // 2. Build report data
    const reportData: WorkReport = {
      reportNumber: `WB-${new Date().getFullYear()}-${String(completion.id).substring(0, 6)}`,
      reportDate: new Date(),
      projectTitle: project.title,
      projectDescription: project.description || '',
      customerName: customer.name,
      customerAddress: customer.address || '',
      customerPhone: customer.phone || '',
      customerEmail: customer.email || '',
      installerName: installer.full_name || '',
      installerPhone: installer.phone || '',
      workDate: new Date(completion.completion_date),
      startTime: timeLog.started_at ? format(new Date(timeLog.started_at), 'HH:mm') : '08:00',
      endTime: timeLog.ended_at ? format(new Date(timeLog.ended_at), 'HH:mm') : '17:00',
      totalHours: completion.total_work_hours || 0,
      breakMinutes: completion.break_duration_minutes || 0,
      netHours: completion.net_work_hours || 0,
      workSummary: completion.work_performed,
      tasksCompleted: tasks,
      materialsUsed: materials,
      totalMaterialsCost: materials.reduce((sum, m) => sum + (m.total_price || 0), 0),
      beforePhotos: photos.filter(p => p.category === 'before'),
      duringPhotos: photos.filter(p => p.category === 'during'),
      afterPhotos: photos.filter(p => p.category === 'after'),
      recommendations: completion.recommendations || '',
      customerSatisfaction: completion.customer_satisfaction,
      customerFeedback: completion.customer_feedback || '',
      customerSignature: completion.customer_signature,
      installerSignature: completion.installer_signature,
      customerName: completion.client_name || customer.name,
      signedAt: new Date(completion.created_at)
    };
    
    // 3. Generate PDF
    const blob = await pdf(<WorkReportPDF report={reportData} />).toBlob();
    
    // 4. Upload to Supabase Storage
    const fileName = `workbon-${reportData.reportNumber}.pdf`;
    const filePath = `${completion.project_id}/${fileName}`;
    
    const { data: uploadData, error } = await supabase.storage
      .from('completion-reports')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (error) throw error;
    
    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('completion-reports')
      .getPublicUrl(filePath);
    
    return publicUrl;
  }
  
  async emailWorkReport(completionId: string, recipients: string[]): Promise<void> {
    // Generate PDF URL
    const pdfUrl = await this.generateWorkReport(completionId);
    
    // Get completion data for email
    const completion = await this.getCompletionData(completionId);
    const project = await this.getProjectData(completion.project_id);
    const customer = await this.getCustomerData(project.customer_id);
    
    // Send email via Edge Function
    await supabase.functions.invoke('send-email', {
      body: {
        to: recipients,
        subject: `Werkbon - ${project.title}`,
        template: 'work-report',
        data: {
          customerName: customer.name,
          projectTitle: project.title,
          completionDate: format(new Date(completion.completion_date), 'dd MMMM yyyy'),
          pdfUrl
        },
        attachments: [
          {
            filename: `werkbon-${project.title.replace(/\s/g, '-')}.pdf`,
            path: pdfUrl
          }
        ]
      }
    });
  }
}
```

---

## 🗺️ IMPLEMENTATIE ROADMAP

### **SPRINT 1: Database & Backend (Week 1-2)**

**Taken:**
1. ✅ Analyseer huidige database schema
2. 🔨 Maak nieuwe tabellen:
   - `planning_participants`
   - `work_time_logs`
   - `material_usage`
   - `customer_notifications`
3. 🔨 Update bestaande tabellen:
   - `planning_items` - Add klant velden
   - `project_completions` - Add extended fields
4. 🔨 Create RLS policies voor nieuwe tabellen
5. 🔨 Create indexes voor performance
6. 🔨 Maak database functions:
   - `complete_project_with_work_log()`
   - `get_monteur_daily_summary()`
   - `get_project_cost_breakdown()`
7. 🧪 Test alle database queries

**Deliverables:**
- SQL migration files
- Database documentation
- Test queries

---

### **SPRINT 2: Administrator Planning (Week 3-4)**

**Taken:**
1. 🔨 Update `usePlanningStore.ts` hook:
   - Add klant afspraak functies
   - Add multi-monteur support
   - Add notificatie triggers
2. 🔨 Create `CustomerPlanningDialog.tsx`:
   - Multi-step wizard
   - Klant search/select
   - Monteur availability check
   - Notificatie options
3. 🔨 Create `CustomerNotificationService.ts`:
   - Email sending (Resend/SendGrid)
   - SMS sending (Twilio/MessageBird)
   - iCal generation
   - Notification logging
4. 🔨 Update `SimplifiedPlanningManagement.tsx`:
   - Add planning type filter
   - Add klant column in planning list
   - Color coding voor types
5. 🔨 Create Edge Function `send-customer-notification`:
   - Handle email/SMS sending
   - Queue system voor bulk sends
   - Retry logic
6. 🧪 Test complete administrator flow
7. 📱 Test email/SMS ontvangst

**Deliverables:**
- Updated planning components
- Customer notification system
- Edge function deployed
- Admin user guide

---

### **SPRINT 3: Monteur Dashboard & Start (Week 5-6)**

**Taken:**
1. 🔨 Create `MonteurDashboard.tsx`:
   - Today's planning view
   - Active projects section
   - Stats overview
2. 🔨 Create `useWorkTimeTracking.ts` hook:
   - Start work session
   - Pause/resume functionality
   - GPS check-in/out
   - Local timer sync
3. 🔨 Create `useMonteurPlanning.ts` hook:
   - Filter op assigned_user_id
   - Group by date
   - Sort by time
4. 🔨 Update `useProjectStart.ts`:
   - Integrate work time logging
   - Add GPS functionality
   - Add status updates
   - Send notifications
5. 🔨 Create `ActiveSessionBanner.tsx`:
   - Live timer display
   - Pause/stop controls
   - Project quick info
6. 🔨 Add Capacitor plugins:
   - Geolocation
   - Background Mode
   - Local Notifications
7. 🧪 Test project start flow
8. 🧪 Test GPS permissions & tracking

**Deliverables:**
- Monteur dashboard
- Work time tracking system
- Project start functionality
- Mobile app build (dev)

---

### **SPRINT 4: Tijdens Werk Features (Week 7-8)**

**Taken:**
1. 🔨 Create `MonteurProjectDetail.tsx`:
   - Tabbed interface
   - Task list with checkboxes
   - Photo gallery
   - Material list
   - Notes editor
2. 🔨 Create `useMaterialTracking.ts` hook:
   - QR scanning functionality
   - Material lookup
   - Add/edit/delete materials
3. 🔨 Create `useProjectPhotos.ts` hook:
   - Camera capture
   - Gallery upload
   - Photo categorization
   - Thumbnail generation
4. 🔨 Integrate Capacitor plugins:
   - Camera
   - Filesystem
   - Barcode Scanner
5. 🔨 Create `PhotoCaptureDialog.tsx`:
   - Capture with category selection
   - Instant preview
   - Compression
6. 🔨 Create `MaterialScanDialog.tsx`:
   - QR scanner interface
   - Material lookup results
   - Quick add form
7. 🔨 Create `TaskProgressIndicator.tsx`:
   - Visual progress bar
   - Percentage completion
   - Task categories
8. 🧪 Test all tijdens-werk features
9. 🧪 Test offline mode

**Deliverables:**
- Complete during-work interface
- Material tracking system
- Photo capture system
- QR scanning functionality

---

### **SPRINT 5: Project Completion Flow (Week 9-10)**

**Taken:**
1. 🔨 Create `MonteurCompletionFlow.tsx`:
   - 7-step wizard
   - Progress indicator
   - Data persistence (draft mode)
2. 🔨 Create step components:
   - `StepWorkSummary.tsx`
   - `StepPhotos.tsx`
   - `StepMaterials.tsx`
   - `StepTimeTracking.tsx`
   - `StepCustomerFeedback.tsx`
   - `StepSignatures.tsx`
   - `StepReview.tsx`
3. 🔨 Create `useProjectCompletion.ts` hook:
   - Save draft
   - Submit completion
   - Generate work report
   - Send notifications
4. 🔨 Update `SignaturePad.tsx`:
   - Improve touch responsiveness
   - Add clear/undo
   - Optimize base64 size
5. 🧪 Test completion flow end-to-end
6. 🧪 Test draft save/restore

**Deliverables:**
- Complete completion flow
- All step components
- Draft functionality
- Signature improvements

---

### **SPRINT 6: Werkbon Generation (Week 11-12)**

**Taken:**
1. 🔨 Create `WorkReportPDF.tsx`:
   - Professional layout
   - All sections
   - Photo embedding
   - Signature display
2. 🔨 Create `WorkReportService.ts`:
   - Data aggregation
   - PDF generation
   - Storage upload
   - URL generation
3. 🔨 Create Edge Function `generate-work-report`:
   - Server-side PDF generation
   - Optimize for speed
   - Error handling
4. 🔨 Create `WorkReportEmailService.ts`:
   - Email to customer
   - Email to admin
   - PDF attachment
   - Track delivery
5. 🔨 Create `WorkReportsList.tsx` (Admin):
   - View all werkbonnen
   - Filter by monteur/date/project
   - Download PDF
   - Resend email
6. 🧪 Test PDF generation
7. 🧪 Test email delivery
8. 🧪 Test PDF quality & completeness

**Deliverables:**
- PDF generation system
- Email delivery system
- Admin werkbonnen overview
- Work report storage

---

### **SPRINT 7: Notificaties & Real-time (Week 13)**

**Taken:**
1. 🔨 Setup Push Notifications:
   - Firebase Cloud Messaging (FCM)
   - Capacitor Push plugin
   - Device registration
2. 🔨 Create `NotificationService.ts`:
   - Send push to monteurs
   - Send push to admins
   - Handle click actions
3. 🔨 Create notification templates:
   - Project assigned
   - Planning reminder
   - Project started (admin)
   - Project completed (admin)
   - Customer feedback received
4. 🔨 Create `useNotifications.ts` hook:
   - Subscribe to notifications
   - Handle foreground/background
   - Navigate on click
5. 🔨 Add real-time subscriptions:
   - Planning updates
   - Project status changes
   - New assignments
6. 🧪 Test push notifications
7. 🧪 Test real-time updates

**Deliverables:**
- Push notification system
- Real-time subscriptions
- Notification handling
- FCM setup documentation

---

### **SPRINT 8: Analytics & Reporting (Week 14)**

**Taken:**
1. 🔨 Create `MonteurStatsView.tsx`:
   - Total projects
   - Hours worked
   - Projects by status
   - Customer satisfaction avg
2. 🔨 Create `AdminReportingDashboard.tsx`:
   - Monteur performance
   - Project completion rate
   - Average time per project
   - Material usage trends
   - Revenue by monteur
3. 🔨 Create database views:
   - `monteur_daily_stats`
   - `project_completion_analytics`
   - `material_usage_summary`
4. 🔨 Create `useAnalytics.ts` hook:
   - Fetch stats
   - Date range filtering
   - Export to CSV
5. 🔨 Create charts:
   - Time tracking chart
   - Projects completed chart
   - Satisfaction trend
6. 🧪 Test all analytics
7. 🧪 Verify calculations

**Deliverables:**
- Monteur stats view
- Admin reporting dashboard
- Database analytics views
- Export functionality

---

### **SPRINT 9: Offline Mode & Sync (Week 15)**

**Taken:**
1. 🔨 Setup offline storage:
   - IndexedDB for data
   - Service Worker for caching
   - Capacitor Storage plugin
2. 🔨 Create `useOfflineSync.ts` hook:
   - Queue actions when offline
   - Sync when back online
   - Conflict resolution
3. 🔨 Implement offline features:
   - Cache planning data
   - Cache project data
   - Cache photo uploads
   - Queue material additions
4. 🔨 Create `OfflineBanner.tsx`:
   - Show offline status
   - Pending sync count
   - Manual sync trigger
5. 🔨 Add background sync:
   - Auto-sync on connection
   - Retry failed syncs
6. 🧪 Test offline mode
7. 🧪 Test sync reliability

**Deliverables:**
- Offline functionality
- Sync system
- Offline indicator
- Background sync

---

### **SPRINT 10: Testing & Polish (Week 16)**

**Taken:**
1. 🧪 End-to-end testing:
   - Administrator planning flow
   - Monteur complete workflow
   - Werkbon generation
   - Email/SMS delivery
2. 🐛 Bug fixes
3. ✨ UI/UX polish:
   - Loading states
   - Error messages
   - Success feedback
   - Animations
4. 📝 Documentation:
   - User manuals
   - Admin guide
   - Monteur guide
   - Technical docs
5. 🎓 Training materials:
   - Video tutorials
   - Screenshots
   - FAQ
6. 🚀 Deployment:
   - Production database
   - Mobile app stores
   - Edge functions
7. 🔒 Security audit
8. 📈 Performance optimization

**Deliverables:**
- Fully tested system
- Complete documentation
- Training materials
- Production deployment
- App store submissions

---

## 🧪 TESTING PLAN

### **Unit Tests**
- Database functions
- Hooks logic
- Service functions
- Utility functions

### **Integration Tests**
- Planning creation → Notification sending
- Project start → Time logging
- Project completion → PDF generation → Email sending
- Material tracking → Cost calculation

### **E2E Tests**

#### **Administrator Flow:**
1. Login as admin
2. Open planning kalender
3. Click datum
4. Select "Klant Afspraak"
5. Zoek en selecteer klant
6. Selecteer monteur
7. Vul tijden in
8. Kies notificatie opties
9. Opslaan
10. Verify email ontvangen
11. Verify planning zichtbaar in kalender

#### **Monteur Flow:**
1. Login as monteur (mobile)
2. View today's planning
3. Click "Start Project"
4. Verify timer starts
5. Complete some tasks
6. Add photos (before/during)
7. Scan QR code for materials
8. Add notes
9. Click "Project Afronden"
10. Complete all 7 steps
11. Sign werkbon
12. Verify PDF generated
13. Verify email sent to klant
14. Verify project status = "afgerond"

### **Performance Tests**
- Page load times < 2s
- PDF generation < 5s
- Photo upload < 3s per image
- Notification delivery < 10s

### **Security Tests**
- RLS policies block unauthorized access
- JWT validation
- XSS prevention
- SQL injection prevention
- File upload validation

---

## 📊 SUCCESS METRICS

### **Key Performance Indicators (KPIs)**

1. **Administrator Efficiency:**
   - Time to schedule appointment: < 3 minutes
   - Customer notification delivery rate: > 95%
   - Planning conflicts: < 5%

2. **Monteur Productivity:**
   - Projects completed per day: avg 2-3
   - Time from arrival to project start: < 5 minutes
   - Werkbon completion time: < 10 minutes

3. **System Reliability:**
   - App uptime: > 99.5%
   - Offline sync success rate: > 98%
   - PDF generation success rate: > 99%

4. **Customer Satisfaction:**
   - Email delivery rate: > 95%
   - Average rating: > 4.0/5
   - Complaints reduced by: 50%

---

## 🎯 PRIORITEIT & DEPENDENCIES

### **Must Have (MVP):**
1. Administrator kan klant afspraken plannen ✅
2. Monteur kan projecten starten/stoppen ✅
3. Monteur kan foto's maken tijdens werk ✅
4. Monteur kan project afronden met handtekeningen ✅
5. Werkbon PDF generatie ✅
6. Email verzenden naar klant ✅

### **Should Have:**
1. Material tracking met QR codes
2. Gedetailleerde tijdsregistratie
3. GPS tracking
4. Push notificaties
5. SMS notificaties naar klanten
6. Analytics dashboard

### **Could Have:**
1. Offline mode
2. Multi-monteur teams
3. Klant portal
4. Live monteur tracking
5. Voice notes
6. Automatische facturering

### **Won't Have (This Phase):**
1. Video calls met klant
2. Augmented reality metingen
3. AI-powered task suggestions
4. Blockchain handtekeningen

---

## 📝 NOTES & CONSIDERATIONS

### **Technical Debt:**
- Huidige `planning_items` tabel heeft overlap met `project_completions` - kan geconsolideerd worden
- Mobile app heeft nog geen geïntegreerde update mechanism
- PDF generatie moet server-side voor betere performance

### **Scalability:**
- Consider pagination voor planning items (large datasets)
- Implement photo compression before upload
- Use CDN for static assets in mobile app
- Consider Redis caching voor frequently accessed data

### **Security:**
- Implement rate limiting voor API calls
- Add encryption for sensitive data (signatures)
- Regular security audits
- GDPR compliance voor klant data

### **Future Enhancements:**
- AI-powered scheduling optimization
- Predictive maintenance based op project history
- Integration met externe systemen (ERP, accounting)
- Multi-language support
- Voice commands voor hands-free operation

---

## ✅ COMPLETION CRITERIA

### **System is Complete When:**
1. ✅ Administrator kan klant afspraken plannen met notificaties
2. ✅ Monteur ontvangt push notificatie voor nieuwe planning
3. ✅ Monteur kan inloggen op mobiele app
4. ✅ Monteur ziet zijn planning voor vandaag
5. ✅ Monteur kan project starten met GPS check-in
6. ✅ Monteur kan taken afvinken tijdens werk
7. ✅ Monteur kan foto's maken (voor/tijdens/na)
8. ✅ Monteur kan materialen toevoegen (manual + QR)
9. ✅ Monteur kan project afronden met complete flow
10. ✅ System genereert professionele werkbon PDF
11. ✅ Klant ontvangt werkbon automatisch per email
12. ✅ Administrator ziet completed project in dashboard
13. ✅ Alle data is correct opgeslagen in database
14. ✅ System werkt stabiel onder normale load
15. ✅ Security audit passed
16. ✅ User acceptance testing completed

---

**EINDE VAN MASTER PLAN**

*Document Versie: 1.0*
*Laatst Bijgewerkt: 8 oktober 2025*
*Auteur: AI Assistant*
*Status: Ready for Implementation*

