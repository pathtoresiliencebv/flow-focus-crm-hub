# 03 - Quote Edit Functionality

## Problem
- Concept quotes cannot be edited after saving
- No edit button/icon in quotes table
- Users stuck with read-only concept quotes

## Current Implementation
- Quotes table only shows preview, send, approve actions
- No edit functionality for existing quotes
- MultiBlockQuoteForm only used for new quotes

## Solution
1. **Add Edit Button to Quotes Table**
   - Pencil icon for concept/draft quotes
   - Navigate to `/quotes/{id}/edit`
   - Disable edit for approved/sent quotes

2. **Edit Quote Page**
   - Reuse `MultiBlockQuoteForm` component
   - Pre-populate with existing quote data
   - Update mode instead of create mode

3. **Edit State Management**
   - Load existing quote data into form
   - Maintain original quote number
   - Update existing record instead of creating new

## Files to Modify
- `src/components/quotes/QuotesTable.tsx` - Add edit button
- `src/pages/EditQuote.tsx` - New edit page (or extend NewQuote.tsx)
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Support edit mode
- `src/hooks/useQuotes.ts` - Add updateQuote function
- Add route to router: `/quotes/:id/edit`

## UI Changes
```jsx
// In QuotesTable.tsx
{quote.status === 'concept' && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => navigate(`/quotes/${quote.id}/edit`)}
  >
    <Pencil className="h-4 w-4" />
  </Button>
)}
```

## Database Considerations
- No schema changes needed
- Use existing quote update logic
- Preserve quote_number and created_at

## Implementation Priority
**HIGH** - Essential for quote management workflow

## Dependencies
- 01-quote-popup-elimination (for consistent page-based flow)

## Testing
- Concept quotes show pencil icon
- Click edit → navigates to edit page
- Edit page pre-fills with quote data
- Save updates existing quote
- Approved quotes don't show edit option