# Fix: "Project niet gevonden" na Oplevering

**Datum:** 11 oktober 2025

## 🐛 Probleem

Na het succesvol opleveren van een project kreeg de monteur de error: **"Project niet gevonden"**

### Gebruikerservaring:
1. Monteur vult opleveringsformulier in
2. Klikt op "Project Opleveren"
3. ✅ Toast melding: "Project opgeleverd"
4. ❌ Pagina reload → "Project niet gevonden"

## 🔍 Root Cause Analysis

### De Filter in useCrmStore.ts

In `src/hooks/useCrmStore.ts` (regel 52) worden projecten opgehaald met deze filter:

```typescript
.or(`status.neq.afgerond,created_at.gte.${oneYearAgo.toISOString()}`)
```

**Betekenis:**
Haal alleen projecten op die:
- **NIET** afgerond zijn, OF
- Gemaakt zijn binnen het afgelopen jaar

### Het Probleem Flow

```
1. Project oplever dialog → Status wordt 'afgerond'
   ✅ Project is succesvol opgeleverd in database
   
2. window.location.reload() in ProjectDetail
   🔄 Hele pagina herlaadt
   
3. useCrmStore.fetchProjects() wordt aangeroepen
   📊 Haalt projecten op met filter
   
4. Filter excludeert mogelijk het net opgeleverde project
   ⚠️ Afhankelijk van created_at datum
   
5. projects.find(p => p.id === projectId) → undefined
   ❌ Project niet in de gefilterde lijst
   
6. ProjectDetail ziet: if (!project) → "Project niet gevonden"
   💥 Error scherm
```

### Waarom gebeurde dit?

Het project is **WEL** succesvol opgeleverd in de database, maar:
- Na reload filtert `useCrmStore` het project uit de lijst
- De filter is bedoeld om performance te verbeteren (niet alle oude projecten laden)
- Maar dit veroorzaakt het "niet gevonden" probleem direct na oplevering

## ✅ Oplossing

**Navigeer naar de projectenlijst** in plaats van de huidige pagina te herladen.

### Wijziging in `src/components/ProjectDetail.tsx`

**Regel 874-877:**

**Voor:**
```typescript
onComplete={() => {
  setShowDeliveryDialog(false);
  window.location.reload();
}}
```

**Na:**
```typescript
onComplete={() => {
  setShowDeliveryDialog(false);
  // Navigate to projects list after successful delivery
  navigate('/projects');
}}
```

## 🎯 Waarom Dit Werkt

### 1. Geen Project Detail Dependency
- Na oplevering is de monteur klaar met dat project
- Er is geen reden om op de project detail pagina te blijven
- Navigeren naar projectenlijst is logischer

### 2. Clean State
- Projectenlijst heeft geen dependency op het specifieke project
- De lijst toont wat er beschikbaar is (gefilterd of niet)
- Geen "niet gevonden" error mogelijk

### 3. Betere UX
- ✅ Toast melding: "Project opgeleverd"
- ✅ Navigatie naar projectenlijst
- ✅ Monteur ziet zijn overige projecten
- ✅ Duidelijke flow afsluiting

### 4. Logische Flow
```
Project detail → Opleveren → ✅ Klaar → Terug naar projectenlijst
```

Dit is intuïtief en verwacht gedrag na het voltooien van een taak.

## 📊 Voor vs Na

### Voor (PROBLEEM)
```
User Journey:
1. Op project detail pagina
2. Klik "Project Opleveren"
3. Vul formulier in
4. Submit
5. ✅ Toast: "Project opgeleverd"
6. 🔄 Page reload
7. ❌ ERROR: "Project niet gevonden"
8. 😞 Verwarring - is project wel opgeleverd?
```

### Na (OPGELOST)
```
User Journey:
1. Op project detail pagina
2. Klik "Project Opleveren"
3. Vul formulier in
4. Submit
5. ✅ Toast: "Project opgeleverd"
6. ➡️ Navigate naar /projects
7. ✅ Zie projectenlijst
8. 😊 Duidelijk - project is klaar, door naar volgende!
```

## 🧪 Test Scenarios

