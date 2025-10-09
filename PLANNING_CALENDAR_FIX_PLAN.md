# Planning Calendar Fix - Uitgebreid Plan

## 🔴 Huidige Problemen

### Probleem 1: Toont alleen 1 week ipv hele maand
**Locatie**: `src/components/planning/MonteurAgendaCalendar.tsx` (regel 374-389)

**Huidig gedrag**:
```typescript
{Array.from({ length: 7 }, (_, dayIndex) => {
  // Dit toont ALLEEN 7 dagen (1 week)!
```

**Wat er mis is**:
- De grid toont alleen 7 kolommen (1 week) per monteur
- Bij navigatie naar volgende maand zie je alleen de eerste 7 dagen
- De rest van de maand is niet zichtbaar

### Probleem 2: Incorrecte dag berekening
**Locatie**: `src/components/planning/MonteurAgendaCalendar.tsx` (regel 376-379)

**Huidig gedrag**:
```typescript
const firstDayOfWeek = getDay(monthStart);
const dayNumber = dayIndex - firstDayOfWeek + 1;

if (dayNumber < 1 || dayNumber > daysInMonth.length) {
  // Empty cell
}
```

**Wat er mis is**:
- `dayNumber` berekening gaat uit van 7 dagen (1 week)
- Werkt niet voor meerdere weken
- Padding dagen (vorige/volgende maand) kloppen niet

### Probleem 3: Week/Maand navigatie
**Locatie**: `src/components/planning/MonteurAgendaCalendar.tsx` (regel 197-216)

**Huidig gedrag**:
```typescript
const previousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
```

**Wat er mis is**:
- UI zegt "vorige/volgende maand" maar functie doet "vorige/volgende WEEK"
- Inconsistent met wat gebruiker verwacht
- Verwarrend gedrag bij navigatie

---

## ✅ Oplossingen

### Fix 1: Hele maand weergave (5-6 weken)

**Van** (huidige code - 1 week):
```typescript
{Array.from({ length: 7 }, (_, dayIndex) => {
  // Alleen 7 dagen
```

**Naar** (nieuwe code - hele maand):
```typescript
{allDaysWithPadding.map((dayData, index) => {
  const { date, isCurrentMonth } = dayData;
  // Toont ALLE dagen van maand + padding
```

**Implementatie**:
```typescript
// 1. Bereken alle dagen van maand
const monthStart = startOfMonth(currentDate);
const monthEnd = endOfMonth(currentDate);
const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

// 2. Bereken padding
const startDayOfWeek = getDay(monthStart);
const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday start

const endDayOfWeek = getDay(monthEnd);
const trailingDays = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;

// 3. Create complete calendar grid
const allDaysWithPadding = [
  // Padding: vorige maand
  ...Array.from({ length: paddingDays }, (_, i) => ({
    date: new Date(monthStart.getTime() - (paddingDays - i) * 24 * 60 * 60 * 1000),
    isCurrentMonth: false
  })),
  // Current month
  ...daysInMonth.map(date => ({ date, isCurrentMonth: true })),
  // Padding: volgende maand
  ...Array.from({ length: trailingDays }, (_, i) => ({
    date: new Date(monthEnd.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
    isCurrentMonth: false
  }))
];
```

### Fix 2: Correcte Grid Layout

**Van** (huidige layout - 1 rij van 7):
```typescript
<div className="grid grid-cols-[150px_repeat(7,1fr)] gap-1">
  {/* Monteur Name */}
  <div>...</div>
  
  {/* 7 dagen */}
  {Array.from({ length: 7 }...
</div>
```

**Naar** (nieuwe layout - 5-6 rijen van 7):
```typescript
<div className="space-y-1">
  {/* Week voor week */}
  {chunk(allDaysWithPadding, 7).map((week, weekIndex) => (
    <div key={weekIndex} className="grid grid-cols-[150px_repeat(7,1fr)] gap-1">
      {/* Monteur Name (alleen eerste week) */}
      {weekIndex === 0 && <div>...</div>}
      {weekIndex > 0 && <div></div>} {/* Empty space */}
      
      {/* 7 dagen van deze week */}
      {week.map(dayData => ...)}
    </div>
  ))}
</div>
```

