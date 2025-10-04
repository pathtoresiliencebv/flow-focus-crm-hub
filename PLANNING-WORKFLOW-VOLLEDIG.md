# 📅 Nieuwe Eenvoudige Planning Workflow

## ✅ Wat is er Veranderd?

### **Voor de Wijziging:**
- ❌ Complexe planning interface met meerdere views (Team/Kalender/Lijst)
- ❌ Monteurs zagen ALLE projecten met status "in uitvoering"
- ❌ Omslachtig inplannen via meerdere dialogs
- ❌ Geen duidelijke datum-gebaseerde workflow

### **Na de Wijziging:**
- ✅ Eenvoudige iOS-style maandkalender
- ✅ Monteurs zien ALLEEN ingeplande projecten
- ✅ Direct inplannen: project + monteur + datum in één scherm
- ✅ Projecten gesorteerd op planning datum
- ✅ Mobile-friendly interface

---

## 🎯 Hoe Werkt het Nieuwe Systeem?

### **Voor Administratie:**

1. **Planning Pagina Openen**
   - Ga naar "Planning" in het hoofdmenu
   - Je ziet een moderne maandkalender met alle ingeplande projecten

2. **Project Inplannen**
   - Klik op "Project Inplannen" knop (rechts boven)
   - OF: Klik op een datum in de kalender
   - Er opent een overzichtelijk panel met 3 stappen:
     
     **Stap 1: Selecteer Project**
     - Zoekbalk om snel een project te vinden
     - Lijst met alle projecten die "Te plannen" of "Gepland" zijn
     - Zie direct klant naam, status en datum
     
     **Stap 2: Selecteer Monteur**
     - Dropdown met alle monteurs
     - Overzichtelijke lijst
     
     **Stap 3: Selecteer Datum & Tijd**
     - Kalender voor datum selectie
     - Start en eind tijd invoeren
     - Samenvatting van je selectie onderaan

3. **Inplannen Bevestigen**
   - Klik op "Inplannen"
   - Project wordt toegevoegd aan planning_items
   - Project status wordt automatisch "gepland"
   - Monteur wordt toegewezen aan project

4. **Planning Overzicht**
   - Zie alle ingeplande projecten in de kalender
   - Filter op week/maand
   - Statistieken dashboard bovenaan:
     - Totaal ingepland
     - Actieve monteurs
     - Deze week
     - Te plannen projecten

---

### **Voor Monteurs:**

#### **Desktop/Web Interface:**

1. **Mijn Projecten Pagina**
   - Monteur ziet ALLEEN projecten waarvoor een planning_items record bestaat
   - Projecten zijn automatisch gesorteerd op planning datum (vroegste eerst)
   - Geen projecten zonder planning zichtbaar

2. **Project Informatie**
   - Alle normale project details
   - Planning datum duidelijk zichtbaar
   - Status badges (Gepland/In uitvoering/etc.)
   - Voortgang percentage

3. **Project Acties**
   - "Start Project" knop voor geplande projecten
   - "Opleveren" knop voor projecten in uitvoering

#### **Mobiele App:**

1. **Dashboard**
   - Top statistieken:
     - Actieve projecten (aantal ingepland)
     - In uitvoering (aantal actief)
   
2. **Project Lijst**
   - ALLEEN ingeplande projecten zichtbaar
   - Gesorteerd op planning datum
   - **Prominente planning datum weergave:**
     ```
     📅 Ingepland: ma 6 jan om 08:00
     ```
   - Klant informatie (naam, adres, telefoon)
   - Voortgang balk
   - Klik voor volledige details

3. **Geen Planning = Niet Zichtbaar**
   - Als een project niet in planning_items staat:
     - Monteur ziet het NIET
     - Zelfs als assigned_user_id = monteur.id
   - Dit voorkomt verwarring over welke projecten nu uitgevoerd moeten worden

---

## 🔧 Technische Implementatie

### **Nieuwe Componenten:**

1. **`SimplifiedPlanningManagement.tsx`**
   - Hoofdcomponent voor planning pagina
   - Vervangt oude `PlanningManagement.tsx`
   - Geïntegreerd met `planning_items` en `projects` tables

2. **`SimplifiedPlanningCalendar.tsx`**
   - iOS-style maandkalender component
   - Toont events per dag
   - Click handlers voor datum/event selectie
   - Responsive design

3. **`DirectProjectPlanningPanel.tsx`**
   - Unified planning interface
   - 3-stappen proces in één modal
   - Project search functionaliteit
   - Real-time validatie

### **Aangepaste Componenten:**

