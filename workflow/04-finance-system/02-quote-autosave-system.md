# 02 - Quote Autosave System

## Problem
- Quotes disappear when user navigates away
- No automatic saving during editing
- Data loss when browser crashes or user accidentally closes
- Currently only saves when user explicitly clicks save

## Current Implementation
- Manual save only through form submission
- No draft state management
- No auto-save mechanism

## Solution
1. **Implement Word-Level Auto-Save**
   - Save after every word (not every letter)
   - Use debounced save function (2-3 seconds delay)
   - Save as 'concept' status automatically

2. **Draft State Management**
   - Automatic concept creation on first edit
   - Update existing concept when editing
   - Clear save indicators for users

3. **Auto-Save Triggers**
   - Customer selection change
   - Quote item addition/modification
   - Text block content changes
   - Project title changes
   - Message changes

## Technical Implementation
```typescript
// Auto-save hook
const useAutoSave = (quoteData, interval = 3000) => {
  const debouncedSave = useCallback(
    debounce(async (data) => {
      await saveQuoteAsDraft(data);
    }, interval),
    []
  );
  
  useEffect(() => {
    if (quoteData.hasChanges) {
      debouncedSave(quoteData);
    }
  }, [quoteData, debouncedSave]);
};
```

## Files to Modify
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Add auto-save logic
- `src/hooks/useQuotes.ts` - Add draft save functions
- `src/components/quotes/QuoteBlockForm.tsx` - Trigger auto-save on changes
- `src/components/quotes/QuoteItemForm.tsx` - Trigger auto-save on changes

## Database Changes
```sql
-- Add auto_saved_at column to track auto-saves
ALTER TABLE quotes ADD COLUMN auto_saved_at TIMESTAMP WITH TIME ZONE;
```

## Implementation Priority
**HIGH** - Critical for data preservation

## Dependencies
- Basic quote system must be working

## Testing
- Type in quote form → should auto-save after 3 seconds
- Refresh page → changes should be preserved
- Navigate away and back → draft should be maintained
- No data loss during editing session