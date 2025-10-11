# Monteur Project Status Fixes

**Datum:** 11 oktober 2025

## 🎯 Opgeloste Issues

### 1. ✅ Project blijft op "Opgeleverd" staan na toevoegen taken

**Probleem:**
- Wanneer een monteur een nieuwe taak toevoegt aan een opgeleverd project, bleef de status op "afgerond" staan
- Dit gaf verwarring omdat het project niet meer 100% compleet was

**Oplossing:**
- **Automatische status reset bij nieuwe taken**: Wanneer een taak wordt toegevoegd aan een project met status "afgerond", wordt de status automatisch gereset naar "in-uitvoering"
- **Status check bij taak updates**: Wanneer een taak wordt gewijzigd (completed/uncompleted) en er zijn incomplete taken, wordt een "afgerond" project automatisch teruggezet naar "in-uitvoering"
- **Query invalidation**: Zowel de `projects` als `monteur-projects` queries worden ge-invalideerd om de wijzigingen direct zichtbaar te maken

**Bestanden aangepast:**
- `src/hooks/useProjectTasks.ts`:
  - `addTaskMutation`: Checkt na toevoegen taak of project status moet worden gereset (regels 109-132)
  - `updateTaskMutation`: Checkt na updaten taak of er incomplete taken zijn en reset status indien nodig (regels 40-79)

---

### 2. ✅ Werkbon en Foto's tabs niet zichtbaar

**Probleem:**
- De tabs "Werkbon" en "Foto's" waren conditional rendered
- Ze verschenen alleen als er data was (`workOrders.length > 0` en `completionPhotos.length > 0`)
- Voor monteurs was dit verwarrend omdat ze niet wisten waar ze moesten kijken

**Oplossing:**
- **Tabs altijd zichtbaar**: Werkbon, Foto's en Bonnetjes tabs zijn nu altijd zichtbaar
- **Badges alleen bij data**: De badge met het aantal items wordt alleen getoond als er data is
- **Empty state**: Wanneer een tab leeg is, wordt een informatieve lege status getoond

**Bestanden aangepast:**
- `src/components/ProjectDetail.tsx`:
  - Werkbon tab: Altijd zichtbaar, badge conditional (regels 416-426)
  - Foto's tab: Altijd zichtbaar, badge conditional (regels 428-438)
  - Bonnetjes tab: Altijd zichtbaar, badge conditional (regels 440-448)

---

### 3. ✅ Bonnetjes toevoegen in Details overzicht

**Probleem:**
- Er was geen snelle manier om bonnetjes te bekijken/toevoegen vanuit het project detail
- Monteurs moesten navigeren naar een apart scherm

**Oplossing:**
- **Bonnetjes knop toegevoegd**: Nieuwe knop in de Details sectie naast "Materiaal" en "Personeel"
- **Badge met aantal**: Toont het aantal bonnetjes als er data is
- **Directe navigatie**: Klikken opent de bonnetjes pagina voor dit specifieke project

**Bestanden aangepast:**
- `src/components/ProjectDetail.tsx`:
  - Nieuwe Bonnetjes button toegevoegd in Details Card (regels 375-386)
  - Navigeert naar `/receipts/project/{projectId}`
  - Badge toont aantal bonnetjes

---

## 📝 Technische Details

### Status Update Logica

```typescript
// Bij toevoegen nieuwe taak
if (project?.status === 'afgerond') {
  await supabase
    .from('projects')
    .update({ 
      status: 'in-uitvoering',
      completion_date: null,
      completion_id: null
    })
    .eq('id', projectId);
}

// Bij updaten taak
const incompleteTasks = allTasks.filter(t => !t.is_completed && !t.is_info_block);
if (incompleteTasks.length > 0 && project.status === 'afgerond') {
  await supabase
    .from('projects')
    .update({ 
      status: 'in-uitvoering',
      completion_date: null,
      completion_id: null
    })
    .eq('id', projectId);
}
```

### Query Invalidation

Na elke status update worden de volgende queries ge-invalideerd:
- `['projects']` - Algemene projecten lijst
- `['monteur-projects']` - Monteur-specifieke projecten
- `['project_tasks', projectId]` - Project taken

Dit zorgt ervoor dat alle componenten automatisch de nieuwe data tonen.

---

## 🧪 Testing Checklist

- [x] Nieuwe taak toevoegen aan afgerond project → Status reset naar "in-uitvoering"
- [x] Taak uncompleten in afgerond project → Status reset naar "in-uitvoering"
- [x] Werkbon tab altijd zichtbaar in project detail
- [x] Foto's tab altijd zichtbaar in project detail
- [x] Bonnetjes tab altijd zichtbaar in project detail
- [x] Bonnetjes knop zichtbaar in Details sectie
- [x] Badge toont correct aantal items
- [x] Geen linter errors
- [x] Query invalidation werkt correct

---

## 🎨 UI Verbeteringen

### Voor
- Werkbon/Foto's tabs: Alleen zichtbaar met data
- Geen bonnetjes knop in Details
- Project bleef op "Opgeleverd" met nieuwe taken

### Na
- Werkbon/Foto's tabs: Altijd zichtbaar met badges
- Bonnetjes knop in Details sectie met badge
- Project status automatisch bijgewerkt bij taak wijzigingen

---

## 🚀 Impact voor Monteurs

1. **Duidelijkere project status**: Status reflecteert nu altijd de actuele staat van taken
2. **Betere navigatie**: Alle tabs zijn altijd zichtbaar, geen verwarring over waar dingen zijn
3. **Snellere toegang**: Bonnetjes direct toegankelijk vanuit project detail
4. **Consistente UX**: Badges tonen duidelijk hoeveel items er zijn

---

## 📚 Related Files

- `src/hooks/useProjectTasks.ts` - Task management en status updates
- `src/components/ProjectDetail.tsx` - Project detail UI en navigatie
- `src/components/ProjectTasks.tsx` - Task list component
- `src/hooks/useMonteurProjects.ts` - Monteur project data fetching

---

**Status:** ✅ Alle issues opgelost en getest
**Linter:** ✅ Geen errors
**Ready for deploy:** ✅ Ja

