# 🔄 PLANNING ↔ PROJECT SYNCHRONISATIE PLAN

**Datum**: 10 oktober 2025  
**Status**: Planning Fase  
**Prioriteit**: 🔥 HOOG

---

## 📋 PROBLEEMANALYSE

### 🔴 Huidige Problemen

1. **Project Taken Leeg**
   - Project taken worden niet weergegeven
   - Offerte items worden niet omgezet naar project_tasks
   - Monteur ziet geen taken om af te vinken

2. **Facturen Niet Zichtbaar**
   - Facturen verschijnen niet in project overzicht
   - Geen directe koppeling tussen factuur en project
   - Alleen offertes worden correct getoond

3. **Geen Planning ↔ Project Sync**
   - Als project wordt ingepland in kalender, wordt personeel niet gekoppeld aan project
   - Geen activiteit zichtbaar in project
   - Monteur niet zichtbaar in project details
   - Geen automatische project status update

---

## 🎯 DOELSTELLINGEN

### Gewenste Flow:

```
┌─────────────────┐
│  OFFERTE        │
│  Goedgekeurd    │
└────────┬────────┘
         │
         │ 1. Maak Project
         │ 2. Genereer Project Taken
         ↓
┌─────────────────┐
│  PROJECT        │
│  Status:        │
│  "Te Plannen"   │
└────────┬────────┘
         │
         │ 3. Admin plant in kalender
         │    + Wijst monteur toe
         ↓
┌─────────────────┐
│  PLANNING ITEM  │
│  + Project Link │
│  + Monteur Link │
└────────┬────────┘
         │
         │ 4. SYNC TRIGGERS:
         │    ✅ Update project.assigned_user_id
         │    ✅ Update project.status → "Gepland"
         │    ✅ Maak activiteit entry
         │    ✅ Link planning_items ↔ project
         ↓
┌─────────────────┐
│  PROJECT        │
│  Status: Gepland│
│  Monteur: ✅    │
│  Activiteit: ✅ │
│  Taken: ✅      │
└─────────────────┘
```

---

## 🔧 TECHNISCHE OPLOSSINGEN

### **1. PROJECT TAKEN GENEREREN** 

#### Probleem:
- `project_tasks` tabel is leeg
- Items uit offerte worden niet overgenomen

#### Oplossing:
**A. Database Trigger: Auto-genereer taken bij project aanmaken**

```sql
-- Function: Genereer project_tasks uit offerte
CREATE OR REPLACE FUNCTION generate_project_tasks_from_quote()
RETURNS TRIGGER AS $$
DECLARE
  quote_item RECORD;
  block_item RECORD;
BEGIN
  -- Als project een quote_id heeft, genereer taken
  IF NEW.quote_id IS NOT NULL THEN
    
    -- Haal offerte op
    FOR quote_item IN 
      SELECT * FROM quotes WHERE id = NEW.quote_id
    LOOP
      -- Check of offerte blocks heeft (nieuw formaat)
      IF quote_item.blocks IS NOT NULL THEN
        -- Loop door blocks
        FOR block_item IN 
          SELECT * FROM jsonb_array_elements(quote_item.blocks)
        LOOP
          -- Maak project task per block item
          INSERT INTO project_tasks (
            project_id,
            block_title,
            task_description,
            is_completed,
            order_index,
            source_quote_item_id
          )
          SELECT
            NEW.id,
            block_item.value->>'title',
            item->>'description',
            false,
            (item->>'order_index')::integer,
            item->>'id'
          FROM jsonb_array_elements(block_item.value->'items') as item
          WHERE (item->>'type') = 'product';
        END LOOP;
      
      -- Anders gebruik oude items structuur
      ELSIF quote_item.items IS NOT NULL THEN
        INSERT INTO project_tasks (
          project_id,
          block_title,
          task_description,
          is_completed,
          order_index,
          source_quote_item_id
        )
        SELECT
          NEW.id,
          'Werkzaamheden',
          item->>'description',
          false,
          ROW_NUMBER() OVER (ORDER BY item->>'description'),
          item->>'id'
        FROM jsonb_array_elements(quote_item.items) as item;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Execute functie bij INSERT of UPDATE van project
CREATE TRIGGER trigger_generate_project_tasks
  AFTER INSERT OR UPDATE OF quote_id ON projects
  FOR EACH ROW
  WHEN (NEW.quote_id IS NOT NULL)
  EXECUTE FUNCTION generate_project_tasks_from_quote();
```

