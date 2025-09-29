# 09 - Invoice System Sync

## Problem
- Invoice system lacks features that quotes have
- No edit functionality for invoices
- Inconsistent UI between quotes and invoices
- Invoice management less mature than quotes

## Current Implementation
- Invoice system is basic compared to quotes
- No duplicate, edit, archive features
- Different UI patterns

## Solution
1. **Standardize Invoice Table UI**
   - Match quotes table layout and actions
   - Add edit, duplicate, archive buttons
   - Consistent status indicators

2. **Invoice Edit Functionality**
   - Edit page similar to quotes
   - Edit concept/draft invoices only
   - Prevent editing of sent/paid invoices

3. **Invoice Archive System**
   - Soft delete for invoices
   - Archive section like quotes
   - Restore functionality

4. **Enhanced Invoice Management**
   - Auto-save for invoice editing
   - Better form validation
   - Consistent user experience

## Database Changes
```sql
-- Add archive support to invoices
ALTER TABLE invoices ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN archived_by UUID REFERENCES auth.users(id);
ALTER TABLE invoices ADD COLUMN auto_saved_at TIMESTAMP WITH TIME ZONE;

-- Update existing invoices
UPDATE invoices SET is_archived = FALSE WHERE is_archived IS NULL;
```

## Files to Modify
- `src/components/invoicing/InvoicesTable.tsx` - Add edit/duplicate/archive buttons
- `src/pages/EditInvoice.tsx` - New edit page
- `src/components/invoicing/InvoiceForm.tsx` - Add auto-save
- `src/hooks/useInvoices.ts` - Add duplicate/archive functions
- `src/components/invoicing/ArchivedInvoicesView.tsx` - New component

## UI Standardization
```jsx
// Invoice actions similar to quotes
const invoiceActions = (invoice) => (
  <div className="flex gap-2">
    {invoice.status === 'concept' && (
      <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
        <Pencil className="h-4 w-4" />
      </Button>
    )}
    <Button variant="ghost" size="sm" onClick={() => duplicateInvoice(invoice.id)}>
      <Copy className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onClick={() => archiveInvoice(invoice.id)}>
      <Archive className="h-4 w-4" />
    </Button>
  </div>
);
```

## Implementation Priority
**MEDIUM-HIGH** - Important for system consistency

## Dependencies
- Quote system improvements should be completed first
- Invoice basic functionality must work

## Testing
- Invoice edit works like quote edit
- Archive/restore invoices
- Duplicate invoices properly
- Auto-save during invoice editing
- Consistent UI experience