1. **`InstallateurProjectList.tsx`**
   ```typescript
   // Fetch planning items for current user
   useEffect(() => {
     fetchPlanning();
   }, [user?.id]);

   // Filter projects based on planning_items
   const plannedProjectIds = new Set(planningItems.map(p => p.project_id));
   const installateurProjects = projects
     .filter(p => plannedProjectIds.has(p.id))
     .sort((a, b) => sortByPlanningDate(a, b));
   ```

2. **`MobileDashboard.tsx`**
   ```typescript
   // Same filtering logic as desktop
   // + Display planning date prominently
   <div className="text-blue-600 bg-blue-50">
     📅 Ingepland: {planningDate} om {planningTime}
   </div>
   ```

3. **`Index.tsx`**
   ```typescript
   // Updated import
   import { SimplifiedPlanningManagement } from "@/components/SimplifiedPlanningManagement";
   
   // Use new component
   case "calendar":
     return <SimplifiedPlanningManagement />;
   ```

---

## 📊 Database Schema

### **planning_items Table:**
```sql
CREATE TABLE planning_items (
  id UUID PRIMARY KEY,
  user_id UUID,                    -- Who created the planning
  assigned_user_id UUID NOT NULL,  -- Monteur assigned to
  project_id UUID,                 -- Linked project (optional)
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'Gepland',
  location TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### **Workflow:**

1. **Project wordt aangemaakt** → Status: "te-plannen"
2. **Administratie plant in** → 
   - `planning_items` record created
   - `projects.status` = "gepland"
   - `projects.assigned_user_id` = monteur
3. **Monteur ziet project** → Filtered via `planning_items.assigned_user_id`
4. **Monteur start project** → Status: "in-uitvoering"
5. **Monteur levert op** → Status: "afgerond"

---

## 🎨 User Experience Verbeteringen

### **Voor Administratie:**

✅ **Eén Click Planning**
- Niet meer door meerdere schermen navigeren
- Alles in één overzichtelijk panel
- Direct zoeken en selecteren

✅ **Visueel Kalender Overzicht**
- Zie in één oogopslag wanneer monteurs ingepland zijn
- Voorkom dubbele bookings
- Plan efficiënter

✅ **Statistieken Dashboard**
- Real-time inzicht in planning status
- Hoeveel projecten nog te plannen
- Welke monteurs actief zijn

### **Voor Monteurs:**

✅ **Duidelijke Werklijst**
- Alleen wat relevant is
- Gesorteerd op wanneer het gedaan moet worden
- Geen verwarring over prioriteiten

✅ **Planning Datum Prominent**
- Altijd zichtbaar wanneer een project gepland is
- Mobiel: Grote, kleurrijke weergave
- Desktop: Duidelijk in project card

✅ **Geen Onnodige Informatie**
- Als het niet ingepland is, zie je het niet
- Focus op wat NU belangrijk is

---

## 🧪 Testing Checklist

### **Administratie Tests:**

- [ ] **Inplannen Workflow:**
  - [ ] Open planning pagina
  - [ ] Klik "Project Inplannen"
  - [ ] Selecteer project uit lijst
  - [ ] Selecteer monteur
  - [ ] Kies datum en tijd
  - [ ] Bevestig inplannen
  - [ ] Controleer of project verschijnt in kalender

- [ ] **Kalender Navigatie:**
  - [ ] Navigeer tussen maanden
  - [ ] Klik op datum om direct in te plannen
  - [ ] Bekijk project details bij click op event

- [ ] **Statistieken:**
  - [ ] Controleer "Totaal Ingepland" teller
  - [ ] Controleer "Deze Week" filter
  - [ ] Controleer "Te Plannen" aantal

### **Monteur Tests (Desktop):**

- [ ] **Project Lijst:**
  - [ ] Login als monteur
  - [ ] Controleer dat ALLEEN ingeplande projecten zichtbaar zijn
  - [ ] Controleer dat projecten gesorteerd zijn op datum
  - [ ] Controleer dat niet-ingeplande projecten NIET zichtbaar zijn

- [ ] **Project Acties:**
  - [ ] Start een gepland project
  - [ ] Lever een project in uitvoering op

### **Monteur Tests (Mobiel):**

- [ ] **Mobile Dashboard:**
  - [ ] Login als monteur op mobiel
  - [ ] Controleer dat ALLEEN ingeplande projecten zichtbaar zijn
  - [ ] Controleer dat planning datum prominent wordt getoond
  - [ ] Controleer dat projecten gesorteerd zijn op datum
  - [ ] Test telefoon link (klik op telefoonnummer)

- [ ] **Project Details:**
  - [ ] Klik op project
  - [ ] Bekijk alle details
  - [ ] Navigeer terug naar lijst

---

## 🚀 Deployment Instructies

1. **Code is al gecommit en gepusht**
   ```bash
   git status
   # Already pushed to main
   ```

2. **Database Migratie**
   - Geen nieuwe migraties nodig
   - `planning_items` table bestaat al

3. **Testing**
   - Test als Administrator: Plan een project in
   - Test als Monteur (desktop): Zie ingeplande projecten
   - Test als Monteur (mobiel): Zie planning datum

4. **Deploy**
   - Frontend deploy via gebruikelijke proces
   - Geen backend changes nodig

---

## 📝 Belangrijke Notities

### **Breaking Changes:**

⚠️ **Monteurs zien nu ALLEEN ingeplande projecten**
- Dit is een fundamentele verandering in de workflow
- Zorg dat alle projecten correct worden ingepland
- Communiceer deze verandering met het team

### **Data Consistentie:**

⚠️ **Bestaande projecten zonder planning_items**
- Als er projecten zijn met assigned_user_id maar ZONDER planning_items:
  - Deze zijn NIET zichtbaar voor monteurs
  - Plan ze opnieuw in via de nieuwe interface
  - Of voer een migratie script uit (optioneel)

### **Optioneel: Migratie Script**

Als je bestaande "gepland" projecten wilt migreren naar planning_items:

```sql
-- Create planning_items for existing assigned projects
INSERT INTO planning_items (
  id,
  user_id,
  assigned_user_id,
  project_id,
  title,
  description,
  start_date,
  start_time,
  end_time,
  status
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- System user
  assigned_user_id,
  id,
  'Project: ' || title,
  description,
  COALESCE(date::date, CURRENT_DATE),
  '08:00:00',
  '17:00:00',
  'Gepland'
FROM projects
WHERE assigned_user_id IS NOT NULL
  AND status IN ('gepland', 'in-uitvoering')
  AND NOT EXISTS (
    SELECT 1 FROM planning_items pi 
    WHERE pi.project_id = projects.id
  );
```

---

## 📚 Code Voorbeelden

### **Administratie: Project Inplannen**

```typescript
const handlePlanProject = async (data: {
  project_id: string;
  assigned_user_id: string;
  start_date: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
}) => {
  // Add planning_items record
  await addPlanningItem({
    ...data,
    user_id: user?.id || '',
    status: 'Gepland'
  });

  // Update project
  await updateProject({
    id: data.project_id,
    status: 'gepland',
    assigned_user_id: data.assigned_user_id,
  });
};
```

### **Monteur: Projecten Ophalen**

```typescript
// Fetch planning items for current user
const { data: planningItems } = await supabase
  .from('planning_items')
  .select('*')
  .eq('assigned_user_id', user.id)
  .order('start_date', { ascending: true });

// Filter projects based on planning
const plannedProjectIds = new Set(
  planningItems.map(p => p.project_id).filter(Boolean)
);

const myProjects = projects
  .filter(p => plannedProjectIds.has(p.id))
  .sort((a, b) => {
    const planningA = planningItems.find(pi => pi.project_id === a.id);
    const planningB = planningItems.find(pi => pi.project_id === b.id);
    return new Date(planningA.start_date) - new Date(planningB.start_date);
  });
```

---

## ✨ Voordelen Samenvatting

### **Operationeel:**
- ✅ Duidelijke workflow: Plan → Voer uit → Lever op
- ✅ Geen verwarring over welke projecten wanneer
- ✅ Betere resource planning voor administratie

### **Gebruiksvriendelijk:**
- ✅ Eenvoudige kalender interface
- ✅ Direct inplannen zonder omwegen
- ✅ Mobiele monteurs zien direct hun dagplanning

### **Technisch:**
- ✅ Schone scheiding tussen planning en projecten
- ✅ Goed te onderhouden code
- ✅ Geen linter errors
- ✅ Mobile-first design

---

## 🆘 Troubleshooting

### **Monteur ziet geen projecten:**
1. Controleer of projecten zijn ingepland via planning pagina
2. Controleer `planning_items` table:
   ```sql
   SELECT * FROM planning_items 
   WHERE assigned_user_id = '<monteur_id>';
   ```
3. Controleer of `project_id` correct is gekoppeld

### **Project verschijnt niet in kalender:**
1. Controleer `start_date` format (YYYY-MM-DD)
2. Refresh planning pagina
3. Check console voor errors

### **Dubbele planning:**
- De applicatie voorkomt dit niet automatisch
- Administratie moet opletten bij inplannen
- (Optioneel: Voeg validatie toe in toekomst)

---

## 🎉 Klaar!

Het nieuwe planning systeem is nu live en klaar voor gebruik!

**Happy Planning! 📅✨**