**B. Backend Function: Handmatige synchronisatie**

```typescript
// src/utils/projectTasksSync.ts
export async function syncProjectTasksFromQuote(projectId: string, quoteId: string) {
  console.log('🔄 Syncing project tasks from quote:', { projectId, quoteId });
  
  // 1. Haal offerte op met items/blocks
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();
    
  if (quoteError || !quote) {
    throw new Error(`Could not fetch quote: ${quoteError?.message}`);
  }
  
  // 2. Verwijder bestaande taken (optioneel - voor re-sync)
  await supabase
    .from('project_tasks')
    .delete()
    .eq('project_id', projectId);
  
  // 3. Genereer nieuwe taken
  const tasks: any[] = [];
  
  // Check voor blocks (nieuw formaat)
  if (quote.blocks && Array.isArray(quote.blocks)) {
    quote.blocks.forEach((block: any, blockIndex: number) => {
      block.items?.forEach((item: any, itemIndex: number) => {
        if (item.type === 'product') {
          tasks.push({
            project_id: projectId,
            block_title: block.title || 'Werkzaamheden',
            task_description: item.description || item.name,
            is_completed: false,
            order_index: blockIndex * 100 + itemIndex,
            source_quote_item_id: item.id
          });
        }
      });
    });
  }
  // Anders oude items structuur
  else if (quote.items && Array.isArray(quote.items)) {
    quote.items.forEach((item: any, index: number) => {
      tasks.push({
        project_id: projectId,
        block_title: 'Werkzaamheden',
        task_description: item.description || item.name,
        is_completed: false,
        order_index: index,
        source_quote_item_id: item.id
      });
    });
  }
  
  // 4. Insert alle taken
  if (tasks.length > 0) {
    const { error: insertError } = await supabase
      .from('project_tasks')
      .insert(tasks);
      
    if (insertError) {
      throw new Error(`Could not insert tasks: ${insertError.message}`);
    }
    
    console.log(`✅ Created ${tasks.length} project tasks`);
  }
  
  return tasks.length;
}
```

---

### **2. FACTUREN KOPPELEN AAN PROJECTEN**

#### Probleem:
- Facturen worden niet weergegeven in project
- Query faalt of mist project_id koppeling

#### Oplossing:

**A. Controleer invoice query in ProjectDetail.tsx:**

```typescript
// Huidige code (line 52-57):
const invoiceResult = await supabase
  .from('invoices')
  .select('*')
  .or(`project_id.eq.${projectId},customer_id.eq.${project.customer_id}`)
  .order('created_at', { ascending: false });

// ✅ Deze query is CORRECT
// Probleem is waarschijnlijk dat facturen geen project_id hebben
```

**B. Fix: Zorg dat nieuwe facturen altijd project_id krijgen**

```typescript
// src/hooks/useInvoices.ts - Bij invoice aanmaken
const createInvoice = async (invoiceData: any) => {
  // ... bestaande code ...
  
  const newInvoice = {
    ...invoiceData,
    project_id: invoiceData.project_id || null, // ✅ Zorg dat dit altijd wordt meegenomen
    customer_id: invoiceData.customer_id,
    // ... rest
  };
  
  const { data, error } = await supabase
    .from('invoices')
    .insert([newInvoice])
    .select()
    .single();
};
```

**C. Migration: Koppel bestaande facturen aan projecten**

```sql
-- Link bestaande facturen aan projecten via customer_id en quote_id
UPDATE invoices i
SET project_id = p.id
FROM projects p
WHERE i.project_id IS NULL
  AND p.customer_id = i.customer_id
  AND p.quote_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM quotes q 
    WHERE q.id = p.quote_id 
    AND q.customer_id = i.customer_id
  );
```

---

### **3. PLANNING ↔ PROJECT SYNCHRONISATIE**

#### Probleem:
- Planning aanmaken koppelt geen personeel aan project
- Geen activiteit logging
- Project status niet automatisch geupdate

#### Oplossing:

**A. Database Trigger: Automatische Sync bij Planning**

