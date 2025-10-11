# Project Delivery Dialog Fix

**Datum:** 11 oktober 2025

## 🐛 Probleem

Wanneer een monteur een project wilde opleveren via **Project Detail** pagina, kreeg hij een incomplete dialog te zien:
- ✅ Had: Werkzaamheden, Materialen, Tevredenheid, Handtekeningen
- ❌ Miste: Foto upload mogelijkheid, Taken lijst

Echter, wanneer dezelfde monteur het project opleverde via het **Dashboard/Project Overzicht**, kreeg hij WEL de complete dialog met foto's en taken.

## 🔍 Root Cause

Er waren **TWEE verschillende flows** voor project oplevering:

### Flow 1: Via Project Detail (INCOMPLEET)
- **Component:** `ProjectCompletionSlider`
- **Locatie:** `src/components/ProjectDetail.tsx` (regel 452-462)
- **Bevatte:** Basis oplevering zonder foto's en taken selectie

### Flow 2: Via Dashboard (COMPLEET) ✅
- **Component:** `ProjectDeliveryDialog`
- **Locatie:** `src/components/dashboard/InstallateurProjectCard.tsx`
- **Bevatte:** Volledige oplevering met foto upload EN taken selectie

## ✅ Oplossing

Vervang `ProjectCompletionSlider` door `ProjectDeliveryDialog` in de Project Detail pagina, zodat beide entry points dezelfde complete flow gebruiken.

### Wijzigingen in `src/components/ProjectDetail.tsx`

#### 1. Imports Updated (regel 3, 19)

**Voor:**
```typescript
import { CheckCircle2, Circle, ... } from "lucide-react";
import { ProjectCompletionSlider } from "./ProjectCompletionSlider";
```

**Na:**
```typescript
import { CheckCircle2, CheckCircle, Circle, ... } from "lucide-react";
import { ProjectDeliveryDialog } from "./dashboard/ProjectDeliveryDialog";
```

#### 2. State toegevoegd (regel 29)

```typescript
const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
```

#### 3. Component vervangen (regel 452-469)

**Voor:**
```typescript
<ProjectCompletionSlider 
  projectId={projectId!}
  projectName={project?.name || ''}
  customerName={customer?.name || ''}
  isCompleted={project?.status === 'afgerond'}
  onCompletionChange={() => {
    window.location.reload();
  }}
/>
```

**Na:**
```typescript
{/* Project Delivery Button */}
{profile?.role === 'Installateur' && project?.status !== 'afgerond' && (
  <Card>
    <CardContent className="pt-6">
      <Button
        onClick={() => setShowDeliveryDialog(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        Project Opleveren
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Zorg ervoor dat alle taken zijn voltooid voor oplevering
      </p>
    </CardContent>
  </Card>
)}
```

#### 4. Dialog toegevoegd (regel 868-879)

```typescript
{/* Project Delivery Dialog */}
{showDeliveryDialog && project && (
  <ProjectDeliveryDialog
    project={project}
    isOpen={showDeliveryDialog}
    onClose={() => setShowDeliveryDialog(false)}
    onComplete={() => {
      setShowDeliveryDialog(false);
      window.location.reload();
    }}
  />
)}
```

## 🎯 Resultaat

Na deze wijzigingen heeft de monteur dezelfde **complete oplevering flow** vanuit beide entry points:

### Wat de monteur nu ziet:

1. **Klant Gegevens**
   - Naam van de klant (auto-filled)

2. **Samenvatting Oplevering** ⭐
   - Beschrijf wat er is uitgevoerd

3. **Foto Upload** ⭐ (NU TOEGEVOEGD)
   - Upload opleverfoto's
   - Vanuit galerij of camera
   - Meerdere foto's mogelijk

4. **Uitgevoerde Taken** ⭐ (NU TOEGEVOEGD)
   - Lijst van voltooide taken uit de offerte
   - Checkbox selectie voor werkbon
   - Alleen voltooide taken kunnen worden geselecteerd

5. **Handtekeningen**
   - Klant handtekening
   - Monteur handtekening

## 📊 Flow Comparison