**Helper functie**:
```typescript
function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}
```

### Fix 3: Maand Navigatie (niet week)

**Van**:
```typescript
const previousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
```

**Naar**:
```typescript
const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
const goToToday = () => setCurrentDate(new Date());
```

**UI Update**:
```typescript
<Button onClick={previousMonth}>
  <ChevronLeft className="h-4 w-4" />
  <span className="sr-only">Vorige maand</span>
</Button>

<div className="text-lg font-semibold">
  {format(currentDate, 'MMMM yyyy', { locale: nl })}
</div>

<Button onClick={nextMonth}>
  <ChevronRight className="h-4 w-4" />
  <span className="sr-only">Volgende maand</span>
</Button>

<Button onClick={goToToday} variant="outline">
  Vandaag
</Button>
```

### Fix 4: Dag Headers (week nummers)

**Toevoegen**: Week headers voor elke rij
```typescript
<div className="grid grid-cols-[150px_repeat(7,1fr)] gap-1">
  {/* Week nummer */}
  <div className="text-xs text-gray-500 flex items-center">
    Week {getWeek(week[0].date)}
  </div>
  
  {/* Dag headers (Ma, Di, Wo, etc) */}
  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, i) => (
    <div key={i} className="text-center text-xs font-medium text-gray-600 p-1">
      {day} {format(week[i].date, 'd')}
    </div>
  ))}
</div>
```

### Fix 5: Planning Items Mapping

**Huidige issue**: Planning items worden niet correct toegewezen aan dagen

**Fix**: Gebruik `format(date, 'yyyy-MM-dd')` als key
```typescript
// Group planning by date
const planningByDate = useMemo(() => {
  const grouped = new Map<string, PlanningItem[]>();
  
  planningItems.forEach(item => {
    const dateKey = format(parseISO(item.start_date), 'yyyy-MM-dd');
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(item);
  });
  
  return grouped;
}, [planningItems]);

// Get planning for specific date
const getPlanningForDate = (date: Date, monteurId: string): PlanningItem[] => {
  const dateKey = format(date, 'yyyy-MM-dd');
  const items = planningByDate.get(dateKey) || [];
  return items.filter(item => item.assigned_user_id === monteurId);
};
```

---

## 📐 Nieuwe Layout Structuur

