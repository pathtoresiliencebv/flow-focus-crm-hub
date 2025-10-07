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

## 🎨 UI/UX SPECIFICATIES & SCHERMEN

### **Design System:**

#### **Kleurenpalet:**

**Primaire Kleuren:**
```
Brand Rood:     #B91C1C (rgb(185, 28, 28))
Donker Rood:    #991B1B (rgb(153, 27, 27))
Licht Rood:     #DC2626 (rgb(220, 38, 38))
```

**Neutrale Kleuren:**
```
Zwart:          #000000
Donker Grijs:   #1F2937 (rgb(31, 41, 55))
Grijs:          #6B7280 (rgb(107, 114, 128))
Licht Grijs:    #F3F4F6 (rgb(243, 244, 246))
Wit:            #FFFFFF
```

**Status Kleuren:**
```
Succes Groen:   #10B981 (rgb(16, 185, 129))
Waarschuwing:   #F59E0B (rgb(245, 158, 11))
Fout Rood:      #EF4444 (rgb(239, 68, 68))
Info Blauw:     #3B82F6 (rgb(59, 130, 246))
```

**Achtergronden:**
```
App Background: #F9FAFB (rgb(249, 250, 251))
Card Background: #FFFFFF
Overlay:        rgba(0, 0, 0, 0.5)
```

#### **Typografie:**

```
Heading 1:      32px, Bold, #1F2937
Heading 2:      24px, Bold, #1F2937
Heading 3:      20px, SemiBold, #1F2937
Body Large:     16px, Regular, #1F2937
Body:           14px, Regular, #374151
Body Small:     12px, Regular, #6B7280
Caption:        10px, Regular, #9CA3AF

Font Family:    System Default (San Francisco iOS, Roboto Android)
```

#### **Spacing:**

```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
xxl: 48px
```

#### **Border Radius:**

```
Small:  4px
Medium: 8px
Large:  12px
Round:  999px (volledig rond)
```

#### **Shadows:**

```
Small:  0 1px 2px rgba(0, 0, 0, 0.05)
Medium: 0 4px 6px rgba(0, 0, 0, 0.1)
Large:  0 10px 15px rgba(0, 0, 0, 0.1)
```

---

## 📱 SCHERMEN OVERZICHT

### **Navigatie Structuur:**

