# 08 - Quote Duplicate Fixes

## Problem
- No copy/duplicate button in quotes table
- Users can't easily duplicate existing quotes
- Missing duplicate functionality for efficiency

## Current Implementation
- Duplicate function exists in useQuotes hook
- No UI button to trigger duplication
- Function may need improvements

## Solution
1. **Add Duplicate Button to Table**
   - Copy icon in quotes table actions
   - Tooltip explaining duplicate function
   - Proper positioning with other actions

2. **Enhance Duplicate Functionality**
   - Copy all quote data except signatures
   - Generate new quote number
   - Set status to 'concept'
   - Reset dates appropriately

3. **User Feedback**
   - Toast notification on successful duplicate
   - Navigate to edit duplicated quote
   - Clear indication of duplicate process

## Files to Modify
- `src/components/quotes/QuotesTable.tsx` - Add duplicate button
- `src/hooks/useQuotes.ts` - Verify/enhance duplicate function
- Icon import: `Copy` from lucide-react

## UI Implementation
```jsx
// In QuotesTable actions column
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleDuplicate(quote.id)}
  title="Dupliceer offerte"
>
  <Copy className="h-4 w-4" />
</Button>
```

## Duplicate Function Enhancement
```typescript
const duplicateQuote = async (quoteId: string) => {
  try {
    const originalQuote = quotes.find(q => q.id === quoteId);
    if (!originalQuote) return;

    const { data: newQuoteNumber } = await supabase.rpc('generate_quote_number');
    
    const duplicateData = {
      ...originalQuote,
      id: undefined,
      quote_number: newQuoteNumber,
      quote_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'concept',
      public_token: null,
      client_signature_data: null,
      admin_signature_data: null,
      client_name: null,
      client_signed_at: null,
    };

    const { data, error } = await supabase
      .from('quotes')
      .insert([duplicateData])
      .select()
      .single();

    if (error) throw error;

    toast({
      title: "Offerte gedupliceerd",
      description: `Nieuwe offerte ${newQuoteNumber} is aangemaakt`,
    });

    // Navigate to edit the new quote
    navigate(`/quotes/${data.id}/edit`);
    
  } catch (error) {
    console.error('Error duplicating quote:', error);
    toast({
      title: "Fout",
      description: "Kon offerte niet dupliceren",
      variant: "destructive",
    });
  }
};
```

## Implementation Priority
**MEDIUM** - Productivity enhancement

## Dependencies
- Quote edit functionality (03-quote-edit-functionality)

## Testing
- Click duplicate → creates new concept quote
- New quote has fresh quote number
- All data copied except signatures/tokens
- Navigate to edit page for new quote
- Toast notification appears