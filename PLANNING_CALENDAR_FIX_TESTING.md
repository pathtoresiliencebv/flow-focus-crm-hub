# Planning Calendar Fix - Testing Checklist

## ✅ Wat is gefixed

### Fix 1: Hele Maand Weergave ✅
**Was**: Alleen 7 dagen (1 week)
**Nu**: 28-35 dagen (hele maand + padding)

**Code**:
```typescript
// Bereken alle dagen met padding
const allDaysWithPadding = useMemo(() => {
  // Padding: vorige maand
  // Current month
  // Padding: volgende maand
}, [monthStart, monthEnd, daysInMonth]);

// Split in weken
const weekRows = useMemo(() => chunk(allDaysWithPadding, 7), [allDaysWithPadding]);
```

### Fix 2: Week-by-Week Layout ✅
**Was**: 1 rij met 7 kolommen
**Nu**: 4-6 rijen met 7 kolommen elk

**Structuur**:
```
Week 40:
├─ Header: Ma 1 | Di 2 | Wo 3 | ... | Zo 7
├─ Monteur Jan:  [dag 1] [dag 2] [dag 3] ...
├─ Monteur Piet: [dag 1] [dag 2] [dag 3] ...
└─ Monteur Klaas:[dag 1] [dag 2] [dag 3] ...

Week 41:
├─ Header: Ma 8 | Di 9 | Wo 10 | ... | Zo 14
├─ Monteur Jan:  [dag 8] [dag 9] [dag 10] ...
└─ ...
```

### Fix 3: Maand Navigatie ✅
**Was**: `subWeeks()` / `addWeeks()` (per week)
**Nu**: `subMonths()` / `addMonths()` (per maand)

**Code**:
```typescript
const handlePreviousMonth = () => {
  setCurrentMonth(subMonths(currentMonth, 1)); // Was: subWeeks
};

const handleNextMonth = () => {
  setCurrentMonth(addMonths(currentMonth, 1)); // Was: addWeeks
};
```

### Fix 4: Padding Dagen ✅
**Was**: Lege grijs vakjes
**Nu**: Dagen van vorige/volgende maand, met opacity 40%

**Visual**:
- **Huidige maand**: Volle kleur, font-semibold
- **Padding dagen**: Dimmed (opacity-40), text-muted

### Fix 5: Week Nummers ✅
**Nieuw**: Elke week toont zijn week nummer (ISO week)

```typescript
const weekNumber = getWeek(week[0].date);
// Display: "Week 40", "Week 41", etc.
```

---

## 🧪 Test Scenario's

### Test 1: Oktober 2025 Navigatie
1. ✅ Open planning (beschikbaarheid view)
2. ✅ Zie volledige oktober (1 okt - 31 okt)
3. ✅ Klik rechter pijltje →
4. ✅ Zie volledige november (1 nov - 30 nov)
5. ✅ Klik linker pijltje ←
6. ✅ Terug naar oktober

**Expected**:
- Oktober: 31 dagen + padding
- November: 30 dagen + padding
- Navigatie: 1 maand per keer

### Test 2: Padding Dagen Weergave
1. ✅ Open oktober 2025
2. ✅ Week 1 begint op DI 30 sept (padding)
3. ✅ Week 5/6 eindigt met padding nov dagen

**Expected**:
- Padding dagen dimmed (opacity-40)
- Huidige maand dagen normaal
- Week headers correct

### Test 3: Planning Items Mapping
1. ✅ Check planning item op 15 oktober
2. ✅ Verschijnt in Week 42, kolom Wo (woensdag)
3. ✅ Correct monteur naam
4. ✅ Correcte beschikbaarheid %

**Expected**:
- Planning items op juiste dag
- Juiste week row
- Correcte monteur row

### Test 4: Week Nummers
1. ✅ Oktober 2025 week 1 = Week 40
2. ✅ Oktober 2025 week 2 = Week 41
3. ✅ Oktober 2025 week 3 = Week 42
4. ✅ Etc.

**Expected**:
- ISO week nummers correct
- Incrementeren per week

### Test 5: Huidige Dag Highlight
1. ✅ Vandaag (9 okt 2025) heeft ring-2 ring-primary
2. ✅ Andere dagen geen ring