```
┌─────────────────────────────────────────┐
│         STICKY BOTTOM NAVIGATION         │
│  [Chat] [Projecten] [Agenda] [Bonnetjes]│
└─────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATIE SCHERMEN

### **1. Login Scherm**
**Voor:** Alle gebruikers (niet ingelogd)

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│              [SMANS Logo]               │
│                                         │
│         Welkom bij SMANS CRM            │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Email                             │  │
│  │ [user@example.com            ]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Wachtwoord                        │  │
│  │ [••••••••••••            ] [👁]   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [ Wachtwoord vergeten? ]               │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │        INLOGGEN                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Achtergrond: Wit (#FFFFFF)
- Logo: Brand Rood (#B91C1C)
- Input borders: Licht Grijs (#E5E7EB)
- Button: Brand Rood (#B91C1C) met witte tekst
- Links: Brand Rood (#B91C1C)

**Componenten:**
- Logo (centered, 80x80px)
- Email input field
- Password input field met show/hide toggle
- "Wachtwoord vergeten?" link
- Login button (full width, 48px height)
- Error message area (rood, indien fout)

---

### **2. Wachtwoord Vergeten Scherm**
**Voor:** Alle gebruikers

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←]  Wachtwoord Vergeten               │
│                                         │
│  Voer je email adres in en we sturen   │
│  je een link om je wachtwoord te       │
│  resetten.                              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Email                             │  │
│  │ [user@example.com            ]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     VERSTUUR RESET LINK           │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 💬 CHAT MODULE SCHERMEN

### **3. Chat Overzicht Scherm**
**Voor:** Alle gebruikers (Installateur, Verkoper, Administratie, Administrator)

**Layout:**
```
┌─────────────────────────────────────────┐
│  Chat                          [🔍]     │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Jan de Vries         [2] 10:30│   │
│  │ Ik ben onderweg naar...          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Marie Smit               09:15│   │
│  │ Project is afgerond ✓            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Piet Jansen              08:45│   │
│  │ Wanneer begin je vandaag?        │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Header: Wit met Brand Rood accent
- Achtergrond: Licht Grijs (#F9FAFB)
- Chat cards: Wit (#FFFFFF) met shadow
- Ongelezen badge: Brand Rood (#B91C1C) met witte tekst
- Tijd: Grijs (#6B7280)
- Preview tekst: Donker Grijs (#374151)

**Componenten:**
- Header met titel "Chat" en zoek icoon
- Scrollable lijst met chat conversaties
- Per conversatie:
  - Avatar (cirkel, 48x48px)
  - Naam (bold, 16px)
  - Laatste bericht preview (14px, max 2 regels)
  - Tijd (12px, rechts)
  - Ongelezen badge (indien ongelezen berichten)
- Sticky bottom navigation

**Interacties:**
- Tap op conversatie → Chat Detail Scherm
- Pull-to-refresh voor nieuwe berichten
- Swipe left voor delete/archive (optioneel)

---

### **4. Chat Detail Scherm**
**Voor:** Alle gebruikers

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Jan de Vries          [⋮]          │
│      Installateur • Online              │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────┐                │
│  │ Hallo! Hoe gaat het?│  09:00         │
│  └─────────────────────┘                │
│                                         │
│                ┌─────────────────────┐  │
│         09:15  │ Goed! Ben onderweg  │  │
│                │ naar het project    │  │
│                └─────────────────────┘  │
│                                         │
│  ┌─────────────────────┐                │
│  │ Perfect, tot zo!    │  09:16         │
│  └─────────────────────┘                │
│                                         │
├─────────────────────────────────────────┤
│  [📎] [Typ een bericht...     ] [➤]    │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Header: Wit met Brand Rood accent
- Achtergrond: Licht Grijs (#F9FAFB)
- Eigen berichten: Brand Rood (#B91C1C) met witte tekst
- Ontvangen berichten: Wit (#FFFFFF) met donkere tekst
- Tijd: Grijs (#6B7280)
- Input field: Wit met border

**Componenten:**
- Header met:
  - Terug knop
  - Naam + rol + online status
  - Menu knop (3 dots)
- Chat berichten area (scrollable, reversed)
- Per bericht:
  - Bubble (links of rechts aligned)
  - Tekst
  - Tijd (klein, onder bubble)
  - Gelezen indicator (✓✓ voor eigen berichten)
- Input area (sticky bottom):
  - Attachment button
  - Text input field
  - Send button

**Interacties:**
- Scroll naar boven voor oudere berichten
- Tap op attachment → file picker
- Type bericht → enable send button
- Tap send → verstuur bericht
- Long press op bericht → copy/delete menu

---

### **5. Chat Gebruikerslijst Scherm**
**Voor:** Alle gebruikers (voor nieuwe chat starten)

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Nieuwe Chat              [🔍]      │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Jan de Vries                 │   │
│  │    Installateur          [●]    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Marie Smit                   │   │
│  │    Verkoper              [●]    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Piet Jansen                  │   │
│  │    Administrator         [○]    │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Online status: Groen (#10B981)
- Offline status: Grijs (#9CA3AF)
- Rol badge: Licht Grijs achtergrond

---

## 📁 PROJECTEN MODULE SCHERMEN

### **6. Projecten Overzicht Scherm**
**Voor:** Installateur (toegewezen), Verkoper (eigen), Administratie (alles), Administrator (alles)

**Layout:**
```
┌─────────────────────────────────────────┐
│  Projecten                     [🔍] [⚙]│
├─────────────────────────────────────────┤
│  Filters: [Alle ▾] [Status ▾]          │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Zonnepanelen installatie        │   │
│  │ Kerkstraat 45, Amsterdam        │   │
│  │                                 │   │
│  │ 👤 Jan de Vries                 │   │
│  │ 📅 15 okt 2025 • 09:00-17:00    │   │
│  │ [IN UITVOERING]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Warmtepomp plaatsing            │   │
│  │ Dorpsstraat 12, Utrecht         │   │
│  │                                 │   │
│  │ 👤 Marie Smit                   │   │
│  │ 📅 16 okt 2025 • 08:00-16:00    │   │
│  │ [GEPLAND]                       │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Status badges:
  - Te Plannen: Grijs (#6B7280)
  - Gepland: Blauw (#3B82F6)
  - In Uitvoering: Oranje (#F59E0B)
  - Afgerond: Groen (#10B981)
- Project cards: Wit met shadow
- Icons: Grijs (#6B7280)

**Componenten:**
- Header met filters en zoek
- Filter chips (scrollable horizontal)
- Scrollable project lijst
- Per project card:
  - Project titel (bold, 16px)
  - Adres (14px, grijs)
  - Toegewezen persoon met avatar
  - Datum en tijd
  - Status badge
- Sticky bottom navigation

**Interacties:**
- Tap op project → Project Detail Scherm
- Pull-to-refresh
- Filter selectie

---

### **7. Project Detail Scherm**
**Voor:** Installateur (toegewezen), Verkoper (eigen), Administratie (alles), Administrator (alles)

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Project Details           [⋮]      │
├─────────────────────────────────────────┤
│                                         │
│  Zonnepanelen installatie               │
│  [IN UITVOERING]                        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📍 Locatie                      │   │
│  │    Kerkstraat 45, Amsterdam     │   │
│  │    [Navigeer →]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Klant                        │   │
│  │    Jan Pietersen                │   │
│  │    📞 06-12345678               │   │
│  │    ✉️ jan@example.com           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📅 Planning                     │   │
│  │    15 oktober 2025              │   │
│  │    09:00 - 17:00                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ✓ Taken (3/8 voltooid)         │   │
│  │                                 │   │
│  │  ☑ Materiaal voorbereiden       │   │
│  │  ☑ Dak inspecteren              │   │
│  │  ☑ Panelen plaatsen             │   │
│  │  ☐ Bedrading aansluiten         │   │
│  │  ☐ Omvormer installeren         │   │
│  │  ...meer                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📸 Foto's                       │   │
│  │  [+] [img] [img] [img]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      PROJECT AFRONDEN             │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Section cards: Wit met border
- Icons: Brand Rood (#B91C1C)
- Completed tasks: Groen checkmark
- Incomplete tasks: Grijs checkbox
- "Project Afronden" button: Brand Rood (#B91C1C)

**Componenten:**
- Header met terug en menu
- Project titel en status badge
- Info sections:
  - Locatie (met navigatie knop)
  - Klant info (met tap-to-call, tap-to-email)
  - Planning
  - Taken lijst (met checkboxes)
  - Foto's grid (met add button)
- "Project Afronden" button (sticky of scroll)
- Bottom navigation

**Interacties:**
- Tap op taak → toggle completed
- Tap op "Navigeer" → open maps app
- Tap op telefoon → bel klant
- Tap op email → email klant
- Tap op foto → view full screen
- Tap op [+] → camera/gallery picker
- Tap op "Project Afronden" → Afronden Flow

---

### **8. Taken Detail Scherm**
**Voor:** Installateur, Verkoper

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Taak Details                       │
├─────────────────────────────────────────┤
│                                         │
│  ☐ Bedrading aansluiten                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Beschrijving                    │   │
│  │                                 │   │
│  │ Alle bedrading van de panelen  │   │
│  │ aansluiten op de omvormer.     │   │
│  │ Let op de juiste polariteit.   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Notities (optioneel)            │   │
│  │ [Voeg notitie toe...        ]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      MARKEER ALS VOLTOOID         │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

### **9. Foto's Bekijken Scherm**
**Voor:** Installateur, Verkoper, Administratie, Administrator

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←]                              [⋮]   │
│                                         │
│                                         │
│           [    FOTO FULL SCREEN    ]    │
│                                         │
│                                         │
│  ◀                                   ▶  │
│                                         │
│  Voor • 15 okt 2025 10:30               │
│                                         │
└─────────────────────────────────────────┘
```

**Componenten:**
- Full screen foto
- Swipe left/right voor volgende/vorige
- Categorie label (Voor/Tijdens/Na)
- Datum/tijd
- Menu voor delete/share

---

### **10. Project Afronden Scherm**
**Voor:** Installateur (alleen toegewezen projecten)

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Project Afronden                   │
├─────────────────────────────────────────┤
│                                         │
│  Stap 1 van 4                           │
│  [████████░░░░░░░░░░░░]                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Uitgevoerd Werk                 │   │
│  │                                 │   │
│  │ [Beschrijf het uitgevoerde      │   │
│  │  werk in detail...              │   │
│  │                                 │   │
│  │                                 │   │
│  │                              ]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Gebruikte Materialen            │   │
│  │                                 │   │
│  │ [Lijst van gebruikte            │   │
│  │  materialen...                  │   │
│  │                              ]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │           VOLGENDE                │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Stappen:**
1. Werk beschrijving + materialen
2. Aanbevelingen + notities
3. Klanttevredenheid (1-5 sterren)
4. Handtekeningen (klant + monteur)

**Kleuren:**
- Progress bar: Brand Rood (#B91C1C)
- Input fields: Wit met border
- Next button: Brand Rood (#B91C1C)

---

### **11. Handtekening Scherm**
**Voor:** Installateur

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Handtekening                       │
├─────────────────────────────────────────┤
│                                         │
│  Klant Handtekening                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  │     [Teken hier met vinger]     │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [WISSEN]                               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │          BEVESTIGEN               │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Componenten:**
- Canvas voor handtekening (wit met border)
- Wissen knop
- Bevestigen knop
- Preview van handtekening

---

## 📅 AGENDA MODULE SCHERMEN

### **12. Agenda Overzicht Scherm**
**Voor:** Installateur (eigen), Verkoper (eigen), Administratie (alles), Administrator (alles)

**Layout:**
```
┌─────────────────────────────────────────┐
│  Agenda                    [📅] [⚙]     │
├─────────────────────────────────────────┤
│  [◀] Oktober 2025 [▶]                   │
│  [Dag] [Week] [Maand]                   │
├─────────────────────────────────────────�────┤
│                                         │
│  Vandaag - 15 oktober 2025              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 09:00 - 17:00                   │   │
│  │ Zonnepanelen installatie        │   │
│  │ 📍 Kerkstraat 45, Amsterdam     │   │
│  │ [IN UITVOERING]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Morgen - 16 oktober 2025               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 08:00 - 16:00                   │   │
│  │ Warmtepomp plaatsing            │   │
│  │ 📍 Dorpsstraat 12, Utrecht      │   │
│  │ [GEPLAND]                       │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Header: Wit met Brand Rood accent
- View toggles: Brand Rood voor actief, grijs voor inactief
- Planning cards: Wit met shadow
- Vandaag label: Brand Rood (#B91C1C)
- Morgen label: Grijs (#6B7280)

**Componenten:**
- Header met maand navigatie
- View toggle (Dag/Week/Maand)
- Scrollable planning lijst
- Per planning item:
  - Tijd range
  - Titel
  - Locatie
  - Status badge
- Bottom navigation

**Interacties:**
- Tap op planning → Planning Detail Scherm
- Swipe left/right voor vorige/volgende dag
- Toggle tussen Dag/Week/Maand view

---

### **13. Planning Detail Scherm**
**Voor:** Alle gebruikers

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Planning Details          [⋮]      │
├─────────────────────────────────────────┤
│                                         │
│  Zonnepanelen installatie               │
│  [IN UITVOERING]                        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📅 Datum & Tijd                 │   │
│  │    15 oktober 2025              │   │
│  │    09:00 - 17:00 (8 uur)        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📍 Locatie                      │   │
│  │    Kerkstraat 45, Amsterdam     │   │
│  │    [Navigeer →]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📝 Beschrijving                 │   │
│  │    Installatie van 12 zonne-    │   │
│  │    panelen op schuin dak.       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔗 Gekoppeld Project            │   │
│  │    [Bekijk Project →]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      STATUS WIJZIGEN              │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

**Componenten:**
- Planning info sections
- Navigatie naar locatie
- Link naar gekoppeld project
- Status wijzigen button
- Bottom navigation

---

### **14. Week View Scherm**
**Voor:** Alle gebruikers

**Layout:**
```
┌─────────────────────────────────────────┐
│  Agenda                    [📅] [⚙]     │
├─────────────────────────────────────────┤
│  [◀] Week 42 • 2025 [▶]                 │
│  [Dag] [Week] [Maand]                   │
├─────────────────────────────────────────┤
│                                         │
│  Ma 14 okt                              │
│  ┌─────────────────────────────────┐   │
│  │ 09:00 Project A                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Di 15 okt                              │
│  ┌─────────────────────────────────┐   │
│  │ 09:00 Project B                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 14:00 Project C                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Wo 16 okt                              │
│  ┌─────────────────────────────────┐   │
│  │ 08:00 Project D                 │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

---

## 🧾 BONNETJES MODULE SCHERMEN

### **15. Bonnetjes Overzicht Scherm**
**Voor:** Alle gebruikers (Installateur, Verkoper, Administratie, Administrator)

**Layout:**
```
┌─────────────────────────────────────────┐
│  Bonnetjes                     [+]      │
├─────────────────────────────────────────┤
│  [Alle] [In behandeling] [Goedgekeurd] │
│  [Afgekeurd]                            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [📷]  Bouwmarkt XYZ             │   │
│  │       € 45,50                   │   │
│  │       Materiaal • 14 okt 2025   │   │
│  │       [IN BEHANDELING]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [📷]  Gereedschap BV            │   │
│  │       € 125,00                  │   │
│  │       Gereedschap • 13 okt 2025 │   │
│  │       [✓ GOEDGEKEURD]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [📷]  Tankstation               │   │
│  │       € 65,00                   │   │
│  │       Brandstof • 12 okt 2025   │   │
│  │       [✗ AFGEKEURD]             │   │
│  │       Reden: Onleesbaar         │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

**Kleuren:**
- [+] button: Brand Rood (#B91C1C), floating action button
- Status badges:
  - In Behandeling: Oranje (#F59E0B)
  - Goedgekeurd: Groen (#10B981)
  - Afgekeurd: Rood (#EF4444)
- Bonnetje cards: Wit met shadow
- Thumbnail: Grijs border

**Componenten:**
- Header met "Nieuw Bonnetje" button ([+])
- Filter tabs (scrollable horizontal)
- Scrollable bonnetjes lijst
- Per bonnetje card:
  - Thumbnail (80x80px)
  - Leverancier naam
  - Bedrag (bold, groot)
  - Categorie + datum
  - Status badge
  - Afwijzing reden (indien afgekeurd)
- Floating Action Button ([+])
- Bottom navigation

**Interacties:**
- Tap op [+] → Bonnetje Toevoegen Scherm
- Tap op bonnetje → Bonnetje Detail Scherm
- Pull-to-refresh
- Filter selectie

---

### **16. Bonnetje Toevoegen Scherm**
**Voor:** Alle gebruikers

**Layout:**
```
┌─────────────────────────────────────────┐
│  [×] Nieuw Bonnetje                     │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  │      [📷 MAAK FOTO]             │   │
│  │                                 │   │
│  │      of                         │   │
│  │                                 │   │
│  │      [📁 KIES UIT GALERIJ]      │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Bedrag *                        │   │
│  │ € [45,50                    ]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Leverancier                     │   │
│  │ [Bouwmarkt XYZ              ]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Categorie *                     │   │
│  │ [Materiaal              ▾]      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Beschrijving                    │   │
│  │ [Materiaal voor project X   ]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │         BONNETJE UPLOADEN         │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Camera/Gallery buttons: Licht grijs achtergrond met iconen
- Required fields (*): Rood asterisk
- Upload button: Brand Rood (#B91C1C)
- Input fields: Wit met border

**Componenten:**
- Close button (×)
- Photo capture/select area
- Form fields:
  - Bedrag (number input, required)
  - Leverancier (text input)
  - Categorie (dropdown, required)
  - Beschrijving (textarea)
- Upload button
- Validation errors (rood)

**Categorieën:**
- Materiaal
- Gereedschap
- Brandstof
- Parkeren
- Overig

**Interacties:**
- Tap op "Maak Foto" → open camera
- Tap op "Kies uit Galerij" → open gallery
- Fill form
- Tap "Uploaden" → validate & upload
- Show success message
- Return to overzicht

---

### **17. Bonnetje Detail Scherm**
**Voor:** Alle gebruikers

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Bonnetje Details          [⋮]      │
├─────────────────────────────────────────┤
│                                         │
│  [        FOTO PREVIEW         ]        │
│  [Tap om te vergroten]                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Bedrag                          │   │
│  │ € 45,50                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Leverancier                     │   │
│  │ Bouwmarkt XYZ                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Categorie                       │   │
│  │ Materiaal                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Beschrijving                    │   │
│  │ Materiaal voor project X        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Status                          │   │
│  │ [IN BEHANDELING]                │   │
│  │ Ingediend op: 14 okt 2025 10:30 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  <!-- Voor Administratie/Administrator -->
│  ┌───────────────────────────────────┐ │
│  │      [✓ GOEDKEUREN]               │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │      [✗ AFKEUREN]                 │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [💬] [📁] [📅] [🧾]                     │
└─────────────────────────────────────────┘
```

**Kleuren:**
- Foto preview: Grijs border, tap to zoom
- Info sections: Wit met border
- Goedkeuren button: Groen (#10B981)
- Afkeuren button: Rood (#EF4444)

**Componenten:**
- Foto preview (tap to full screen)
- Info sections (read-only)
- Status badge
- Actie buttons (alleen voor Administratie/Administrator):
  - Goedkeuren
  - Afkeuren

**Interacties:**
- Tap op foto → full screen view
- Tap "Goedkeuren" → confirm dialog → update status
- Tap "Afkeuren" → reden dialog → update status
- Menu: Delete (alleen eigen bonnetjes, pending status)

---

### **18. Bonnetje Afkeuren Dialog**
**Voor:** Administratie, Administrator

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Bonnetje Afkeuren               │   │
│  │                                 │   │
│  │ Geef een reden op waarom dit    │   │
│  │ bonnetje wordt afgekeurd:       │   │
│  │                                 │   │
│  │ ┌─────────────────────────────┐ │   │
│  │ │ Bonnetje is onleesbaar,     │ │   │
│  │ │ upload opnieuw met betere   │ │   │
│  │ │ kwaliteit                   │ │   │
│  │ └─────────────────────────────┘ │   │
│  │                                 │   │
│  │ [ANNULEREN]  [AFKEUREN]         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## ⚙️ INSTELLINGEN & PROFIEL SCHERMEN

### **19. Profiel Scherm**
**Voor:** Alle gebruikers

**Layout:**
```
┌─────────────────────────────────────────┐
│  [←] Profiel                            │
├─────────────────────────────────────────┤
│                                         │
│        ┌─────────┐                      │
│        │   👤    │                      │
│        └─────────┘                      │
│                                         │
│     Jan de Vries                        │
│     Installateur                        │
│     jan@smans.nl                        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📧 Email                        │   │
│  │    jan@smans.nl                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📞 Telefoon                     │   │
│  │    06-12345678                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🏢 Rol                          │   │
│  │    Installateur                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔔 Notificaties                 │   │
│  │    [●] Aan                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🌙 Dark Mode                    │   │
│  │    [○] Uit                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │         UITLOGGEN                 │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Componenten:**
- Avatar (cirkel, 120x120px)
- Naam, rol, email
- Info sections
- Settings toggles
- Uitloggen button (rood)

---

## 🎯 STICKY BOTTOM NAVIGATION

### **Bottom Navigation Bar (Altijd Zichtbaar)**

**Layout:**
```
┌─────────────────────────────────────────┐
│ [💬]      [📁]      [📅]      [🧾]      │
│ Chat    Projecten  Agenda   Bonnetjes   │
└─────────────────────────────────────────┘
```

**Specificaties:**
- **Hoogte:** 60px (iOS), 56px (Android)
- **Achtergrond:** Wit (#FFFFFF)
- **Shadow:** 0 -2px 10px rgba(0, 0, 0, 0.1)
- **Position:** Fixed bottom, altijd zichtbaar
- **Safe Area:** Respect iOS safe area (notch)

**Items:**
```
1. Chat (💬)
   - Actief: Brand Rood (#B91C1C)
   - Inactief: Grijs (#9CA3AF)
   - Badge: Rood met wit nummer (ongelezen)

2. Projecten (📁)
   - Actief: Brand Rood (#B91C1C)
   - Inactief: Grijs (#9CA3AF)

3. Agenda (📅)
   - Actief: Brand Rood (#B91C1C)
   - Inactief: Grijs (#9CA3AF)
   - Badge: Rood met wit nummer (vandaag items)

4. Bonnetjes (🧾)
   - Actief: Brand Rood (#B91C1C)
   - Inactief: Grijs (#9CA3AF)
   - Badge: Oranje met wit nummer (in behandeling)
```

**Interacties:**
- Tap op item → navigeer naar module
- Actief item heeft Brand Rood kleur
- Smooth transition tussen schermen
- Badge voor notificaties/counts

**Gedrag:**
- Blijft altijd onderaan scherm
- Scrollt NIET mee met content
- Blijft zichtbaar bij keyboard open (iOS)
- Verbergt bij keyboard open (Android, optioneel)

---

## 🎨 COMPONENT LIBRARY

### **Buttons:**

**Primary Button:**
```
Achtergrond: Brand Rood (#B91C1C)
Tekst: Wit (#FFFFFF)
Font: 16px, SemiBold
Height: 48px
Border Radius: 8px
Shadow: 0 2px 4px rgba(185, 28, 28, 0.2)
```

**Secondary Button:**
```
Achtergrond: Wit (#FFFFFF)
Tekst: Brand Rood (#B91C1C)
Border: 2px solid Brand Rood
Font: 16px, SemiBold
Height: 48px
Border Radius: 8px
```

**Disabled Button:**
```
Achtergrond: Licht Grijs (#E5E7EB)
Tekst: Grijs (#9CA3AF)
```

### **Input Fields:**

```
Achtergrond: Wit (#FFFFFF)
Border: 1px solid Licht Grijs (#E5E7EB)
Border Radius: 8px
Height: 48px
Padding: 12px 16px
Font: 16px, Regular
Placeholder: Grijs (#9CA3AF)
Focus Border: Brand Rood (#B91C1C)
Error Border: Rood (#EF4444)
```

### **Cards:**

```
Achtergrond: Wit (#FFFFFF)
Border Radius: 12px
Shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
Padding: 16px
Margin: 8px (tussen cards)
```

### **Status Badges:**

```
Height: 24px
Border Radius: 12px (volledig rond)
Padding: 4px 12px
Font: 12px, SemiBold
```

**Kleuren per status:**
- Te Plannen: Grijs bg (#F3F4F6), Donker Grijs tekst (#374151)
- Gepland: Blauw bg (#DBEAFE), Blauw tekst (#1E40AF)
- In Uitvoering: Oranje bg (#FEF3C7), Oranje tekst (#B45309)
- Afgerond: Groen bg (#D1FAE5), Groen tekst (#065F46)

### **Avatars:**

```
Size: 40px (lijst), 48px (detail), 120px (profiel)
Shape: Cirkel
Border: 2px solid Wit (voor contrast)
Placeholder: Initialen op Brand Rood achtergrond
```

### **Icons:**

```
Size: 20px (small), 24px (medium), 32px (large)
Stroke Width: 2px
Color: Grijs (#6B7280) default, Brand Rood (#B91C1C) actief
```

---

## 📐 LAYOUT GUIDELINES

### **Spacing:**
- Screen padding: 16px (links/rechts)
- Section spacing: 24px (tussen secties)
- Element spacing: 8px (tussen elementen)
- Card spacing: 8px (tussen cards in lijst)

### **Typography Scale:**
```
H1: 32px / 40px line-height / Bold
H2: 24px / 32px line-height / Bold
H3: 20px / 28px line-height / SemiBold
Body Large: 16px / 24px line-height / Regular
Body: 14px / 20px line-height / Regular
Caption: 12px / 16px line-height / Regular
Small: 10px / 14px line-height / Regular
```

### **Touch Targets:**
- Minimum: 44x44px (iOS), 48x48px (Android)
- Buttons: 48px height
- List items: 56px minimum height
- Icons: 24x24px met 44x44px touch area

---

## 🔔 NOTIFICATIES & FEEDBACK

### **Push Notificaties:**

**Nieuwe Chat Bericht:**
```
Titel: Nieuw bericht van [Naam]
Body: [Preview van bericht]
Actie: Open chat conversatie
```

**Bonnetje Status:**
```
Titel: Bonnetje goedgekeurd ✓
Body: Je bonnetje van €45,50 is goedgekeurd
Actie: Open bonnetje detail
```

**Project Update:**
```
Titel: Project toegewezen
Body: Je bent toegewezen aan "Zonnepanelen installatie"
Actie: Open project detail
```

### **In-App Feedback:**

**Toast Messages:**
```
Achtergrond: Donker Grijs (#1F2937) met 90% opacity
Tekst: Wit (#FFFFFF)
Duration: 3 seconden
Position: Bottom (boven navigation)
Border Radius: 8px
```

**Loading States:**
```
Spinner: Brand Rood (#B91C1C)
Skeleton: Licht Grijs (#F3F4F6) met shimmer effect
```

**Error States:**
```
Icon: Rood (#EF4444)
Tekst: Donker Grijs (#374151)
Achtergrond: Licht Rood (#FEE2E2)
```

---

## 🎬 ANIMATIES & TRANSITIONS

### **Page Transitions:**
```
Duration: 300ms
Easing: ease-in-out
Type: Slide (iOS), Fade (Android)
```

### **Button Press:**
```
Scale: 0.95
Duration: 100ms
Easing: ease-out
```

### **Loading:**
```
Spinner: Rotate 360deg
Duration: 1000ms
Easing: linear
Loop: infinite
```

### **List Items:**
```
Fade In: opacity 0 → 1
Duration: 200ms
Stagger: 50ms tussen items
```

---

## 📱 RESPONSIVE DESIGN

### **Breakpoints:**
```
Small Phone: < 375px
Phone: 375px - 414px
Large Phone: 414px - 480px
Tablet: > 480px
```

### **Adaptieve Layout:**
- Single column op phones
- Two column op tablets (landscape)
- Grotere touch targets op tablets
- Meer whitespace op grotere schermen

---

## ♿ ACCESSIBILITY

### **Requirements:**
- ✅ Minimum contrast ratio 4.5:1
- ✅ Touch targets minimum 44x44px
- ✅ Screen reader support
- ✅ Dynamic type support
- ✅ VoiceOver/TalkBack labels
- ✅ Keyboard navigation (tablets)

### **Labels:**
```
Buttons: Duidelijke actie labels
Icons: Alt text/aria-labels
Images: Descriptive labels
Forms: Label voor elk veld
```

---

## 🎯 GEBRUIKERSROLLEN PER SCHERM

### **Installateur (Monteur)** 🔧
**Primaire gebruiker - Onderweg**

**Toegang tot:**
- ✅ Chat (alles)
- ✅ Projecten (alleen toegewezen)
- ✅ Agenda (alleen eigen)
- ✅ Bonnetjes (eigen uploaden + bekijken)
- ✅ Profiel

**Schermen:**
1. Login
2. Chat Overzicht
3. Chat Detail
4. Chat Gebruikerslijst
5. Projecten Overzicht (gefilterd)
6. Project Detail (alleen toegewezen)
7. Taken Detail
8. Foto's Bekijken
9. Project Afronden (alle stappen)
10. Handtekening
11. Agenda Overzicht (eigen)
12. Planning Detail
13. Bonnetjes Overzicht (eigen)
14. Bonnetje Toevoegen
15. Bonnetje Detail (geen goedkeuren)
16. Profiel

---

### **Verkoper** 💼
**Kantoor + Onderweg**

**Toegang tot:**
- ✅ Chat (alles)
- ✅ Projecten (alleen eigen)
- ✅ Agenda (alleen eigen)
- ✅ Bonnetjes (eigen uploaden + bekijken)
- ✅ Profiel

**Schermen:**
1. Login
2. Chat (alle schermen)
3. Projecten Overzicht (gefilterd op eigen)
4. Project Detail (alleen eigen)
5. Taken Detail
6. Foto's Bekijken
7. Agenda Overzicht (eigen)
8. Planning Detail
9. Bonnetjes Overzicht (eigen)
10. Bonnetje Toevoegen
11. Bonnetje Detail (geen goedkeuren)
12. Profiel

---

### **Administratie** 📋
**Kantoor - Financieel**

**Toegang tot:**
- ✅ Chat (alles)
- ✅ Projecten (alles bekijken)
- ✅ Agenda (alles bekijken)
- ✅ Bonnetjes (alles + goedkeuren/afkeuren)
- ✅ Profiel

**Schermen:**
1. Login
2. Chat (alle schermen)
3. Projecten Overzicht (alles)
4. Project Detail (alles, read-only)
5. Foto's Bekijken
6. Agenda Overzicht (alles)
7. Planning Detail
8. Bonnetjes Overzicht (alles)
9. Bonnetje Detail (met goedkeuren/afkeuren)
10. Bonnetje Afkeuren Dialog
11. Profiel

---

### **Administrator** 👑
**Volledige toegang**

**Toegang tot:**
- ✅ Alles

**Schermen:**
- Alle schermen beschikbaar
- Volledige CRUD rechten
- Alle filters beschikbaar

---

## 🎨 DESIGN ASSETS CHECKLIST

### **Voor Designer:**

**Logo's:**
- [ ] App icon (1024x1024px)
- [ ] Logo full (SVG + PNG)
- [ ] Logo collapsed (voor kleine ruimtes)
- [ ] Splash screen logo

**Icons:**
- [ ] Tab bar icons (actief + inactief)
- [ ] Navigation icons
- [ ] Status icons
- [ ] Action icons
- [ ] Category icons

**Illustraties:**
- [ ] Empty states (geen data)
- [ ] Error states
- [ ] Success states
- [ ] Onboarding (optioneel)

**Kleuren:**
- [ ] Color palette definitie
- [ ] Dark mode variants (optioneel)

**Typography:**
- [ ] Font files (indien custom)
- [ ] Typography scale

**Componenten:**
- [ ] Button variants
- [ ] Input fields
- [ ] Cards
- [ ] Badges
- [ ] Avatars
- [ ] Loading states

---

**EINDE DOCUMENT**

Voor vragen of onduidelijkheden, neem contact op met het development team.

**Succes met de app development! 🚀**
