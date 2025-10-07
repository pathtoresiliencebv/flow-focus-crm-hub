# 📱 MOBIELE APP SPECIFICATIES
## SMANS CRM - Supabase Integratie voor AI App Builder

**Datum:** 7 Oktober 2025  
**Versie:** 1.0  
**Database:** Supabase PostgreSQL  
**Platform:** iOS & Android (React Native / Flutter / Native)

---

## 📋 INHOUDSOPGAVE

1. [App Overzicht](#app-overzicht)
2. [Functionaliteiten](#functionaliteiten)
3. [Database Structuur per Module](#database-structuur-per-module)
4. [Gebruikersrollen & Toegang](#gebruikersrollen--toegang)
5. [Supabase Configuratie](#supabase-configuratie)
6. [API Endpoints & Queries](#api-endpoints--queries)
7. [Realtime Features](#realtime-features)
8. [File Upload & Storage](#file-upload--storage)
9. [Implementatie Checklist](#implementatie-checklist)

---

## 🎯 APP OVERZICHT

### **Doel:**
Mobiele app voor SMANS CRM medewerkers om onderweg toegang te hebben tot:
- **Chat** - Directe communicatie tussen teamleden
- **Projecten** - Projectbeheer en status updates
- **Agenda (Planning)** - Planning en tijdregistratie
- **Bonnetjes** - Foto's uploaden van bonnetjes/facturen

### **Target Users:**
- **Installateurs (Monteurs)** - Primaire gebruikers (onderweg)
- **Verkoper** - Projecten bekijken/aanmaken
- **Administratie** - Bonnetjes goedkeuren
- **Administrator** - Volledige toegang

### **Technische Stack:**
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth (JWT tokens)
- **Storage:** Supabase Storage (foto's, documenten)
- **Realtime:** Supabase Realtime (chat, updates)

---

## 🔧 FUNCTIONALITEITEN

### **Module 1: Chat** 💬
- Direct messaging tussen gebruikers
- Realtime berichten
- Leesbevestigingen
- Gebruikerslijst met online status

### **Module 2: Projecten** 📁
- Projecten lijst (gefilterd op rol)
- Project details bekijken
- Status updaten
- Taken afvinken
- Foto's uploaden (voor/tijdens/na)
- Materialen registreren
- Project afronden met handtekening

### **Module 3: Agenda (Planning)** 📅
- Persoonlijke planning bekijken
- Dagelijkse/wekelijkse view
- Tijdregistratie starten/stoppen
- Planning details

### **Module 4: Bonnetjes** 🧾
- Foto's maken van bonnetjes
- Bonnetje uploaden met details
- Status bekijken (pending/approved/rejected)
- Historiek van bonnetjes

---

## 🗄️ DATABASE STRUCTUUR PER MODULE

---

## 💬 MODULE 1: CHAT

### **Tabel: `direct_messages`**

```sql
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  original_language text NOT NULL DEFAULT 'nl',
  translated_content jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_read boolean DEFAULT false
);
```

### **Velden Uitleg:**

| Veld | Type | Beschrijving |
|------|------|--------------|
| `id` | UUID | Unieke bericht ID |
| `from_user_id` | UUID | Wie het bericht verstuurt |
| `to_user_id` | UUID | Wie het bericht ontvangt |
| `content` | TEXT | Bericht tekst |
| `original_language` | TEXT | Taal van het bericht (nl/en) |
| `translated_content` | JSONB | Vertalingen (optioneel) |
| `created_at` | TIMESTAMPTZ | Wanneer verstuurd |
| `updated_at` | TIMESTAMPTZ | Laatst gewijzigd |
| `is_read` | BOOLEAN | Is gelezen? |

### **Indexes:**
```sql
CREATE INDEX idx_direct_messages_from_user ON direct_messages(from_user_id);
CREATE INDEX idx_direct_messages_to_user ON direct_messages(to_user_id);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(from_user_id, to_user_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);
```

### **RLS Policies:**

**Bekijken:**
```sql
-- Users kunnen alleen berichten zien die ze verstuurden of ontvingen
CREATE POLICY "Users can view their direct messages"
ON direct_messages FOR SELECT
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
```

**Versturen:**
```sql
-- Users kunnen alleen berichten versturen als ze de afzender zijn
CREATE POLICY "Users can send direct messages"
ON direct_messages FOR INSERT
WITH CHECK (from_user_id = auth.uid());
```

**Updaten:**
```sql
-- Users kunnen berichten updaten (bijv. is_read)
CREATE POLICY "Users can update their direct messages"
ON direct_messages FOR UPDATE
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
```

### **Supabase Queries voor Chat:**

#### **1. Conversaties Ophalen:**
```typescript
// Haal alle conversaties op voor de ingelogde gebruiker
const { data: conversations, error } = await supabase
  .from('direct_messages')
  .select(`
    *,
    from_user:profiles!from_user_id(id, full_name, role, email),
    to_user:profiles!to_user_id(id, full_name, role, email)
  `)
  .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
  .order('created_at', { ascending: false });
```

#### **2. Berichten van Specifieke Conversatie:**
```typescript
// Haal alle berichten tussen twee gebruikers
const { data: messages, error } = await supabase
  .from('direct_messages')
  .select('*')
  .or(`and(from_user_id.eq.${userId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${userId})`)
  .order('created_at', { ascending: true });
```

#### **3. Bericht Versturen:**
```typescript
const { data, error } = await supabase
  .from('direct_messages')
  .insert({
    from_user_id: currentUserId,
    to_user_id: recipientId,
    content: messageText,
    original_language: 'nl'
  })
  .select()
  .single();
```

#### **4. Bericht Markeren als Gelezen:**
```typescript
const { error } = await supabase
  .from('direct_messages')
  .update({ is_read: true })
  .eq('id', messageId)
  .eq('to_user_id', currentUserId);
```

#### **5. Ongelezen Berichten Tellen:**
```typescript
const { count, error } = await supabase
  .from('direct_messages')
  .select('*', { count: 'exact', head: true })
  .eq('to_user_id', currentUserId)
  .eq('is_read', false);
```

### **Realtime Subscriptie:**
```typescript
// Luister naar nieuwe berichten
const subscription = supabase
  .channel('direct_messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `to_user_id=eq.${currentUserId}`
    },
    (payload) => {
      console.log('Nieuw bericht ontvangen:', payload.new);
      // Update UI met nieuw bericht
    }
  )
  .subscribe();
```

### **Gebruikerslijst Ophalen:**
```typescript
// Haal alle beschikbare chat gebruikers op
const { data: users, error } = await supabase
  .from('profiles')
  .select('id, full_name, role, email')
  .neq('id', currentUserId)
  .eq('status', 'Actief')
  .order('full_name');
```

---

## 📁 MODULE 2: PROJECTEN

### **Tabel: `projects`**

```sql
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  date date,
  value numeric,
  status text DEFAULT 'te-plannen',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  assigned_user_id uuid REFERENCES auth.users(id),
  quote_id uuid REFERENCES quotes(id),
  project_status text DEFAULT 'te-plannen',
  completion_date date,
  completion_id uuid REFERENCES project_completions(id)
);
```

### **Velden Uitleg:**

| Veld | Type | Beschrijving |
|------|------|--------------|
| `id` | UUID | Unieke project ID |
| `title` | TEXT | Project naam |
| `customer_id` | UUID | Klant referentie |
| `date` | DATE | Project datum |
| `value` | NUMERIC | Project waarde (€) |
| `status` | TEXT | Status (te-plannen, gepland, in-uitvoering, afgerond) |
| `description` | TEXT | Project beschrijving |
| `user_id` | UUID | Wie het project aanmaakte |
| `assigned_user_id` | UUID | Toegewezen monteur |
| `quote_id` | UUID | Gekoppelde offerte |
| `completion_date` | DATE | Afgerond op datum |

### **Gerelateerde Tabellen:**

#### **`project_tasks` - Taken per project**
```sql
CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  block_title text NOT NULL,
  task_description text,
  is_info_block boolean DEFAULT false,
  info_text text,
  is_completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### **`project_receipts` - Bonnetjes per project**
```sql
CREATE TABLE public.project_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  receipt_date date DEFAULT CURRENT_DATE,
  supplier text,
  total_amount numeric(10,2),
  description text,
  receipt_photo_url text NOT NULL,
  category text DEFAULT 'material',
  added_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### **`project_completions` - Project afronden**
```sql
CREATE TABLE public.project_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  installer_id uuid NOT NULL REFERENCES auth.users(id),
  completion_date date NOT NULL,
  work_performed text NOT NULL,
  materials_used text,
  recommendations text,
  notes text,
  customer_satisfaction integer CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  customer_signature text NOT NULL,
  installer_signature text NOT NULL,
  pdf_url text,
  status varchar(50) DEFAULT 'draft',
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### **`completion_photos` - Foto's bij afronding**
```sql
CREATE TABLE public.completion_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id uuid NOT NULL REFERENCES project_completions(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  description text,
  category varchar(50) DEFAULT 'after', -- 'before', 'during', 'after', 'detail', 'overview'
  file_name varchar(255),
  file_size bigint,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

### **RLS Policies voor Projecten:**

**Bekijken (Rol-gebaseerd):**
```sql
CREATE POLICY "Users can view projects based on role"
ON projects FOR SELECT
USING (
  CASE
    -- Administrator en Administratie zien alles
    WHEN get_user_role(auth.uid()) IN ('Administrator', 'Administratie') 
      THEN true
    
    -- Installateur ziet alleen toegewezen projecten
    WHEN get_user_role(auth.uid()) = 'Installateur' 
      THEN (assigned_user_id = auth.uid() OR user_id = auth.uid())
    
    -- Verkoper ziet alleen eigen projecten
    WHEN get_user_role(auth.uid()) = 'Verkoper' 
      THEN user_id = auth.uid()
    
    ELSE false
  END
);
```

**Updaten:**
```sql
CREATE POLICY "Authorized users can update projects"
ON projects FOR UPDATE
USING (
  CASE
    WHEN get_user_role(auth.uid()) IN ('Administrator', 'Administratie') 
      THEN true
    WHEN get_user_role(auth.uid()) = 'Installateur' 
      THEN (assigned_user_id = auth.uid() OR user_id = auth.uid())
    WHEN get_user_role(auth.uid()) = 'Verkoper' 
      THEN user_id = auth.uid()
    ELSE false
  END
);
```

### **Supabase Queries voor Projecten:**

#### **1. Projecten Ophalen (Gefilterd op Rol):**
```typescript
// Voor Installateur - alleen toegewezen projecten
const { data: projects, error } = await supabase
  .from('projects')
  .select(`
    *,
    customer:customers(id, name, email, phone, address),
    assigned_user:profiles!assigned_user_id(id, full_name, email),
    tasks:project_tasks(id, block_title, task_description, is_completed, order_index)
  `)
  .or(`assigned_user_id.eq.${userId},user_id.eq.${userId}`)
  .order('date', { ascending: false });

// Voor Administrator/Administratie - alle projecten
const { data: projects, error } = await supabase
  .from('projects')
  .select(`
    *,
    customer:customers(id, name, email, phone, address),
    assigned_user:profiles!assigned_user_id(id, full_name, email),
    tasks:project_tasks(id, block_title, task_description, is_completed, order_index)
  `)
  .order('date', { ascending: false });
```

#### **2. Project Details:**
```typescript
const { data: project, error } = await supabase
  .from('projects')
  .select(`
    *,
    customer:customers(*),
    assigned_user:profiles!assigned_user_id(*),
    creator:profiles!user_id(*),
    tasks:project_tasks(*),
    receipts:project_receipts(*),
    completion:project_completions(
      *,
      photos:completion_photos(*)
    )
  `)
  .eq('id', projectId)
  .single();
```

#### **3. Project Status Updaten:**
```typescript
const { data, error } = await supabase
  .from('projects')
  .update({ 
    status: 'in-uitvoering',
    updated_at: new Date().toISOString()
  })
  .eq('id', projectId)
  .select()
  .single();
```

#### **4. Taak Afvinken:**
```typescript
const { data, error } = await supabase
  .from('project_tasks')
  .update({ 
    is_completed: true,
    updated_at: new Date().toISOString()
  })
  .eq('id', taskId)
  .select()
  .single();
```

#### **5. Foto Uploaden bij Project:**
```typescript
// Stap 1: Upload foto naar Supabase Storage
const file = /* foto van camera */;
const fileName = `${projectId}/${Date.now()}.jpg`;

const { data: uploadData, error: uploadError } = await supabase.storage
  .from('project-photos')
  .upload(fileName, file, {
    contentType: 'image/jpeg',
    cacheControl: '3600'
  });

// Stap 2: Sla foto URL op in completion_photos
const { data: publicURL } = supabase.storage
  .from('project-photos')
  .getPublicUrl(fileName);

const { data, error } = await supabase
  .from('completion_photos')
  .insert({
    completion_id: completionId,
    photo_url: publicURL.publicUrl,
    category: 'after',
    file_name: fileName
  });
```

#### **6. Project Afronden:**
```typescript
const { data: completion, error } = await supabase
  .from('project_completions')
  .insert({
    project_id: projectId,
    installer_id: currentUserId,
    completion_date: new Date().toISOString().split('T')[0],
    work_performed: workDescription,
    materials_used: materialsText,
    customer_satisfaction: 5,
    customer_signature: customerSignatureBase64,
    installer_signature: installerSignatureBase64,
    status: 'completed'
  })
  .select()
  .single();

// Update project met completion
const { error: updateError } = await supabase
  .from('projects')
  .update({ 
    status: 'afgerond',
    completion_date: new Date().toISOString().split('T')[0],
    completion_id: completion.id
  })
  .eq('id', projectId);
```

---

## 📅 MODULE 3: AGENDA (PLANNING)

### **Tabel: `planning_items`**

```sql
CREATE TABLE public.planning_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  assigned_user_id uuid NOT NULL REFERENCES auth.users(id),
  project_id uuid REFERENCES projects(id),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  status text DEFAULT 'Gepland',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### **Velden Uitleg:**

| Veld | Type | Beschrijving |
|------|------|--------------|
| `id` | UUID | Unieke planning ID |
| `user_id` | UUID | Wie de planning aanmaakte |
| `assigned_user_id` | UUID | Aan wie toegewezen (monteur) |
| `project_id` | UUID | Gekoppeld project (optioneel) |
| `title` | TEXT | Planning titel |
| `description` | TEXT | Beschrijving |
| `start_date` | DATE | Datum |
| `start_time` | TIME | Start tijd |
| `end_time` | TIME | Eind tijd |
| `location` | TEXT | Locatie/adres |
| `status` | TEXT | Status (Gepland, Bezig, Afgerond) |

### **RLS Policies voor Planning:**

```sql
-- Users kunnen hun eigen planning bekijken
CREATE POLICY "Users can view their planning"
ON planning_items FOR SELECT
USING (assigned_user_id = auth.uid() OR user_id = auth.uid());

-- Users kunnen hun planning updaten
CREATE POLICY "Users can update their planning"
ON planning_items FOR UPDATE
USING (assigned_user_id = auth.uid() OR user_id = auth.uid());
```

### **Supabase Queries voor Planning:**

#### **1. Planning Ophalen (Dag/Week/Maand):**
```typescript
// Vandaag
const today = new Date().toISOString().split('T')[0];
const { data: todayPlanning, error } = await supabase
  .from('planning_items')
  .select(`
    *,
    project:projects(id, title, customer_id),
    assigned_user:profiles!assigned_user_id(id, full_name)
  `)
  .eq('assigned_user_id', userId)
  .eq('start_date', today)
  .order('start_time', { ascending: true });

// Deze week
const startOfWeek = /* calculate start of week */;
const endOfWeek = /* calculate end of week */;
const { data: weekPlanning, error } = await supabase
  .from('planning_items')
  .select('*')
  .eq('assigned_user_id', userId)
  .gte('start_date', startOfWeek)
  .lte('start_date', endOfWeek)
  .order('start_date', { ascending: true })
  .order('start_time', { ascending: true });
```

#### **2. Planning Status Updaten:**
```typescript
const { data, error } = await supabase
  .from('planning_items')
  .update({ 
    status: 'Bezig',
    updated_at: new Date().toISOString()
  })
  .eq('id', planningId)
  .select()
  .single();
```

#### **3. Tijdregistratie (Optioneel - als aparte tabel):**
```typescript
// Als je tijdregistratie wilt bijhouden
const { data, error } = await supabase
  .from('time_tracking')
  .insert({
    planning_item_id: planningId,
    user_id: currentUserId,
    start_time: new Date().toISOString(),
    status: 'started'
  });

// Stop tijdregistratie
const { data, error } = await supabase
  .from('time_tracking')
  .update({ 
    end_time: new Date().toISOString(),
    status: 'stopped'
  })
  .eq('id', timeTrackingId);
```

---

## 🧾 MODULE 4: BONNETJES

### **Tabel: `receipts`**

```sql
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  email_from text,
  subject text,
  amount numeric(10,2),
  description text,
  category text,
  receipt_file_url text NOT NULL,
  receipt_file_name text NOT NULL,
  receipt_file_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  email_message_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### **Velden Uitleg:**

| Veld | Type | Beschrijving |
|------|------|--------------|
| `id` | UUID | Unieke bonnetje ID |
| `user_id` | UUID | Wie het bonnetje uploadde |
| `amount` | NUMERIC | Bedrag (€) |
| `description` | TEXT | Beschrijving |
| `category` | TEXT | Categorie (materiaal, gereedschap, etc.) |
| `receipt_file_url` | TEXT | URL naar foto/PDF |
| `receipt_file_name` | TEXT | Bestandsnaam |
| `receipt_file_type` | TEXT | MIME type (image/jpeg, application/pdf) |
| `status` | TEXT | Status (pending, approved, rejected) |
| `approved_by` | UUID | Wie goedkeurde |
| `approved_at` | TIMESTAMPTZ | Wanneer goedgekeurd |
| `rejection_reason` | TEXT | Reden van afwijzing |

### **RLS Policies voor Bonnetjes:**

```sql
-- Users kunnen hun eigen bonnetjes bekijken
-- Administrator en Administratie kunnen alle bonnetjes zien
CREATE POLICY "Users can view receipts"
ON receipts FOR SELECT
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);

-- Users kunnen hun eigen bonnetjes uploaden
CREATE POLICY "Users can create their own receipts"
ON receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins kunnen bonnetjes goedkeuren/afwijzen
CREATE POLICY "Admins can update receipts"
ON receipts FOR UPDATE
USING (get_user_role(auth.uid()) IN ('Administrator', 'Administratie'));

-- Users kunnen hun eigen pending bonnetjes updaten
CREATE POLICY "Users can update their own pending receipts"
ON receipts FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');
```

### **Supabase Queries voor Bonnetjes:**

#### **1. Bonnetjes Ophalen:**
```typescript
// Eigen bonnetjes
const { data: receipts, error } = await supabase
  .from('receipts')
  .select(`
    *,
    user:profiles!user_id(id, full_name, email),
    approver:profiles!approved_by(id, full_name)
  `)
  .eq('user_id', currentUserId)
  .order('created_at', { ascending: false });

// Voor Administrator/Administratie - alle bonnetjes
const { data: allReceipts, error } = await supabase
  .from('receipts')
  .select(`
    *,
    user:profiles!user_id(id, full_name, email),
    approver:profiles!approved_by(id, full_name)
  `)
  .order('created_at', { ascending: false });
```

#### **2. Bonnetje Uploaden:**
```typescript
// Stap 1: Maak foto met camera
const photo = /* foto van camera */;

// Stap 2: Upload naar Supabase Storage
const fileName = `${userId}/${Date.now()}.jpg`;
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('receipts')
  .upload(fileName, photo, {
    contentType: 'image/jpeg',
    cacheControl: '3600'
  });

if (uploadError) throw uploadError;

// Stap 3: Haal public URL op
const { data: publicURL } = supabase.storage
  .from('receipts')
  .getPublicUrl(fileName);

// Stap 4: Sla bonnetje op in database
const { data: receipt, error } = await supabase
  .from('receipts')
  .insert({
    user_id: currentUserId,
    amount: 45.50,
    description: 'Materiaal voor project X',
    category: 'materiaal',
    receipt_file_url: publicURL.publicUrl,
    receipt_file_name: fileName,
    receipt_file_type: 'image/jpeg',
    status: 'pending'
  })
  .select()
  .single();
```

#### **3. Bonnetje Goedkeuren (Admin):**
```typescript
const { data, error } = await supabase
  .from('receipts')
  .update({
    status: 'approved',
    approved_by: currentUserId,
    approved_at: new Date().toISOString()
  })
  .eq('id', receiptId)
  .select()
  .single();
```

#### **4. Bonnetje Afwijzen (Admin):**
```typescript
const { data, error } = await supabase
  .from('receipts')
  .update({
    status: 'rejected',
    approved_by: currentUserId,
    approved_at: new Date().toISOString(),
    rejection_reason: 'Bonnetje onleesbaar, upload opnieuw'
  })
  .eq('id', receiptId)
  .select()
  .single();
```

#### **5. Bonnetje Statistieken:**
```typescript
// Tel bonnetjes per status
const { data: stats, error } = await supabase
  .from('receipts')
  .select('status')
  .eq('user_id', currentUserId);

const pending = stats.filter(r => r.status === 'pending').length;
const approved = stats.filter(r => r.status === 'approved').length;
const rejected = stats.filter(r => r.status === 'rejected').length;
```

---

## 👥 GEBRUIKERSROLLEN & TOEGANG

### **Rol: Installateur (Monteur)** 🔧

**Primaire gebruiker van de mobiele app**

| Module | Toegang | Acties |
|--------|---------|--------|
| **Chat** | ✅ Volledig | Berichten versturen/ontvangen met alle gebruikers |
| **Projecten** | ⚠️ Beperkt | Alleen toegewezen projecten zien, status updaten, taken afvinken, foto's uploaden |
| **Agenda** | ⚠️ Eigen | Alleen eigen planning zien, status updaten |
| **Bonnetjes** | ✅ Volledig | Bonnetjes uploaden, eigen bonnetjes bekijken |

**Queries:**
```typescript
// Projecten - alleen toegewezen
.or(`assigned_user_id.eq.${userId},user_id.eq.${userId}`)

// Planning - alleen eigen
.eq('assigned_user_id', userId)

// Bonnetjes - alleen eigen
.eq('user_id', userId)
```

---

### **Rol: Verkoper** 💼

| Module | Toegang | Acties |
|--------|---------|--------|
| **Chat** | ✅ Volledig | Berichten versturen/ontvangen |
| **Projecten** | ⚠️ Eigen | Alleen eigen projecten zien/bewerken |
| **Agenda** | ⚠️ Eigen | Eigen planning zien |
| **Bonnetjes** | ✅ Volledig | Bonnetjes uploaden, eigen bonnetjes bekijken |

**Queries:**
```typescript
// Projecten - alleen eigen
.eq('user_id', userId)
```

---

### **Rol: Administratie** 📋

| Module | Toegang | Acties |
|--------|---------|--------|
| **Chat** | ✅ Volledig | Berichten versturen/ontvangen |
| **Projecten** | ✅ Alles | Alle projecten zien |
| **Agenda** | ✅ Alles | Alle planning zien |
| **Bonnetjes** | ✅ Alles | Alle bonnetjes zien, goedkeuren, afwijzen |

**Queries:**
```typescript
// Geen filters nodig - alles zichtbaar
.select('*')
```

---

### **Rol: Administrator** 👑

| Module | Toegang | Acties |
|--------|---------|--------|
| **Chat** | ✅ Volledig | Alles |
| **Projecten** | ✅ Alles | Alles |
| **Agenda** | ✅ Alles | Alles |
| **Bonnetjes** | ✅ Alles | Alles |

---

## ⚙️ SUPABASE CONFIGURATIE

### **1. Environment Variables:**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (alleen server-side!)
```

### **2. Supabase Client Initialisatie:**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
```

### **3. Authenticatie:**

#### **Login:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

if (data.session) {
  // User is ingelogd
  const userId = data.session.user.id;
  
  // Haal gebruikersprofiel op
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  console.log('Gebruiker rol:', profile.role);
}
```

#### **Logout:**
```typescript
const { error } = await supabase.auth.signOut();
```

#### **Huidige Gebruiker:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

#### **Session Listener:**
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

---

## 🔄 REALTIME FEATURES

### **1. Chat Realtime:**

```typescript
// Subscribe to new messages
const chatSubscription = supabase
  .channel('direct_messages_channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `to_user_id=eq.${currentUserId}`
    },
    (payload) => {
      console.log('Nieuw bericht:', payload.new);
      // Update UI
      addMessageToChat(payload.new);
      // Toon notificatie
      showNotification('Nieuw bericht ontvangen');
    }
  )
  .subscribe();

// Cleanup
chatSubscription.unsubscribe();
```

### **2. Project Updates Realtime:**

```typescript
// Subscribe to project updates
const projectSubscription = supabase
  .channel('projects_channel')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'projects',
      filter: `assigned_user_id=eq.${currentUserId}`
    },
    (payload) => {
      console.log('Project geüpdatet:', payload.new);
      // Update project in lijst
      updateProjectInList(payload.new);
    }
  )
  .subscribe();
```

### **3. Planning Updates Realtime:**

```typescript
// Subscribe to planning changes
const planningSubscription = supabase
  .channel('planning_channel')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'planning_items',
      filter: `assigned_user_id=eq.${currentUserId}`
    },
    (payload) => {
      console.log('Planning gewijzigd:', payload);
      // Refresh planning
      refreshPlanning();
    }
  )
  .subscribe();
```

### **4. Bonnetje Status Updates:**

```typescript
// Subscribe to receipt status changes
const receiptSubscription = supabase
  .channel('receipts_channel')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'receipts',
      filter: `user_id=eq.${currentUserId}`
    },
    (payload) => {
      const receipt = payload.new;
      if (receipt.status === 'approved') {
        showNotification('Bonnetje goedgekeurd! ✅');
      } else if (receipt.status === 'rejected') {
        showNotification(`Bonnetje afgekeurd: ${receipt.rejection_reason} ❌`);
      }
    }
  )
  .subscribe();
```

---

## 📤 FILE UPLOAD & STORAGE

### **Storage Buckets:**

```
receipts/              → Bonnetjes foto's
  ├── {user_id}/
      ├── 1234567890.jpg
      ├── 1234567891.jpg

project-photos/        → Project foto's
  ├── {project_id}/
      ├── before/
      ├── during/
      ├── after/

project-receipts/      → Project bonnetjes
  ├── {project_id}/
      ├── receipt1.jpg
```

### **Storage Policies:**

```sql
-- Users kunnen hun eigen bonnetjes uploaden
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users kunnen hun eigen bonnetjes bekijken
CREATE POLICY "Users can view receipts they uploaded"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   get_user_role(auth.uid()) IN ('Administrator', 'Administratie'))
);

-- Users kunnen project foto's uploaden voor toegewezen projecten
CREATE POLICY "Users can upload project photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-photos' AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id::text = (storage.foldername(name))[1]
    AND assigned_user_id = auth.uid()
  )
);
```

### **Upload Voorbeeld (React Native):**

```typescript
import * as ImagePicker from 'expo-image-picker';

// Maak foto
const takePhoto = async () => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    uploadPhoto(result.assets[0]);
  }
};