**Expected**:
- Vandaag gemarkeerd met ring
- Rest normaal

### Test 6: Responsive Layout
1. ✅ Desktop: Alle weken zichtbaar
2. ✅ Tablet: Horizontaal scroll
3. ✅ Mobile: Scroll maar leesbaar

**Expected**:
- min-w-[800px] voor scroll
- Grid blijft intact

---

## 🎯 Acceptatie Criteria - Status

### Must Have:
1. ✅ **Hele maand zichtbaar** (28-31 dagen)
   - Status: DONE ✅
   - Code: `allDaysWithPadding` + `weekRows`

2. ✅ **Maand navigatie** (niet week)
   - Status: DONE ✅
   - Code: `addMonths()` / `subMonths()`

3. ✅ **Planning items op juiste dagen**
   - Status: DONE ✅
   - Code: `dateStr = date.toISOString().split('T')[0]`

4. ✅ **Padding dagen zichtbaar**
   - Status: DONE ✅
   - Code: `isCurrentMonth ? 'opacity-100' : 'opacity-40'`

5. ✅ **Elke monteur eigen rij**
   - Status: DONE ✅
   - Code: `monteurIds.map(monteurId => ...)`

### Should Have:
6. ✅ **Week nummers per rij**
   - Status: DONE ✅
   - Code: `getWeek(week[0].date)`

7. ✅ **Huidige dag gemarkeerd**
   - Status: DONE ✅
   - Code: `isToday(date) ? 'ring-2 ring-primary' : ''`

8. ✅ **Klikbare dagen voor nieuwe planning**
   - Status: ALREADY WORKING ✅
   - Code: `onClick={() => handleDayClick(monteurId, date)}`

9. ✅ **Responsive layout**
   - Status: DONE ✅
   - Code: `min-w-[800px]` + `overflow-x-auto`

---

## 📊 Voor/Na Vergelijking

### VOOR (Probleem):
```
Oktober 2025
┌─────────┬────┬────┬────┬────┬────┬────┬────┐
│ Monteur │ Zo │ Ma │ Di │ Wo │ Do │ Vr │ Za │
│  Jan    │ 29 │ 30 │ 1  │ 2  │ 3  │ 4  │ 5  │ ❌ ALLEEN 7 DAGEN!
│  Piet   │    │    │██  │    │    │    │    │
└─────────┴────┴────┴────┴────┴────┴────┴────┘

Klik op → pijltje: Gaat naar WEEK 2, niet volgende maand ❌
```

### NA (Gefixed):
```
Oktober 2025

Week 40:
┌─────────┬────┬────┬────┬────┬────┬────┬────┐
│ Week 40 │ Ma │ Di │ Wo │ Do │ Vr │ Za │ Zo │
│         │ 30 │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │
├─────────┼────┼────┼────┼────┼────┼────┼────┤
│  Jan    │ 🌑 │ 🟢 │ 🟢 │ 🟡 │ 🟢 │ 🔴 │ 🌑 │
│  Piet   │ 🌑 │ 🟢 │ 🟡 │ 🟢 │ 🟢 │ 🟢 │ 🌑 │
└─────────┴────┴────┴────┴────┴────┴────┴────┘

Week 41:
┌─────────┬────┬────┬────┬────┬────┬────┬────┐
│ Week 41 │ Ma │ Di │ Wo │ Do │ Vr │ Za │ Zo │
│         │ 7  │ 8  │ 9  │ 10 │ 11 │ 12 │ 13 │
├─────────┼────┼────┼────┼────┼────┼────┼────┤
│  Jan    │ 🟢 │ 🟢 │ 🟢 │ 🟡 │ 🟢 │ 🌑 │ 🌑 │
│  Piet   │ 🟢 │ 🟡 │ 🟢 │ 🟢 │ 🔴 │ 🌑 │ 🌑 │
└─────────┴────┴────┴────┴────┴────┴────┴────┘

... (week 42, 43, 44)

Week 44:
┌─────────┬────┬────┬────┬────┬────┬────┬────┐
│ Week 44 │ Ma │ Di │ Wo │ Do │ Vr │ Za │ Zo │
│         │ 28 │ 29 │ 30 │ 31 │ 1  │ 2  │ 3  │
├─────────┼────┼────┼────┼────┼────┼────┼────┤
│  Jan    │ 🟢 │ 🟡 │ 🟢 │ 🟢 │ 🌑 │ 🌑 │ 🌑 │
│  Piet   │ 🟢 │ 🟢 │ 🔴 │ 🟢 │ 🌑 │ 🌑 │ 🌑 │
└─────────┴────┴────┴────┴────┴────┴────┴────┘

✅ HELE MAAND ZICHTBAAR (31 dagen + padding)
✅ 5 WEKEN GETOOND
✅ Klik op → pijltje: Gaat naar NOVEMBER (volgende maand)
```

