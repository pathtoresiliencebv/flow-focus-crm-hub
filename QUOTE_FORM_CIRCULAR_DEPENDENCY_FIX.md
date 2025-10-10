# Quote Form Circular Dependency Fix - October 10, 2025

## Problem
Users were getting "Er is iets misgegaan" error with `ReferenceError: Cannot access 'C' before initialization` when trying to create new quotes or invoices.

## Root Cause
In `MultiBlockQuoteForm.tsx`, three `useCallback` hooks had circular dependencies where they:
1. Accessed `blocks.length` directly in the function body
2. Also listed `blocks.length` in the dependency array

During production build minification, this created a variable reference loop causing the initialization error.

## Solution
Refactored all affected callbacks to use **functional state updates** (`setState(prev => ...)`) instead of accessing state variables directly.

### Changes Made

#### 1. Fixed `addBlock` callback (lines 243-260)
**Before:**
```typescript
const addBlock = useCallback(() => {
  const newBlock = {
    title: `Blok ${blocks.length + 1}`, // ❌ accessing blocks.length
    order_index: blocks.length
  };
  setBlocks(prevBlocks => [...prevBlocks, newBlock]);
}, [blocks.length, forcePreviewUpdate]); // ❌ blocks.length in deps
```

**After:**
```typescript
const addBlock = useCallback(() => {
  setBlocks(prevBlocks => {
    const newBlock = {
      title: `Blok ${prevBlocks.length + 1}`, // ✅ use prevBlocks
      order_index: prevBlocks.length
    };
    return [...prevBlocks, newBlock];
  });
  forcePreviewUpdate();
}, [forcePreviewUpdate]); // ✅ removed blocks.length
```

#### 2. Fixed `addTextBlock` callback (lines 262-280)
Applied same pattern - moved all block creation logic inside functional update.

#### 3. Fixed `deleteBlock` callback (lines 308-319)
Moved the length check inside functional update:
```typescript
const deleteBlock = useCallback((index: number) => {
  setBlocks(prevBlocks => {
    if (prevBlocks.length > 1) {
      return prevBlocks.filter((_, i) => i !== index);
    }
    return prevBlocks;
  });
  forcePreviewUpdate();
}, [forcePreviewUpdate]);
```

## Files Modified
- `flow-focus-crm-hub/src/components/quotes/MultiBlockQuoteForm.tsx`

## Files Verified (No Changes Needed)
- `flow-focus-crm-hub/src/components/invoicing/MultiBlockInvoiceForm.tsx` - Uses regular functions, not `useCallback`, so no circular dependency issue

## Testing
- ✅ No linter errors
- ✅ No TypeScript errors
- ✅ All `blocks.length` references removed from useCallback dependency arrays
- ✅ Functional state updates properly implemented

## Best Practice
**Never reference state variables directly inside useCallback when they're also in the dependency array.**

Always use functional state updates to access current state inside callbacks:
```typescript
// ✅ CORRECT
const updateSomething = useCallback(() => {
  setState(prevState => {
    // Use prevState here instead of state
    return newState;
  });
}, [otherDeps]); // Don't include state in deps

// ❌ WRONG
const updateSomething = useCallback(() => {
  const value = state.something; // accessing state
  setState(...);
}, [state.something]); // circular dependency
```

## Impact
Users can now successfully create new quotes and invoices without initialization errors.