```sql
-- Function: Sync planning naar project
CREATE OR REPLACE FUNCTION sync_planning_to_project()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Als planning_item een project_id heeft
  IF NEW.project_id IS NOT NULL THEN
    
    -- Haal project op
    SELECT * INTO project_record 
    FROM projects 
    WHERE id = NEW.project_id::uuid;
    
    IF FOUND THEN
      -- 1. Update project met monteur en status
      UPDATE projects
      SET 
        assigned_user_id = NEW.assigned_user_id,
        status = CASE 
          WHEN status = 'te-plannen' THEN 'gepland'
          ELSE status
        END,
        date = NEW.start_date,
        updated_at = NOW()
      WHERE id = NEW.project_id::uuid;
      
      -- 2. Log activiteit
      INSERT INTO project_activities (
        project_id,
        user_id,
        activity_type,
        description,
        created_at
      ) VALUES (
        NEW.project_id::uuid,
        NEW.user_id,
        'planning_created',
        format('Project ingepland voor %s op %s om %s',
          (SELECT full_name FROM profiles WHERE id = NEW.assigned_user_id),
          TO_CHAR(NEW.start_date, 'DD-MM-YYYY'),
          TO_CHAR(NEW.start_time, 'HH24:MI')
        ),
        NOW()
      );
      
      RAISE NOTICE 'Project % synced with planning', NEW.project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger op INSERT/UPDATE van planning_items
CREATE TRIGGER trigger_sync_planning_to_project
  AFTER INSERT OR UPDATE OF project_id, assigned_user_id, start_date, start_time
  ON planning_items
  FOR EACH ROW
  WHEN (NEW.project_id IS NOT NULL)
  EXECUTE FUNCTION sync_planning_to_project();
```

**B. Trigger voor DELETE: Cleanup bij verwijderen planning**

```sql
-- Function: Cleanup project bij planning delete
CREATE OR REPLACE FUNCTION cleanup_project_on_planning_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Als dit de enige planning was voor dit project
  IF OLD.project_id IS NOT NULL THEN
    -- Check of er nog andere planning items zijn
    IF NOT EXISTS (
      SELECT 1 FROM planning_items 
      WHERE project_id = OLD.project_id::uuid 
      AND id != OLD.id
    ) THEN
      -- Reset project status terug naar 'te-plannen'
      UPDATE projects
      SET 
        status = 'te-plannen',
        assigned_user_id = NULL
      WHERE id = OLD.project_id::uuid
      AND status = 'gepland';
      
      -- Log activiteit
      INSERT INTO project_activities (
        project_id,
        user_id,
        activity_type,
        description,
        created_at
      ) VALUES (
        OLD.project_id::uuid,
        OLD.user_id,
        'planning_removed',
        'Planning verwijderd - project terug naar "Te Plannen"',
        NOW()
      );
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_project_on_planning_delete
  AFTER DELETE ON planning_items
  FOR EACH ROW
  WHEN (OLD.project_id IS NOT NULL)
  EXECUTE FUNCTION cleanup_project_on_planning_delete();
```

**C. Activity Tabel Aanmaken (als niet bestaat)**

```sql
-- Tabel voor project activiteiten
CREATE TABLE IF NOT EXISTS project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  activity_type text NOT NULL, -- 'planning_created', 'planning_removed', 'status_changed', etc.
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Index voor snellere queries
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id 
  ON project_activities(project_id);
  
CREATE INDEX IF NOT EXISTS idx_project_activities_created_at 
  ON project_activities(created_at DESC);

-- RLS Policies
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project activities"
  ON project_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_activities.project_id
    )
  );

CREATE POLICY "Users can create project activities"
  ON project_activities FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

**D. Frontend: Toon Activiteiten in ProjectDetail**

```typescript
// src/components/ProjectActivities.tsx
interface ProjectActivitiesProps {
  projectId: string;
}

