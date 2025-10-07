# 👥 GEBRUIKERSROLLEN & TOEGANGSRECHTEN OVERZICHT
## SMANS CRM - Database Security Model

**Datum:** 7 Oktober 2025  
**Versie:** 1.0  
**Database:** Supabase PostgreSQL met Row Level Security (RLS)

---

## 📋 INHOUDSOPGAVE

1. [Gebruikersrollen](#gebruikersrollen)
2. [Permissie Systeem](#permissie-systeem)
3. [Toegangsrechten per Rol](#toegangsrechten-per-rol)
4. [Database Tabellen & RLS Policies](#database-tabellen--rls-policies)
5. [Speciale Gevallen](#speciale-gevallen)
6. [Implementatie Details](#implementatie-details)

---

## 🎭 GEBRUIKERSROLLEN

Het systeem heeft **5 gebruikersrollen** gedefinieerd in de database:

```sql
CREATE TYPE public.user_role AS ENUM (
    'Administrator',
    'Verkoper',
    'Installateur',
    'Administratie',
    'Bekijker'
);
```

### **Rol Hiërarchie (van hoog naar laag):**

```
1. Administrator     → Volledige toegang tot alles
2. Administratie     → Financiële & administratieve taken
3. Verkoper          → Verkoop & klantbeheer
4. Installateur      → Projectuitvoering (monteur)
5. Bekijker          → Alleen lezen (geen wijzigingen)
```

---

## 🔐 PERMISSIE SYSTEEM

### **Beschikbare Permissies:**

```sql
CREATE TYPE public.app_permission AS ENUM (
    'customers_view',      -- Klanten bekijken
    'customers_edit',      -- Klanten bewerken
    'customers_delete',    -- Klanten verwijderen
    
    'projects_view',       -- Projecten bekijken
    'projects_edit',       -- Projecten bewerken
    'projects_delete',     -- Projecten verwijderen
    
    'invoices_view',       -- Facturen bekijken
    'invoices_edit',       -- Facturen bewerken
    'invoices_delete',     -- Facturen verwijderen
    
    'users_view',          -- Gebruikers bekijken
    'users_edit',          -- Gebruikers bewerken
    'users_delete',        -- Gebruikers verwijderen
    
    'reports_view',        -- Rapporten bekijken
    'settings_edit'        -- Instellingen bewerken
);
```

### **Permissie Tabel:**

Alle permissies worden opgeslagen in `role_permissions` tabel:

```sql
CREATE TABLE public.role_permissions (
    id BIGINT PRIMARY KEY,
    role public.user_role NOT NULL,
    permission public.app_permission NOT NULL,
    UNIQUE (role, permission)
);
```

---

## 📊 TOEGANGSRECHTEN PER ROL

### **1. 👑 Administrator**

**Volledige toegang tot alles**

| Module | Bekijken | Bewerken | Verwijderen | Aanmaken |
|--------|----------|----------|-------------|----------|
| **Klanten** | ✅ | ✅ | ✅ | ✅ |
| **Projecten** | ✅ (alles) | ✅ | ✅ | ✅ |
| **Offertes** | ✅ | ✅ | ✅ | ✅ |
| **Facturen** | ✅ | ✅ | ✅ | ✅ |
| **Gebruikers** | ✅ | ✅ | ✅ | ✅ |
| **Planning** | ✅ | ✅ | ✅ | ✅ |
| **Rapporten** | ✅ | - | - | - |
| **Instellingen** | ✅ | ✅ | - | - |
| **Email** | ✅ | ✅ | ✅ | ✅ |

**Speciale Rechten:**
- ✅ Kan gebruikersrollen toewijzen/wijzigen
- ✅ Kan permissies per rol aanpassen
- ✅ Kan alle data verwijderen
- ✅ Toegang tot systeem instellingen
- ✅ Kan alle projecten zien (ook van andere gebruikers)

**Database Permissies:**
```
customers_view, customers_edit, customers_delete
projects_view, projects_edit, projects_delete
invoices_view, invoices_edit, invoices_delete
users_view, users_edit, users_delete
reports_view, settings_edit
```

---

### **2. 📋 Administratie**

**Financiële & administratieve taken**

| Module | Bekijken | Bewerken | Verwijderen | Aanmaken |
|--------|----------|----------|-------------|----------|
| **Klanten** | ✅ | ❌ | ❌ | ❌ |
| **Projecten** | ✅ (alles) | ❌ | ❌ | ✅ |
| **Offertes** | ✅ | ✅ | ❌ | ✅ |
| **Facturen** | ✅ | ✅ | ❌ | ✅ |
| **Gebruikers** | ❌ | ❌ | ❌ | ❌ |
| **Planning** | ✅ | ✅ | ❌ | ✅ |
| **Rapporten** | ✅ | - | - | - |
| **Instellingen** | ❌ | ❌ | - | - |
| **Email** | ✅ | ✅ | ❌ | ✅ |

**Speciale Rechten:**
- ✅ Kan facturen aanmaken en bewerken
- ✅ Kan offertes aanmaken en bewerken
- ✅ Kan alle projecten zien (ook van andere gebruikers)
- ✅ Kan projecten aanmaken
- ❌ Kan GEEN projecten verwijderen (alleen Administrator)
- ❌ Kan GEEN klanten bewerken/verwijderen

**Database Permissies:**
```
customers_view
projects_view
invoices_view, invoices_edit
reports_view
```

---

### **3. 💼 Verkoper**

**Verkoop & klantbeheer**

| Module | Bekijken | Bewerken | Verwijderen | Aanmaken |
|--------|----------|----------|-------------|----------|
| **Klanten** | ✅ | ✅ | ❌ | ✅ |
| **Projecten** | ✅ (eigen) | ✅ (eigen) | ❌ | ✅ |
| **Offertes** | ✅ | ✅ | ❌ | ✅ |
| **Facturen** | ✅ | ✅ | ❌ | ✅ |
| **Gebruikers** | ❌ | ❌ | ❌ | ❌ |
| **Planning** | ✅ (eigen) | ✅ (eigen) | ❌ | ✅ |
| **Rapporten** | ✅ | - | - | - |
| **Instellingen** | ❌ | ❌ | - | - |
| **Email** | ✅ | ✅ | ❌ | ✅ |

**Speciale Rechten:**
- ✅ Kan klanten aanmaken en bewerken
- ✅ Kan offertes aanmaken en bewerken
- ✅ Kan facturen aanmaken en bewerken
- ✅ Kan projecten aanmaken
- ⚠️ Kan ALLEEN EIGEN projecten zien en bewerken
- ❌ Kan GEEN projecten/klanten verwijderen

**Project Zichtbaarheid:**
```sql
-- Verkoper ziet alleen projecten die hij/zij heeft aangemaakt
WHERE user_id = auth.uid()
```

**Database Permissies:**
```
customers_view, customers_edit
projects_view, projects_edit
invoices_view, invoices_edit
reports_view
```

---

### **4. 🔧 Installateur (Monteur)**

**Projectuitvoering**

| Module | Bekijken | Bewerken | Verwijderen | Aanmaken |
|--------|----------|----------|-------------|----------|
| **Klanten** | ✅ | ❌ | ❌ | ❌ |
| **Projecten** | ✅ (toegewezen) | ✅ (toegewezen) | ❌ | ❌ |
| **Offertes** | ❌ | ❌ | ❌ | ❌ |
| **Facturen** | ❌ | ❌ | ❌ | ❌ |
| **Gebruikers** | ❌ | ❌ | ❌ | ❌ |
| **Planning** | ✅ (eigen) | ✅ (eigen) | ❌ | ❌ |
| **Rapporten** | ✅ | - | - | - |
| **Instellingen** | ❌ | ❌ | - | - |
| **Email** | ✅ (eigen) | ✅ (eigen) | ❌ | ✅ |

**Speciale Rechten:**
- ⚠️ Kan ALLEEN projecten zien die aan hem/haar zijn toegewezen
- ✅ Kan projectstatus updaten (bezig, afgerond, etc.)
- ✅ Kan taken afvinken in projecten
- ✅ Kan foto's/documenten uploaden bij projecten
- ✅ Kan klantgegevens bekijken (voor navigatie/contact)
- ❌ Kan GEEN nieuwe projecten aanmaken
- ❌ Kan GEEN offertes/facturen zien of maken

**Project Zichtbaarheid:**
```sql
-- Installateur ziet alleen projecten waar hij/zij aan is toegewezen
WHERE assigned_user_id = auth.uid() OR user_id = auth.uid()
```

**Database Permissies:**
```
customers_view
projects_view, projects_edit
reports_view
```

---

### **5. 👁️ Bekijker**

**Alleen lezen (geen wijzigingen)**

| Module | Bekijken | Bewerken | Verwijderen | Aanmaken |
|--------|----------|----------|-------------|----------|
| **Klanten** | ✅ | ❌ | ❌ | ❌ |
| **Projecten** | ✅ | ❌ | ❌ | ❌ |
| **Offertes** | ❌ | ❌ | ❌ | ❌ |
| **Facturen** | ✅ | ❌ | ❌ | ❌ |
| **Gebruikers** | ❌ | ❌ | ❌ | ❌ |
| **Planning** | ✅ | ❌ | ❌ | ❌ |
| **Rapporten** | ✅ | - | - | - |
| **Instellingen** | ❌ | ❌ | - | - |
| **Email** | ❌ | ❌ | ❌ | ❌ |

**Speciale Rechten:**
- ✅ Kan klanten bekijken
- ✅ Kan projecten bekijken
- ✅ Kan facturen bekijken
- ✅ Kan rapporten bekijken
- ❌ Kan NIETS bewerken, verwijderen of aanmaken
- ❌ Geen toegang tot email

**Database Permissies:**
```
customers_view
projects_view
invoices_view
reports_view
```

---

## 🗄️ DATABASE TABELLEN & RLS POLICIES

### **1. Customers (Klanten)**

**RLS Policy:**
```sql
-- Alle authenticated users kunnen klanten BEKIJKEN
CREATE POLICY "Allow authenticated users to view customers"
ON public.customers FOR SELECT
TO authenticated
USING (true);

-- Alle authenticated users kunnen klanten AANMAKEN
CREATE POLICY "Allow authenticated users to insert customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (true);

-- Alle authenticated users kunnen klanten BEWERKEN
CREATE POLICY "Allow authenticated users to update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (true);

-- Alle authenticated users kunnen klanten VERWIJDEREN
CREATE POLICY "Allow authenticated users to delete customers"
ON public.customers FOR DELETE
TO authenticated
USING (true);
```

**⚠️ LET OP:** Customers hebben momenteel GEEN strikte rol-gebaseerde beperking in RLS!  
De permissies worden gecontroleerd in de frontend via `role_permissions` tabel.

**Aanbeveling voor App Bouwer:**
- Implementeer frontend checks voor `customers_edit` en `customers_delete` permissies
- Overweeg om RLS policies aan te scherpen voor betere beveiliging

---

### **2. Projects (Projecten)**

**RLS Policies:**

**BEKIJKEN (SELECT):**
```sql
CREATE POLICY "Users can view projects based on role"
ON public.projects FOR SELECT
USING (
  CASE
    -- Administrators en Administratie zien ALLES
    WHEN get_user_role(auth.uid()) IN ('Administrator', 'Administratie') 
      THEN true
    
    -- Installateurs zien alleen toegewezen projecten
    WHEN get_user_role(auth.uid()) = 'Installateur' 
      THEN (assigned_user_id = auth.uid() OR user_id = auth.uid())
    
    -- Verkoper ziet alleen eigen projecten
    WHEN get_user_role(auth.uid()) = 'Verkoper' 
      THEN user_id = auth.uid()
    
    -- Bekijker ziet niets (of alles, afhankelijk van implementatie)
    ELSE false
  END
);
```

**AANMAKEN (INSERT):**
```sql
CREATE POLICY "Users can create projects"
ON public.projects FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL -- Alle authenticated users kunnen projecten aanmaken
);
```

**BEWERKEN (UPDATE):**
```sql
CREATE POLICY "Authorized users can update projects"
ON public.projects FOR UPDATE
USING (
  CASE
    -- Administrators en Administratie kunnen alles bewerken
    WHEN get_user_role(auth.uid()) IN ('Administrator', 'Administratie') 
      THEN true
    
    -- Installateurs kunnen alleen toegewezen projecten bewerken
    WHEN get_user_role(auth.uid()) = 'Installateur' 
      THEN (assigned_user_id = auth.uid() OR user_id = auth.uid())
    
    -- Verkoper kan alleen eigen projecten bewerken
    WHEN get_user_role(auth.uid()) = 'Verkoper' 
      THEN user_id = auth.uid()
    
    ELSE false
  END
);
```

**VERWIJDEREN (DELETE):**
```sql
CREATE POLICY "Only administrators can delete projects"
ON public.projects FOR DELETE
USING (
  get_user_role(auth.uid()) = 'Administrator'
);
```

**Belangrijke Velden:**
- `user_id` → Wie het project heeft aangemaakt
- `assigned_user_id` → Aan wie het project is toegewezen (monteur)

---

### **3. Invoices (Facturen)**

**RLS Policies:**

**BEKIJKEN (SELECT):**
```sql
CREATE POLICY "Users can view invoices based on role"
ON public.invoices FOR SELECT
USING (
  CASE
    WHEN get_user_role(auth.uid()) = 'Administrator' THEN true
    WHEN get_user_role(auth.uid()) = 'Administratie' THEN true
    ELSE false
  END
);
```

**AANMAKEN (INSERT):**
```sql
CREATE POLICY "Admins and Administratie can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);
```

**BEWERKEN (UPDATE):**
```sql
CREATE POLICY "Admins and Administratie can update invoices"
ON public.invoices FOR UPDATE
USING (
  get_user_role(auth.uid()) IN ('Administrator', 'Administratie')
);
```

**VERWIJDEREN (DELETE):**
```sql
CREATE POLICY "Only administrators can delete invoices"
ON public.invoices FOR DELETE
USING (
  get_user_role(auth.uid()) = 'Administrator'
);
```

**⚠️ LET OP:** Alleen Administrator en Administratie hebben toegang tot facturen!

---

### **4. Quotes (Offertes)**

**RLS Policies:**

Offertes hebben momenteel **GEEN strikte RLS policies** in de migraties.  
De toegangscontrole gebeurt via de `role_permissions` tabel.

**Aanbeveling voor App Bouwer:**
- Implementeer frontend checks voor offerte permissies
- Overweeg om RLS policies toe te voegen voor betere beveiliging

**Verwachte Toegang:**
- Administrator: Alles
- Administratie: Alles
- Verkoper: Alles
- Installateur: Geen toegang
- Bekijker: Geen toegang

---

### **5. Planning Items**

**RLS Policies:**

```sql
-- Alle authenticated users kunnen planning items BEKIJKEN
CREATE POLICY "Users can view planning items"
ON public.planning_items FOR SELECT
TO authenticated
USING (true);

-- Alle authenticated users kunnen planning items AANMAKEN
CREATE POLICY "Users can create planning items"
ON public.planning_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Alle authenticated users kunnen planning items BEWERKEN
CREATE POLICY "Users can update planning items"
ON public.planning_items FOR UPDATE
TO authenticated
USING (true);

-- Alleen Administrators kunnen planning items VERWIJDEREN
CREATE POLICY "Only administrators can delete planning items"
ON public.planning_items FOR DELETE
USING (
  get_user_role(auth.uid()) = 'Administrator'
);
```

**Belangrijke Velden:**
- `user_id` → Wie de planning heeft aangemaakt
- `assigned_user_id` → Aan wie de planning is toegewezen (monteur)

---

### **6. Email Accounts**

**RLS Policies:**

```sql
-- Users kunnen alleen hun eigen email accounts zien
CREATE POLICY "Users can view own accounts"
ON email_accounts FOR SELECT
USING (auth.uid() = user_id);

-- Users kunnen alleen hun eigen email accounts aanmaken
CREATE POLICY "Users can create own accounts"
ON email_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users kunnen alleen hun eigen email accounts bewerken
CREATE POLICY "Users can update own accounts"
ON email_accounts FOR UPDATE
USING (auth.uid() = user_id);

-- Users kunnen alleen hun eigen email accounts verwijderen
CREATE POLICY "Users can delete own accounts"
ON email_accounts FOR DELETE
USING (auth.uid() = user_id);
```

---

### **7. Email Messages**

**RLS Policies:**

```sql
-- Users kunnen alleen emails zien van hun eigen accounts
CREATE POLICY "Users can view own messages"
ON email_messages FOR SELECT
USING (
  account_id IN (
    SELECT id FROM email_accounts 
    WHERE user_id = auth.uid()
  )
);
```

---

### **8. Profiles (Gebruikersprofielen)**

**RLS Policies:**

```sql
-- Alle authenticated users kunnen profielen BEKIJKEN
CREATE POLICY "Users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users kunnen alleen hun eigen profiel BEWERKEN
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Alleen Administrators kunnen profielen VERWIJDEREN
CREATE POLICY "Only administrators can delete profiles"
ON public.profiles FOR DELETE
USING (
  get_user_role(auth.uid()) = 'Administrator'
);
```

---

### **9. Role Permissions**

**RLS Policies:**

```sql
-- Alle authenticated users kunnen permissies BEKIJKEN
CREATE POLICY "Allow authenticated read access to role_permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

-- Alleen Administrators kunnen permissies BEHEREN
CREATE POLICY "Allow Admins to manage permissions"
ON public.role_permissions FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'Administrator')
WITH CHECK (get_user_role(auth.uid()) = 'Administrator');
```

---

## 🔍 SPECIALE GEVALLEN

### **1. Project Toewijzing**

**Scenario:** Een project wordt toegewezen aan een monteur (Installateur)

**Database Velden:**
- `projects.user_id` → Wie het project heeft aangemaakt (bijv. Verkoper)
- `projects.assigned_user_id` → Aan wie het project is toegewezen (bijv. Installateur)

**Zichtbaarheid:**
```sql
-- Installateur kan project zien als:
WHERE assigned_user_id = auth.uid() OR user_id = auth.uid()

-- Verkoper kan project zien als:
WHERE user_id = auth.uid()

-- Administrator/Administratie kan alles zien:
WHERE true
```

---

### **2. Email Toegang**

**Per Gebruiker:**
- Elke gebruiker heeft zijn/haar eigen email accounts
- Email accounts zijn NIET gedeeld tussen gebruikers
- RLS zorgt ervoor dat users alleen hun eigen emails zien

**Aanbeveling:**
- Overweeg een "gedeelde inbox" functionaliteit voor teams
- Implementeer email forwarding/delegatie voor afwezigheid

---

### **3. Offerte → Project Conversie**

**Workflow:**
1. Verkoper maakt offerte aan
2. Klant accepteert offerte
3. Offerte wordt omgezet naar project
4. Project wordt toegewezen aan Installateur

**Permissies:**
- Verkoper: Kan offerte zien en bewerken
- Installateur: Kan GEEN offerte zien, maar WEL het project
- Administrator: Kan alles zien

---

### **4. Factuur Toegang**

**Strikte Beperking:**
- Alleen Administrator en Administratie hebben toegang
- Verkoper, Installateur, Bekijker kunnen GEEN facturen zien
- Dit is hard-coded in RLS policies

**Reden:**
- Financiële data moet beschermd zijn
- Alleen financieel personeel heeft toegang nodig

---

## 💻 IMPLEMENTATIE DETAILS

### **1. Helper Functie: `get_user_role()`**

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- Haal rol op uit profiles tabel
  SELECT role INTO user_role FROM public.profiles WHERE id = p_user_id;
  
  -- Als geen rol gevonden, return default
  IF user_role IS NULL THEN
    RETURN 'Bekijker'::public.user_role;
  END IF;
  
  RETURN user_role;
EXCEPTION 
  WHEN OTHERS THEN
    -- Return default rol bij error
    RETURN 'Bekijker'::public.user_role;
END;
$$;
```

**Gebruik:**
```sql
-- In RLS policies:
WHERE get_user_role(auth.uid()) = 'Administrator'
```

---

### **2. Permissie Check Functie**

```sql
CREATE OR REPLACE FUNCTION public.update_role_permissions(
    p_role public.user_role,
    p_permissions public.app_permission[]
)
RETURNS void AS $$
BEGIN
    -- Alleen Administrators kunnen permissies updaten
    IF public.get_user_role(auth.uid()) <> 'Administrator' THEN
        RAISE EXCEPTION 'Only Administrators can update role permissions.';
    END IF;

    -- Verwijder bestaande permissies voor deze rol
    DELETE FROM public.role_permissions WHERE role = p_role;
    
    -- Voeg nieuwe permissies toe
    INSERT INTO public.role_permissions (role, permission)
    SELECT p_role, unnest(p_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **3. Frontend Permissie Check**

**React Hook (Voorbeeld):**
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) return;
      
      // Haal gebruikersrol op
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile) return;
      
      // Haal permissies op voor deze rol
      const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', profile.role);
      
      if (rolePerms) {
        setPermissions(rolePerms.map(p => p.permission));
      }
    };
    
    fetchPermissions();
  }, [user]);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  return { permissions, hasPermission };
};
```

**Gebruik in Component:**
```typescript
const { hasPermission } = usePermissions();

// Voorwaardelijk renderen
{hasPermission('customers_edit') && (
  <Button onClick={handleEdit}>Bewerken</Button>
)}

// Route bescherming
if (!hasPermission('invoices_view')) {
  return <Navigate to="/dashboard" />;
}
```

---

## 📝 SAMENVATTING VOOR APP BOUWER

### **Belangrijkste Punten:**

1. **5 Gebruikersrollen:**
   - Administrator (alles)
   - Administratie (financieel)
   - Verkoper (verkoop)
   - Installateur (monteur)
   - Bekijker (alleen lezen)

2. **RLS is Actief:**
   - Database beveiligt data op row-level
   - Queries filteren automatisch op basis van rol
   - Geen extra checks nodig in queries

3. **Frontend Checks Nodig:**
   - UI elementen tonen/verbergen op basis van permissies
   - Gebruik `role_permissions` tabel voor checks
   - Implementeer `hasPermission()` helper functie

4. **Project Zichtbaarheid:**
   - Administrator/Administratie: Alles
   - Verkoper: Alleen eigen projecten
   - Installateur: Alleen toegewezen projecten

5. **Factuur Beperking:**
   - Alleen Administrator en Administratie
   - Hard-coded in RLS policies

6. **Email Privacy:**
   - Elke gebruiker heeft eigen email accounts
   - Geen gedeelde toegang tussen users

7. **Permissies zijn Aanpasbaar:**
   - Administrator kan permissies per rol wijzigen
   - Gebruik `update_role_permissions()` functie
   - Changes zijn direct actief

---

## 🚨 AANBEVELINGEN

### **Voor Betere Beveiliging:**

1. **Customers Tabel:**
   - Voeg rol-gebaseerde RLS policies toe
   - Beperk delete rechten tot Administrator

2. **Quotes Tabel:**
   - Voeg RLS policies toe
   - Beperk toegang op basis van rol

3. **Frontend Validatie:**
   - Implementeer permissie checks in alle forms
   - Disable buttons voor users zonder rechten
   - Toon error messages bij ongeautoriseerde acties

4. **Audit Logging:**
   - Log wie wat wanneer heeft gewijzigd
   - Vooral voor gevoelige data (facturen, klanten)

5. **Testing:**
   - Test alle rollen grondig
   - Controleer dat Installateurs alleen toegewezen projecten zien
   - Verifieer dat Bekijkers niets kunnen wijzigen

---

## 📞 CONTACT

Voor vragen over dit document of de implementatie:
- **Project:** SMANS CRM
- **Database:** Supabase PostgreSQL
- **RLS:** Actief op alle tabellen
- **Datum:** 7 Oktober 2025

---

**EINDE DOCUMENT**
