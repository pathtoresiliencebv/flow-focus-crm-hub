# CRITICAL FIXES PLAN
## Date: 2025-10-09
## Status: 🚨 URGENT - Multiple Critical Issues

---

## 🔴 CRITICAL ERRORS (Fix First)

### 1. **Receipts/Bonnetjes - ReferenceError**
**Error:** `ReferenceError: Cannot access 'K' before initialization`
**File:** `src/components/Receipts.tsx`
**Impact:** 🔴 Page completely broken
**Priority:** P0 - CRITICAL
**Fix:** Variable hoisting issue - move declarations to top

### 2. **Searchable Customer Select - Iterator Error**
**Error:** `TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))`
**File:** `src/components/quotes/searchable-customer-select.tsx`
**Impact:** 🔴 Cannot select customer in quotes
**Priority:** P0 - CRITICAL
**Fix:** Check Array.from() usage, ensure iterable input

### 3. **Profiles Update - 400 Error**
**Error:** `pvesgvkyiaqmsudmmtkc.supabase.co/rest/v1/profiles?on_conflict=id Failed: 400`
**Impact:** 🔴 Language preference not saving
**Priority:** P0 - CRITICAL
**Fix:** Already fixed with upsert, may need RLS policy check

### 4. **Project Registrations - 400 Error**
**Error:** `project_registrations?select=*,projects(title),profiles(full_name) Failed: 400`
**File:** Time registration queries
**Impact:** 🔴 Time registration broken
**Priority:** P0 - CRITICAL
**Fix:** Check foreign key relationships, simplify query

### 5. **Generate Quote Number - 400 Error**
**Error:** `rpc/generate_quote_number Failed: 400`
**Impact:** 🟡 Fallback works but should fix
**Priority:** P1 - HIGH
**Fix:** Check RPC function exists and has correct signature

---

## 🟡 UI/UX ISSUES (Fix Second)

### 6. **Dropdown Not Working in Dialogs**
**Locations:**
- Nieuwe klant afspraak dialog
- Klanten > nieuwe klant dialog
**Impact:** 🟡 Cannot select values in forms
**Priority:** P1 - HIGH
**Fix:** z-index issue with Popover in Dialog/SlidePanel

### 7. **Project Add Button Not Working**
**Location:** ProjectsBoard kanban columns
**Impact:** 🟡 Cannot add projects from kanban
**Priority:** P1 - HIGH
**Fix:** Check onClick handler, make full width

### 8. **Project Card - Remove Price**
**Location:** ProjectsBoard cards
**Impact:** 🟢 Visual improvement
**Priority:** P2 - MEDIUM
**Fix:** Remove price display from card

### 9. **Tijdregistratie - Remove Calendar View**
**Location:** TimeRegistration component
**Impact:** 🟢 UI cleanup
**Priority:** P2 - MEDIUM
**Fix:** Remove "Maandkalender" tab

### 10. **Bonnetjes - 3 Tabs Not Showing**
**Location:** Receipts component
**Impact:** 🔴 Critical for user workflow
**Priority:** P0 - CRITICAL (user asked 1000x!)
**Fix:** Check if IconBox tabs are rendering correctly

---

## 📋 EXECUTION ORDER

### Phase 1: Critical Errors (30 min)
1. ✅ Fix Receipts ReferenceError
2. ✅ Fix Searchable Customer Select Iterator
3. ✅ Fix Project Registrations query
4. ✅ Check Bonnetjes tabs rendering

### Phase 2: Dialog/Dropdown Issues (20 min)
5. ✅ Fix z-index for Popover in SlidePanel
6. ✅ Fix Project Add button handler
7. ✅ Make project add button full width

### Phase 3: UI Cleanup (15 min)
8. ✅ Remove price from project cards
9. ✅ Remove calendar view from time registration
10. ✅ Verify bonnetjes tabs are visible

### Phase 4: Testing (15 min)
11. ✅ Test all dropdowns in forms
12. ✅ Test project add workflow
13. ✅ Test bonnetjes navigation
14. ✅ Test time registration
15. ✅ Test quote creation

---

## 🎯 SUCCESS CRITERIA

- [ ] No console errors on page load
- [ ] All dropdowns work in forms
- [ ] Project add button works from kanban
- [ ] Bonnetjes shows 3 tabs clearly
- [ ] Time registration shows only overview
- [ ] Project cards don't show price
- [ ] Quote creation works without errors

---

## 🔧 TECHNICAL DETAILS

### Fix 1: Receipts ReferenceError
```typescript
// Problem: Variable used before declaration
// Solution: Move all consts to top of component
```

### Fix 2: Searchable Customer Select
```typescript
// Problem: Array.from(undefined)
// Solution: Add null check
const items = Array.from(collection || [])
```

### Fix 3: Project Registrations Query
```sql
-- Current (BROKEN):
SELECT *, projects(title), profiles(full_name)

-- Fix:
SELECT *, project:projects(title), user:profiles(full_name)
-- OR simplify to just IDs and fetch separately
```

### Fix 4: Dropdown z-index
```typescript
// Add to SlidePanel/Dialog content
<PopoverContent className="z-[60]">
```

### Fix 5: Full Width Button
```css
.project-add-button {
  width: 100%;
}
```

---

## ⏱️ ESTIMATED TIME: 80 minutes total

Start Time: Now
Expected Completion: 1 hour 20 minutes

---

## 📝 NOTES

- User emphasized bonnetjes tabs issue (asked 1000x!)
- Must prioritize visibility of 3 tabs
- Dropdowns in dialogs are blocking workflow
- Console errors are preventing smooth UX