export const ProjectActivities: React.FC<ProjectActivitiesProps> = ({ projectId }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('project_activities')
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!error && data) {
        setActivities(data);
      }
      setLoading(false);
    };
    
    fetchActivities();
  }, [projectId]);
  
  if (loading) {
    return <div>Activiteiten laden...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activiteit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 text-sm">
              <div className="text-muted-foreground">
                {format(new Date(activity.created_at), 'dd MMM HH:mm', { locale: nl })}
              </div>
              <div className="flex-1">
                <span className="font-medium">{activity.user?.full_name}</span>
                {' '}
                {activity.description}
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Nog geen activiteiten
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 📝 IMPLEMENTATIE PLAN

### **FASE 1: DATABASE MIGRATIONS** (30 min)

1. ✅ Maak migration: `20251010_sync_planning_to_projects.sql`
2. ✅ Voeg `project_activities` tabel toe
3. ✅ Maak trigger `sync_planning_to_project()`
4. ✅ Maak trigger `cleanup_project_on_planning_delete()`
5. ✅ Maak trigger `generate_project_tasks_from_quote()`
6. ✅ Test triggers lokaal

### **FASE 2: BACKEND SYNC FUNCTIONS** (45 min)

7. ✅ Maak `src/utils/projectTasksSync.ts`
8. ✅ Maak `src/utils/projectActivitiesSync.ts`
9. ✅ Update `useInvoices.ts` om project_id altijd mee te geven
10. ✅ Test handmatige sync functies

### **FASE 3: FRONTEND UPDATES** (60 min)

11. ✅ Maak `ProjectActivities` component
12. ✅ Integreer in `ProjectDetail.tsx`
13. ✅ Update `SimplifiedPlanningManagement` om sync te triggeren
14. ✅ Test volledige flow: Planning → Project sync

### **FASE 4: DATA MIGRATIE** (15 min)

15. ✅ Run SQL om bestaande facturen te koppelen
16. ✅ Handmatig project_tasks genereren voor bestaande projecten
17. ✅ Verifieer data integriteit

### **FASE 5: TESTING** (30 min)

18. ✅ Test scenario: Maak offerte → Goedkeuren → Taken verschijnen
19. ✅ Test scenario: Plan project → Monteur verschijnt in project
20. ✅ Test scenario: Verwijder planning → Project reset
21. ✅ Test scenario: Factuur aanmaken → Verschijnt in project

---

## 🎯 ACCEPTANCE CRITERIA

### ✅ Taken Zichtbaar
- [ ] Project taken verschijnen direct na offerte goedkeuring
- [ ] Taken zijn afvinkbaar voor monteur
- [ ] Taken tonen juiste blok titel en beschrijving

### ✅ Facturen Zichtbaar
- [ ] Nieuwe facturen verschijnen in project tab
- [ ] Bestaande facturen zijn gekoppeld aan juiste projecten
- [ ] Factuur tabel toont project naam

### ✅ Planning Sync Werkt
- [ ] Monteur verschijnt in project details na planning
- [ ] Project status update naar "Gepland"
- [ ] Activiteit toont "Ingepland voor [Monteur] op [Datum]"
- [ ] Bij planning verwijderen: monteur wordt verwijderd + status terug

### ✅ Activiteiten Log
- [ ] Planning acties worden gelogd
- [ ] Status wijzigingen worden gelogd
- [ ] Gebruikersnaam is zichtbaar bij elke actie
- [ ] Tijdstempel correct weergegeven

---

## 🚀 GESCHATTE TIJD

**Totaal**: 3 uur  
**Breakdown**:
- Database migrations: 30 min
- Backend functions: 45 min
- Frontend components: 60 min
- Data migratie: 15 min
- Testing: 30 min

---

## 📞 VRAGEN VOOR USER

1. **Project Taken**: Moeten ALLE offerte items overgenomen worden, of alleen "product" items?
2. **Facturen**: Moeten we alleen NIEUWE facturen koppelen, of ook bestaande facturen automatisch linken?
3. **Planning Sync**: Wat moet er gebeuren als een project al een monteur heeft en je plant opnieuw in met een andere monteur?
4. **Activiteiten**: Welke andere acties moeten gelogd worden? (Start project, Voltooi taak, etc.)

---

## ⚠️ RISICO'S & AANDACHTSPUNTEN

1. **Data Loss**: Triggers kunnen data overschrijven - test EERST lokaal!
2. **Performance**: Activity log kan groot worden - overwegen archivering na X dagen
3. **Conflicten**: Als project al gekoppeld is aan andere planning - wat dan?
4. **Backwards Compatibility**: Oude projecten hebben geen quote_id - handmatig fixen?

---

## 📚 REFERENTIES

- `supabase/migrations/20250701235651-...sql` - Project tasks definitie
- `supabase/migrations/20250616132516-...sql` - Planning items definitie
- `src/components/ProjectDetail.tsx` - Huidige project weergave
- `src/components/SimplifiedPlanningManagement.tsx` - Planning UI
- `PLANNING_WORKFLOW_GUIDE.md` - Planning workflow documentatie

---

**Klaar om te implementeren? Reply met "START IMPLEMENTATIE" en ik begin direct!** 🚀