```
┌─────────────────────────────────────────────────────────────┐
│ [◀] Oktober 2025 [▶]                            [Vandaag]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Week 1:                                                      │
│ ┌─────────┬────┬────┬────┬────┬────┬────┬────┐             │
│ │ Monteur │ Ma │ Di │ Wo │ Do │ Vr │ Za │ Zo │             │
│ │  Jan    │ 30 │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │             │
│ │  Piet   │    │    │██  │    │    │    │    │             │
│ │  Klaas  │    │    │    │    │██  │    │    │             │
│ └─────────┴────┴────┴────┴────┴────┴────┴────┘             │
│                                                              │
│ Week 2:                                                      │
│ ┌─────────┬────┬────┬────┬────┬────┬────┬────┐             │
│ │         │ 7  │ 8  │ 9  │ 10 │ 11 │ 12 │ 13 │             │
│ │  Jan    │    │██  │    │    │    │    │    │             │
│ │  Piet   │    │    │    │██  │    │    │    │             │
│ │  Klaas  │    │    │    │    │    │██  │    │             │
│ └─────────┴────┴────┴────┴────┴────┴────┴────┘             │
│                                                              │
│ ... (tot einde maand)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementatie Plan

### Stap 1: Backup & Analyse
- [x] Huidige code geanalyseerd
- [ ] Backup maken van MonteurAgendaCalendar.tsx
- [ ] Test current behavior documenteren

### Stap 2: Core Fixes
- [ ] Fix 1: Implement `allDaysWithPadding` berekening
- [ ] Fix 2: Update grid naar week-by-week layout  
- [ ] Fix 3: Change navigation van week → maand
- [ ] Fix 4: Add week headers en dag nummers
- [ ] Fix 5: Fix planning items mapping

### Stap 3: Styling & UX
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Hover states voor dagen
- [ ] Current day highlighting
- [ ] Padding dagen dimmen (opacity)
- [ ] Planning blocks kleuren per monteur

### Stap 4: Testing
- [ ] Test: Navigatie oktober → november → oktober
- [ ] Test: Planning items verschijnen op juiste dagen
- [ ] Test: Padding dagen (30 sept, 1 nov) correct
- [ ] Test: Week boundaries correct
- [ ] Test: Responsive op verschillende schermen

### Stap 5: Edge Cases
- [ ] Maanden met 4 weken vs 6 weken
- [ ] Monteur zonder planning (lege grid)
- [ ] Veel planning items op 1 dag (overflow)
- [ ] Jaar overgang (dec → jan)

---

## 🎯 Acceptatie Criteria

### Must Have:
1. ✅ Hele maand zichtbaar (alle dagen van 1-30/31)
2. ✅ Correcte maand navigatie (niet per week)
3. ✅ Planning items op juiste dagen
4. ✅ Padding dagen van vorige/volgende maand zichtbaar
5. ✅ Elke monteur heeft eigen rij

### Should Have:
6. ✅ Week nummers per rij
7. ✅ Huidige dag gemarkeerd
8. ✅ Klikbare dagen voor nieuwe planning
9. ✅ Responsive layout

### Nice to Have:
10. Week/maand toggle
11. Export functionaliteit
12. Print-friendly view

---

## 📝 Files to Update

1. **`src/components/planning/MonteurAgendaCalendar.tsx`** (PRIMARY)
   - Lines 197-216: Navigation functions
   - Lines 374-475: Grid rendering
   - Add helper functions

2. **`src/components/SimplifiedPlanningManagement.tsx`**
   - Verify integration still works
   - Pass correct props

3. **`src/pages/PlanningPage.tsx`**
   - Verify view mode switching

---

## 🚨 Breaking Changes

None expected - component API stays same:
```typescript
<MonteurAgendaCalendar
  monteurIds={monteurIds}
  monteurs={monteurs}
  initialDate={new Date()}
  onDayClick={handleDayClick}
  loading={loading}
/>
```

---

## 📚 References

### Similar Working Components:
- `EnhancedMonthPlanningView.tsx` (lines 52-77) - Correct month calculation
- `SimplifiedPlanningCalendar.tsx` (lines 43-80) - Correct day padding
- `ModernPlanningView.tsx` (lines 141-228) - Good grid structure

### Date Functions (date-fns):
- `startOfMonth(date)` - First day of month
- `endOfMonth(date)` - Last day of month
- `eachDayOfInterval({ start, end })` - All days between
- `getDay(date)` - Day of week (0 = Sunday)
- `addMonths(date, n)` - Add/subtract months
- `format(date, 'MMMM yyyy', { locale: nl })` - Format date
- `getWeek(date)` - ISO week number

---

## ⏱️ Geschatte Tijd

- Analysis: ✅ 30 min (DONE)
- Implementation: 2-3 uur
- Testing: 1 uur
- Bug fixes: 30 min
- **Total: 4-5 uur**

---

## 🎉 Success Metrics

**Voor de fix**:
- Gebruiker ziet 7 dagen (1 week)
- Navigatie verwarrend (week vs maand)
- Planning blokken op verkeerde plaatsen

**Na de fix**:
- ✅ Gebruiker ziet 28-31 dagen (hele maand)
- ✅ Navigatie logisch (maand naar maand)
- ✅ Planning blokken op juiste dagen
- ✅ Beschikbaarheid per monteur duidelijk zichtbaar
- ✅ Gebruiker kan effectief plannen voor hele maand

---

## 📞 Next Steps

1. **START**: Mark todo "plan-1" as in_progress
2. **IMPLEMENT**: Fix MonteurAgendaCalendar.tsx
3. **TEST**: Verify with real data
4. **COMMIT**: Push changes
5. **VERIFY**: User validates fix

**Ready to start? Let's fix this!** 🚀