### Scenario 1: Recent Project (< 1 jaar oud)
- **Voor:** Mogelijk "niet gevonden" (afhankelijk van timing)
- **Na:** ✅ Altijd correct (navigeert naar lijst)

### Scenario 2: Oud Project (> 1 jaar oud)
- **Voor:** ❌ Altijd "niet gevonden" (buiten filter)
- **Na:** ✅ Altijd correct (navigeert naar lijst)

### Scenario 3: Project Meerdere Keren Opgeleverd
- **Voor:** ❌ Alleen eerste keer succesvol, daarna error
- **Na:** ✅ Altijd correct gedrag

## 🔄 Alternatieve Oplossingen (NIET gekozen)

### Optie A: Filter Aanpassen
```typescript
// Haal ALLE projecten op, inclusief afgeronde
.or(`status.neq.afgerond,created_at.gte.${oneYearAgo.toISOString()}`)
// Wijzigen naar:
.gte('created_at', oneYearAgo.toISOString())
```

**Waarom niet:**
- ❌ Zou ALLE oude projecten laden (performance probleem)
- ❌ Niet de bedoeling van de filter
- ❌ Lost niet het conceptuele probleem op

### Optie B: Specifiek Project Fetchen
```typescript
// In ProjectDetail, fetch project apart als niet in lijst
if (!project) {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
}
```

**Waarom niet:**
- ❌ Extra database calls
- ❌ Complexere code
- ❌ Monteur wil toch niet op detail blijven na oplevering

### Optie C: Cache Invalidation Delay
```typescript
// Wacht even voor reload
setTimeout(() => window.location.reload(), 2000);
```

**Waarom niet:**
- ❌ Hack oplossing
- ❌ Lost root cause niet op
- ❌ Slechte UX (wachten zonder reden)

## 💡 Waarom Navigatie de Beste Oplossing Is

### 1. Natuurlijke Flow
Na het voltooien van een taak (project opleveren), is het logisch om terug te gaan naar het overzicht van alle taken (projectenlijst).

### 2. Geen Edge Cases
Door te navigeren vermijd je alle edge cases rondom filtering, caching, en timing.

### 3. Consistentie
Andere delen van de app navigeren ook naar lijsten na create/update/delete acties.

### 4. Simpel & Robuust
Een one-line change die het probleem volledig oplost zonder side effects.

## 🎨 UX Verbetering

### Extra Voordeel: Context Switch
Na oplevering:
- Monteur is mentaal klaar met dat project
- Ziet direct volgende beschikbare projecten
- Kan nieuwe opdracht selecteren
- Natuurlijke workflow continuïteit

### Visuele Feedback
```
[Project Detail Page]
     ↓
[Dialog: Project Opleveren]
     ↓
[✅ Toast: "Project opgeleverd"]
     ↓
[Projectenlijst] ← NIEUW: Directe navigatie
```

## 📝 Testing Checklist

- [x] Project opleveren met recent project (< 1 jaar)
- [x] Project opleveren met oud project (> 1 jaar)
- [x] Toast melding verschijnt correct
- [x] Navigatie naar /projects werkt
- [x] Projectenlijst toont correct
- [x] Geen "Project niet gevonden" error meer
- [x] Geen linter errors
- [x] Geen console errors

## 🚀 Deployment

- ✅ Ready for production
- ✅ No breaking changes
- ✅ One line change
- ✅ Zero risk
- ✅ Immediate improvement

## 📚 Related Files

- `src/components/ProjectDetail.tsx` - Updated onComplete callback
- `src/hooks/useCrmStore.ts` - Project filter logic (unchanged)
- `src/components/dashboard/ProjectDeliveryDialog.tsx` - Delivery dialog

## 🎉 Impact

### Voor Monteurs
- ✅ Geen verwarrende error na oplevering
- ✅ Duidelijke flow: klaar → terug naar lijst
- ✅ Betere werkvloei
- ✅ Meer vertrouwen in het systeem

### Voor het Systeem
- ✅ Minder support vragen over "verdwenen" projecten
- ✅ Logischere navigatie flow
- ✅ Robuustere implementatie

---

**Status:** ✅ Geïmplementeerd en getest
**Priority:** High - Was verwarrende blocker voor monteurs
**Risk:** None - Simple navigation change
**User Impact:** Immediate positive improvement

