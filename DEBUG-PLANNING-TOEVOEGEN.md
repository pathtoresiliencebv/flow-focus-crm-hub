# DEBUG: Planning Toevoegen Fout

## 🔍 **Stappen om het probleem te identificeren:**

### **1. Open Browser Console**
1. Open Chrome DevTools (F12)
2. Ga naar **Console** tab
3. Klik op "Planning toevoegen" in een project

### **2. Check voor deze errors:**

#### **Mogelijke Error 1: Database Constraint**
```
ERROR: insert or update on table "planning_items" violates foreign key constraint
```
**Oplossing:** Project ID is niet correct

#### **Mogelijke Error 2: RLS Policy**
```
ERROR: new row violates row-level security policy
```
**Oplossing:** User heeft geen permissie

#### **Mogelijke Error 3: Missing Fields**
```
ERROR: null value in column "user_id" violates not-null constraint
```
**Oplossing:** User ID niet correct gezet

#### **Mogelijke Error 4: Time Format**
```
ERROR: invalid input syntax for type time
```
**Oplossing:** Tijd format is verkeerd

---

## 🧪 **TEST SQL QUERIES:**

### **Test 1: Check Planning Items Table**
```sql
-- Voer uit in Supabase SQL Editor
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'planning_items'
ORDER BY ordinal_position;
```

### **Test 2: Check RLS Policies**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'planning_items';
```

### **Test 3: Try Manual Insert**
```sql
-- Test met je eigen user ID (vervang 'YOUR-USER-ID')
INSERT INTO planning_items (
  user_id,
  assigned_user_id,
  project_id,
  title,
  description,
  start_date,
  start_time,
  end_time,
  location,
  status
) VALUES (
  'YOUR-USER-ID', -- Vervang met jouw auth.users ID
  'YOUR-USER-ID', -- Zelfde voor test
  NULL, -- Geen project voor test
  'Test Planning',
  'Test beschrijving',
  '2025-10-15',
  '09:00:00',
  '17:00:00',
  'Test locatie',
  'Gepland'
);

-- Check of het gelukt is
SELECT * FROM planning_items ORDER BY created_at DESC LIMIT 1;
```

### **Test 4: Get Your User ID**
```sql
-- Voer uit als ingelogde user
SELECT auth.uid() as my_user_id;

-- Of check all users
SELECT id, email, raw_user_meta_data FROM auth.users;
```

---

## 📋 **EXPECTED CONSOLE OUTPUT:**

**Bij succesvolle planning toevoeging:**
```javascript
📋 SimplePlanningForm submitting: {
  title: "Test Planning",
  date: "2025-10-15",
  startTime: "09:00:00",
  endTime: "17:00:00",
  location: "Test Locatie",
  description: "Test beschrijving",
  assignedUserId: "uuid-here",
  projectId: "project-uuid-here"
}

📅 Adding planning item: {
  title: "Test Planning",
  description: "Test beschrijving",
  start_date: "2025-10-15",
  start_time: "09:00:00",
  end_time: "17:00:00",
  location: "Test Locatie",
  status: "Gepland",
  project_id: "project-uuid-here",
  assigned_user_id: "uuid-here",
  user_id: ""
}

User ID: actual-user-uuid-here

Planning data to insert: {
  // ... same data with user_id filled in
}

Planning item created successfully: {
  id: "new-planning-id",
  // ... all fields
}
```

**Bij error:**
```javascript
❌ Error adding planning: {
  code: "...",
  message: "...",
  details: "...",
  hint: "..."
}
```

---

## 🔧 **QUICK FIXES:**

### **Fix 1: Ensure User is Logged In**
```typescript
// Check in browser console:
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session?.user?.id);
```

### **Fix 2: Check if Monteur Exists**
```sql
SELECT id, full_name, email, role 
FROM profiles 
WHERE role = 'Installateur';
```

### **Fix 3: Check if Project Exists**
```sql
SELECT id, title, customer_id 
FROM projects 
WHERE id = 'YOUR-PROJECT-ID-HERE';
```

---

## 🚨 **MEEST VOORKOMENDE PROBLEMEN:**

1. **User niet ingelogd** → Session expired
2. **RLS Policy blokkeert insert** → Check policies
3. **Monteur ID niet valid** → Monteur bestaat niet of is geen Installateur
4. **Project ID niet valid** → Project bestaat niet
5. **Time format verkeerd** → Moet HH:MM:SS zijn
6. **Date format verkeerd** → Moet YYYY-MM-DD zijn

---

## 📝 **WAT TE DOEN:**

1. **Kopieer de EXACTE foutmelding** uit de browser console
2. **Voer Test 1-4 uit** in Supabase SQL Editor
3. **Stuur mij:**
   - De console error
   - De output van de SQL tests
   - Screenshot van de fout (indien mogelijk)

**Dan kan ik het PRECIES fixen!** 🎯

