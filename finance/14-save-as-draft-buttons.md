# 14 - Save as Draft Buttons

## Problem
- Only one "save" action in quote/invoice forms
- No explicit "Save as Draft" option
- Users confused about save behavior
- No clear distinction between draft and final saves

## Current Implementation
- Single save button that saves as concept
- No separate draft saving option
- Unclear save behavior for users

## Solution
1. **Dual Save Buttons**
   - "Opslaan als Concept" - saves as draft
   - "Opslaan en Versturen" - saves and prepares for sending
   - Clear action distinction

2. **Draft Save Behavior**
   - Quick save without validation
   - Maintains 'concept' status
   - Allows incomplete data
   - Auto-save continues working

3. **Final Save Behavior**
   - Full validation required
   - Generates public token
   - Updates status to 'te-versturen'
   - Prepares for customer interaction

4. **Visual Indicators**
   - Different button styles
   - Clear labels and tooltips
   - Progress indicators

## Files to Modify
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Add dual buttons
- `src/components/invoicing/InvoiceForm.tsx` - Add dual buttons
- `src/hooks/useQuotes.ts` - Separate save functions
- `src/hooks/useInvoices.ts` - Separate save functions

## Dual Button Implementation
```jsx
// In MultiBlockQuoteForm.tsx
const [saveType, setSaveType] = useState(null);

const handleSaveDraft = async () => {
  setSaveType('draft');
  try {
    await saveAsDraft();
    toast({
      title: "Concept opgeslagen",
      description: "Je offerte is opgeslagen als concept.",
    });
  } catch (error) {
    toast({
      title: "Fout",
      description: "Kon concept niet opslaan.",
      variant: "destructive",
    });
  } finally {
    setSaveType(null);
  }
};

const handleSaveAndSend = async () => {
  setSaveType('send');
  try {
    await saveAndPrepareToSend();
    // Navigation handled in function
  } catch (error) {
    toast({
      title: "Fout",
      description: "Kon offerte niet voorbereiden voor verzending.",
      variant: "destructive",
    });
  } finally {
    setSaveType(null);
  }
};

// Button rendering
<div className="flex gap-3">
  <Button 
    type="button"
    variant="outline" 
    onClick={handleSaveDraft}
    disabled={saveType === 'draft'}
  >
    {saveType === 'draft' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    Opslaan als Concept
  </Button>
  
  <Button 
    type="button"
    onClick={handleSaveAndSend}
    disabled={saveType === 'send'}
  >
    {saveType === 'send' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    Opslaan en Versturen
  </Button>
</div>
```

## Save Function Separation
```typescript
// Draft save - minimal validation
const saveAsDraft = async () => {
  const formData = form.getValues();
  const quoteData = {
    ...formData,
    status: 'concept',
    blocks: blocks
  };

  if (isEditing) {
    await updateQuote(quote.id, quoteData);
  } else {
    await createQuote(quoteData);
  }
};

// Final save - full validation
const saveAndPrepareToSend = async () => {
  // Validate required fields
  const validationResult = await form.trigger();
  if (!validationResult) {
    throw new Error('Validation failed');
  }

  const formData = form.getValues();
  const publicToken = await generatePublicToken();
  
  const quoteData = {
    ...formData,
    status: 'te-versturen',
    public_token: publicToken,
    blocks: blocks
  };

  let quoteId;
  if (isEditing) {
    await updateQuote(quote.id, quoteData);
    quoteId = quote.id;
  } else {
    const result = await createQuote(quoteData);
    quoteId = result.id;
  }

  // Navigate to send page
  navigate(`/quotes/${quoteId}/send`);
};
```

## Implementation Priority
**MEDIUM** - User experience enhancement

## Dependencies
- Quote and invoice forms must be stable
- Save functionality should work properly

## Testing
- "Opslaan als Concept" → saves without full validation
- "Opslaan en Versturen" → validates and prepares for sending
- Button states show loading correctly
- Different save behaviors work as expected
- Auto-save continues working with draft saves