| Feature | ProjectCompletionSlider (OUD) | ProjectDeliveryDialog (NIEUW) |
|---------|------------------------------|-------------------------------|
| Klant naam | ✅ | ✅ |
| Werkzaamheden beschrijving | ✅ | ✅ |
| Materialen lijst | ✅ | ❌ (niet relevant voor werkbon) |
| Tevredenheid slider | ✅ | ❌ (niet relevant voor werkbon) |
| **Foto upload** | ❌ | ✅ ⭐ |
| **Taken selectie** | ❌ | ✅ ⭐ |
| Handtekeningen | ✅ | ✅ |
| Aanbevelingen | ✅ | ❌ |

## 🎨 UI/UX Verbeteringen

### Voor
- Slider component in sidebar
- Verwarrende interface (slider voor opleveren?)
- Incomplete functionaliteit

### Na
- Duidelijke groene "Project Opleveren" button
- Alleen zichtbaar voor Installateurs
- Alleen zichtbaar als project niet is afgerond
- Helper tekst: "Zorg ervoor dat alle taken zijn voltooid"
- Volledige dialog met alle benodigde velden

## 🔐 Role-Based Access

De button wordt alleen getoond als:
```typescript
profile?.role === 'Installateur' && project?.status !== 'afgerond'
```

Dit betekent:
- ✅ Monteurs kunnen project opleveren
- ❌ Administrators/Administratie zien de button niet (zij gebruiken andere flows)
- ✅ Button verdwijnt na oplevering (project status = 'afgerond')

## 📝 Taken Selectie Details

De `ProjectDeliveryDialog` haalt taken op via:
```typescript
const { tasksByBlock } = useProjectTasks(project.id);

const completedTasks = Object.values(tasksByBlock)
  .flat()
  .filter(task => !task.is_info_block && task.is_completed);
```

**Features:**
- Alleen **voltooide taken** worden getoond
- Info blocks worden uitgefilterd
- Checkbox per taak voor werkbon selectie
- Validatie: Minimaal 1 taak moet geselecteerd zijn
- Taken komen op de gegenereerde werkbon/PDF

## 📸 Foto Upload Details

De foto upload gebruikt het `ImageUpload` component:
```typescript
<ImageUpload 
  onImagesChange={(images) => setFormData(prev => ({ 
    ...prev, 
    deliveryPhotos: images 
  }))}
  maxImages={10}
/>
```

**Features:**
- Meerdere foto's uploaden (max 10)
- Camera of galerij selectie
- Preview van geselecteerde foto's
- Foto's worden opgeslagen in Supabase storage
- Foto's worden gekoppeld aan de project completion

## 🧪 Testing Checklist

- [x] Monteur kan project opleveren vanuit project detail
- [x] Dialog toont foto upload mogelijkheid
- [x] Dialog toont taken selectie lijst
- [x] Alleen voltooide taken verschijnen in lijst
- [x] Taken kunnen worden geselecteerd met checkboxes
- [x] Foto's kunnen worden geupload
- [x] Handtekeningen werken correct
- [x] Validatie werkt (naam, samenvatting, minimaal 1 taak)
- [x] Project wordt correct opgeleverd
- [x] Button verdwijnt na oplevering
- [x] Geen linter errors

## 🎉 Impact

### Voor Monteurs
- ✅ Consistente ervaring: zelfde flow overal
- ✅ Foto's uploaden tijdens oplevering
- ✅ Taken selecteren voor werkbon
- ✅ Duidelijke "Project Opleveren" button
- ✅ Geen verwarring meer over ontbrekende features

### Voor het Systeem
- ✅ Minder code duplication
- ✅ Één getest en bewezen flow
- ✅ Makkelijker te onderhouden
- ✅ Consistente data structuur

## 📚 Related Components

- `src/components/ProjectDetail.tsx` - Main project detail view
- `src/components/dashboard/ProjectDeliveryDialog.tsx` - Complete delivery dialog
- `src/components/dashboard/InstallateurProjectCard.tsx` - Dashboard card (already used this dialog)
- `src/hooks/useProjectDelivery.ts` - Delivery logic
- `src/hooks/useProjectTasks.ts` - Task management

## 🚀 Deployment

- ✅ Ready for production
- ✅ No database migrations needed
- ✅ No breaking changes
- ✅ Backwards compatible (oude oplevering blijft werken tot cache cleared)

---

**Status:** ✅ Geïmplementeerd en getest
**Priority:** High - Was blokkerende issue voor monteurs
**Risk:** Low - Existing tested component reused

