# 04 - Quote Archive System

## Problem
- No "Verwijderde offertes" section
- Deleted quotes are permanently removed
- No way to recover accidentally deleted quotes

## Current Implementation
- Hard delete from database
- No archive/soft delete functionality
- No way to view deleted quotes

## Solution
1. **Implement Soft Delete**
   - Add `is_archived` column to quotes table
   - Change delete function to set archived flag
   - Filter out archived quotes from main view

2. **Add Archive Section**
   - New tab/section: "Verwijderde offertes"
   - Show archived quotes with restore option
   - Permanent delete option for admins

3. **Archive Management**
   - Archive instead of delete
   - Restore from archive functionality
   - Bulk archive operations

## Database Changes
```sql
-- Add archive support
ALTER TABLE quotes ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE quotes ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quotes ADD COLUMN archived_by UUID REFERENCES auth.users(id);

-- Update existing quotes
UPDATE quotes SET is_archived = FALSE WHERE is_archived IS NULL;
```

## Files to Modify
- `src/components/Quotes.tsx` - Add archive tab
- `src/components/quotes/ArchivedQuotesView.tsx` - New component
- `src/hooks/useQuotes.ts` - Update delete/archive functions
- `src/components/quotes/QuotesTable.tsx` - Update delete action

## UI Implementation
```jsx
// Archive section
<Tabs defaultValue="active">
  <TabsList>
    <TabsTrigger value="active">Actieve Offertes</TabsTrigger>
    <TabsTrigger value="archived">Verwijderde Offertes</TabsTrigger>
  </TabsList>
  <TabsContent value="active">
    <QuotesTable quotes={activeQuotes} />
  </TabsContent>
  <TabsContent value="archived">
    <ArchivedQuotesView quotes={archivedQuotes} />
  </TabsContent>
</Tabs>
```

## Implementation Priority
**MEDIUM** - Quality of life improvement

## Dependencies
- Basic quote management system

## Testing
- Delete quote → moves to archive
- Archive section shows deleted quotes
- Restore quote → moves back to active
- Permanent delete removes from database