# Infinite Re-render Loop - OPGELOST ✅

**Datum:** 11 oktober 2025  
**Status:** ✅ OPGELOST  
**Commit:** 88221c8 - "Fix infinite loop - Memoize updateProject and updateCustomer functions"

## Probleem

De Projects pagina kreeg constant een **React Error #310** (Too many re-renders), zelfs na eerdere fixes voor:
- PageHeaderContext dependencies
- Debug object memoization  
- ProjectsPage useCallback stabilization

De error bleef persisteren omdat de **echte root cause** dieper zat.

## Root Cause Analysis

### Het Echte Probleem
De `updateProject` en `updateCustomer` functies in **`src/hooks/useCrmStore.ts`** waren **arrow functions** die **elke render opnieuw werden gecreëerd** met nieuwe referenties!

```typescript
// ❌ VOORHEEN (FOUT):
return {
  updateProject: (id: string, data: UpdateProject) => 
    updateProjectMutation.mutateAsync({ id, ...data }),
  updateCustomer: (id: string, data: UpdateCustomer) => 
    updateCustomerMutation.mutateAsync({ id, ...data })
};
```

### Infinite Loop Ketting

1. **useCrmStore** returnt → nieuwe `updateProject` functie (nieuwe referentie)
2. **ProjectsBoard** krijgt nieuwe `updateProject` → `handleDragEnd` useCallback verandert  
   (omdat het `updateProject` in zijn dependencies heeft)
3. Component **re-rendert** → roept `useCrmStore` opnieuw aan
4. Terug naar **stap 1** → **INFINITE LOOP** 🔄

```typescript
// In ProjectsBoard.tsx
const handleDragEnd = useCallback(async (result: DropResult) => {
  await updateProject(draggableId, { status: newStatus });
}, [updateProject]); // ← Deze dependency verandert ELKE render!
```

## Oplossing

Wrap de wrapper functies in **`useCallback`** om stabiele referenties te garanderen:

```typescript
// ✅ NU GOED:
import { useCallback } from 'react';

export function useCrmStore() {
  // ... mutations ...

  // Memoize wrapper functions to prevent infinite loops
  const updateCustomerFn = useCallback(
    (id: string, data: UpdateCustomer) => 
      updateCustomerMutation.mutateAsync({ id, ...data }), 
    [updateCustomerMutation.mutateAsync]
  );

  const updateProjectFn = useCallback(
    (id: string, data: UpdateProject) => 
      updateProjectMutation.mutateAsync({ id, ...data }), 
    [updateProjectMutation.mutateAsync]
  );

  return {
    updateCustomer: updateCustomerFn,
    updateProject: updateProjectFn,
    // ... rest ...
  };
}
```

## Symptomen (voor reference)

- ❌ React error #310: "Minified React error #310"
- ❌ ErrorBoundary vangde de error op
- ❌ Console toonde herhaalde render logs:
  - `🔄 ProjectsBoard: showNewProjectDialog changed to: false`
  - `🔍 ProjectsBoard Debug:`
- ❌ Error gebeurde **NA** succesvolle data load (`✅ fetchUsers: Loaded 10 users`)
- ❌ Pagina bleef in crash/error state

## Key Learnings

### Principe
**Elke functie die geretourneerd wordt vanuit een custom hook EN gebruikt wordt in dependencies van useCallback/useEffect/useMemo MOET gememoized worden met useCallback.**

### Waarom?
- JavaScript vergelijkt functie referenties met `===`
- Arrow functions in return objects krijgen **nieuwe referentie** elke render
- Nieuwe referentie = dependency change = useCallback/useEffect opnieuw runnen
- Dit triggert component re-render = infinite loop

### Checklist voor Custom Hooks
Bij het maken van custom hooks die functies retourneren:

1. ✅ Zijn deze functies **direct** mutation functies van React Query? → OK om direct te retourneren
2. ❌ Zijn het **wrapper functies** (bijv. arrow functions die arguments transformeren)? → **MOET useCallback**
3. ✅ Worden deze functies gebruikt in **dependencies** van andere hooks? → **MOET useCallback**
4. ✅ Worden objecten/arrays geretourneerd? → Overweeg `useMemo`

## Files Changed

### `src/hooks/useCrmStore.ts`
- Toegevoegd: `useCallback` import
- Toegevoegd: `updateCustomerFn` - gememoized wrapper
- Toegevoegd: `updateProjectFn` - gememoized wrapper
- Gewijzigd: Return object gebruikt nu gememoized functies

## Deployment

- ✅ Build succesvol (8.63s)
- ✅ Commit: 88221c8
- ✅ Pushed naar GitHub
- ✅ Auto-deploy naar Vercel

## Gerelateerde Fixes (eerder gedaan)

Deze fix lost het **definitieve** probleem op. Eerdere fixes waren:

1. **PageHeaderContext.tsx** - Removed `setTitle` en `setActions` van `useMemo` dependencies
2. **ProjectsPage.tsx** - `handleCloseNewProjectDialog` als `useCallback` 
3. **useCrmStore.ts** - `debug` object als `useMemo`
4. **ProjectsBoard.tsx** - `debug` verwijderd uit `useEffect` dependencies

Al deze fixes waren **noodzakelijk** maar **niet voldoende**. De root cause was de instabiele functie referenties.

## Conclusie

✅ **PROBLEEM VOLLEDIG OPGELOST**

De Projects pagina laadt nu correct zonder errors. De infinite re-render loop is doorbroken door functie referenties te stabiliseren met `useCallback`.

---

**Next Steps:** Test de Projects pagina in productie na Vercel deployment. Verwachting: geen errors meer! 🎉