// Upload foto
const uploadPhoto = async (photo) => {
  // Convert to blob
  const response = await fetch(photo.uri);
  const blob = await response.blob();

  // Upload to Supabase
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600'
    });

  if (error) {
    console.error('Upload error:', error);
    return;
  }

  // Get public URL
  const { data: publicURL } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);

  return publicURL.publicUrl;
};
```

---

## ✅ IMPLEMENTATIE CHECKLIST

### **Fase 1: Setup** 📦

- [ ] Supabase project aanmaken
- [ ] Environment variables configureren
- [ ] Supabase client initialiseren
- [ ] Authenticatie implementeren
- [ ] Rol-gebaseerde routing

### **Fase 2: Chat Module** 💬

- [ ] Chat lijst UI
- [ ] Conversatie UI
- [ ] Berichten versturen
- [ ] Berichten ontvangen (realtime)
- [ ] Leesbevestigingen
- [ ] Ongelezen teller
- [ ] Push notificaties voor nieuwe berichten

### **Fase 3: Projecten Module** 📁

- [ ] Projecten lijst (gefilterd op rol)
- [ ] Project detail pagina
- [ ] Status updaten
- [ ] Taken lijst
- [ ] Taken afvinken
- [ ] Foto's maken en uploaden
- [ ] Project afronden flow
- [ ] Handtekening functionaliteit
- [ ] PDF genereren (optioneel)

### **Fase 4: Agenda Module** 📅

- [ ] Dag view
- [ ] Week view
- [ ] Maand view (optioneel)
- [ ] Planning details
- [ ] Status updaten
- [ ] Tijdregistratie (optioneel)
- [ ] Navigatie naar locatie

### **Fase 5: Bonnetjes Module** 🧾

- [ ] Camera functionaliteit
- [ ] Foto uploaden
- [ ] Bonnetje formulier
- [ ] Bonnetjes lijst
- [ ] Status badges (pending/approved/rejected)
- [ ] Bonnetje details bekijken
- [ ] Push notificaties voor status wijzigingen

### **Fase 6: Extra Features** ✨

- [ ] Offline mode (lokale cache)
- [ ] Push notificaties
- [ ] Dark mode
- [ ] Taal instellingen (NL/EN)
- [ ] Profiel pagina
- [ ] Instellingen
- [ ] Error handling
- [ ] Loading states
- [ ] Pull-to-refresh

### **Fase 7: Testing & Deployment** 🚀

- [ ] Unit tests
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Performance optimalisatie
- [ ] App Store deployment (iOS)
- [ ] Play Store deployment (Android)

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBIELE APP                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Chat   │  │ Projecten│  │  Agenda  │  │Bonnetjes │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │              │         │
└───────┼─────────────┼──────────────┼──────────────┼─────────┘
        │             │              │              │
        ▼             ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE AUTH                            │
│                  (JWT Token Validatie)                      │
└─────────────────────────────────────────────────────────────┘
        │             │              │              │
        ▼             ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE POSTGRESQL                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │direct_messages│  │   projects   │  │planning_items│    │
│  │              │  │              │  │              │    │
│  │  RLS: Eigen  │  │ RLS: Rol-    │  │  RLS: Eigen  │    │
│  │  berichten   │  │  gebaseerd   │  │  planning    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   receipts   │  │project_tasks │  │  completion  │    │
│  │              │  │              │  │   _photos    │    │
│  │ RLS: Eigen + │  │ RLS: Project │  │ RLS: Project │    │
│  │    Admin     │  │   toegang    │  │   toegang    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
        │             │              │              │
        ▼             ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE STORAGE                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   receipts/  │  │project-photos│  │project-      │    │
│  │  {user_id}/  │  │ {project_id}/│  │receipts/     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
        │             │              │              │
        ▼             ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE REALTIME                          │
│                                                             │
│  • Chat berichten (INSERT)                                  │
│  • Project updates (UPDATE)                                 │
│  • Planning wijzigingen (*)                                 │
│  • Bonnetje status (UPDATE)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 BEVEILIGING

### **1. Row Level Security (RLS):**
- ✅ Alle tabellen hebben RLS enabled
- ✅ Gebruikers zien alleen hun eigen data (of rol-gebaseerd)
- ✅ Queries worden automatisch gefilterd door database

### **2. Authentication:**
- ✅ JWT tokens voor authenticatie
- ✅ Automatische token refresh
- ✅ Secure session storage

### **3. Storage Security:**
- ✅ Gebruikers kunnen alleen hun eigen files uploaden
- ✅ Gebruikers kunnen alleen toegestane files bekijken
- ✅ File size limits (10MB)

### **4. API Security:**
- ✅ Gebruik ANON key (niet SERVICE_ROLE key!)
- ✅ RLS policies beschermen data
- ✅ Geen directe database toegang

---

## 📞 SUPPORT & DOCUMENTATIE

### **Supabase Documentatie:**
- **Auth:** https://supabase.com/docs/guides/auth
- **Database:** https://supabase.com/docs/guides/database
- **Storage:** https://supabase.com/docs/guides/storage
- **Realtime:** https://supabase.com/docs/guides/realtime

### **React Native / Expo:**
- **Supabase JS:** https://supabase.com/docs/reference/javascript
- **Image Picker:** https://docs.expo.dev/versions/latest/sdk/imagepicker/
- **Camera:** https://docs.expo.dev/versions/latest/sdk/camera/

---

## 🎯 PRIORITEITEN

### **Must Have (MVP):**
1. ✅ Authenticatie
2. ✅ Chat (basis)
3. ✅ Projecten lijst (gefilterd op rol)
4. ✅ Project details
5. ✅ Bonnetjes uploaden
6. ✅ Agenda bekijken

### **Should Have:**
7. ✅ Realtime chat
8. ✅ Project status updaten
9. ✅ Taken afvinken
10. ✅ Foto's uploaden bij projecten
11. ✅ Bonnetje status notificaties

### **Nice to Have:**
12. ⚪ Project afronden met handtekening
13. ⚪ Tijdregistratie
14. ⚪ Offline mode
15. ⚪ PDF genereren
16. ⚪ Dark mode

---

**EINDE DOCUMENT**

Voor vragen of onduidelijkheden, neem contact op met het development team.

**Succes met de app development! 🚀**