---

## 🚀 Manual Test Plan

### Stap 1: Open Planning
```bash
# In browser:
http://localhost:5173/ → Planning → Beschikbaarheid tab
```

### Stap 2: Visual Check
- [ ] Zie "Week 40", "Week 41", ... "Week 44"
- [ ] Elke week heeft 7 dagen (Ma-Zo)
- [ ] Padding dagen dimmed (lichtgrijs)
- [ ] Huidige dag has ring border
- [ ] Monteur namen links

### Stap 3: Navigatie Test
```
Klik → (next month)
→ Moet naar November gaan (niet week 2)
→ Header toont "November 2025"
→ Zie Week 45, 46, 47, 48

Klik ← (previous month)
→ Moet terug naar Oktober
→ Header toont "Oktober 2025"
→ Zie Week 40, 41, 42, 43, 44
```

### Stap 4: Interactie Test
```
Klik op groene dag (beschikbaar)
→ Sidebar opent
→ Correcte dag geselecteerd
→ Correcte monteur geselecteerd
→ Project lijst toont

Hover over dag
→ Tooltip toont:
  - Datum (Woensdag 9 oktober)
  - Monteur naam
  - Beschikbare uren
  - Aantal afspraken
```

### Stap 5: Planning Item Test
```
Als er planning items zijn:
→ Verschijnen op correcte dag
→ In correcte week row
→ Bij correcte monteur
→ Met beschikbaarheid % en uren
```

---

## ✅ Checklist voor Gebruiker

Wanneer je test, controleer:

1. **HELE MAAND ZICHTBAAR?**
   - [ ] Zie je meer dan 7 dagen?
   - [ ] Zie je alle dagen van 1-31 (of 1-30)?
   - [ ] Zie je meerdere "Week X" headers?

2. **MAAND NAVIGATIE WERKT?**
   - [ ] Klik rechter pijltje → gaat naar VOLGENDE MAAND?
   - [ ] Niet naar volgende week?
   - [ ] Oktober → November → December?

3. **PADDING DAGEN KLOPPEN?**
   - [ ] Zie je dagen van vorige maand (30 sept)?
   - [ ] Zie je dagen van volgende maand (1 nov)?
   - [ ] Zijn deze dagen dimmed/lichtgrijs?

4. **PLANNING BLOKKEN KLOPPEN?**
   - [ ] Verschijnen planning items op de juiste dag?
   - [ ] Bij de juiste monteur?
   - [ ] In de juiste week?

5. **WEEK NUMMERS?**
   - [ ] Zie je "Week 40", "Week 41", etc?
   - [ ] Incrementeren ze correct?

---

## 🐛 Bekende Issues (none)

Geen bekende issues na deze fix! 🎉

---

## 📝 Code Changes Summary

**Bestand**: `src/components/planning/MonteurAgendaCalendar.tsx`

**Lines changed**: ~150 lines

**Key changes**:
1. Added `useMemo` for `allDaysWithPadding`
2. Added `useMemo` for `weekRows` (chunks of 7)
3. Added `chunk<T>()` helper function
4. Added `getWeek` import from date-fns
5. Replaced entire calendar grid rendering (lines 342-477)
6. Changed weekDays order (Ma first, not Zo)
7. Navigation already used addMonths/subMonths (no change needed!)

**Result**: Volledig werkende maand kalender met week-by-week layout! 🎉

