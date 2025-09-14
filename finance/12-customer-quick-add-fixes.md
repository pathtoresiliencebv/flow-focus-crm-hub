# 12 - Customer Quick Add Fixes

## Problem
- Adding customer during quote creation shows popup
- Customer addition redirects away from quote (to /)
- Customer data doesn't persist in quote form
- Breaks quote creation workflow

## Current Implementation
- CustomerQuickAdd component opens in dialog
- After customer creation, navigation redirects to home
- Quote form loses context and data

## Solution
1. **Fix Customer Quick Add Flow**
   - Remove popup behavior
   - Inline customer creation in quote form
   - No navigation away from quote

2. **Persistent Quote Context**
   - Maintain quote form data during customer creation
   - Auto-select newly created customer
   - Seamless workflow continuation

3. **Improved UX**
   - Collapsible customer form within quote
   - Real-time customer addition
   - No data loss or context switching

## Files to Modify
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Fix customer integration
- `src/components/CustomerQuickAdd.tsx` - Remove navigation logic
- `src/hooks/useCrmStore.ts` - Ensure proper customer callback

## Fixed Customer Quick Add
```jsx
// In MultiBlockQuoteForm.tsx
const [showAddCustomer, setShowAddCustomer] = useState(false);

const handleCustomerAdded = useCallback((newCustomer) => {
  // Add to customers list
  setCustomers(prev => [...prev, newCustomer]);
  
  // Auto-select the new customer
  form.setValue('customer_id', newCustomer.id);
  
  // Close the add form
  setShowAddCustomer(false);
  
  // Show success message
  toast({
    title: "Klant toegevoegd",
    description: `${newCustomer.name} is succesvol toegevoegd en geselecteerd.`,
  });
}, [form, toast]);

// Inline customer form
{showAddCustomer ? (
  <div className="border rounded-lg p-4 bg-muted/50">
    <CustomerQuickAdd 
      onCustomerAdded={handleCustomerAdded}
      onCancel={() => setShowAddCustomer(false)}
    />
  </div>
) : (
  <Button 
    type="button"
    variant="outline" 
    onClick={() => setShowAddCustomer(true)}
  >
    <Plus className="mr-2 h-4 w-4" />
    Nieuwe Klant
  </Button>
)}
```

## CustomerQuickAdd Updates
```jsx
// Remove navigation, add onCancel prop
const CustomerQuickAdd = ({ onCustomerAdded, onCancel }) => {
  const handleSubmit = async (customerData) => {
    try {
      const result = await addCustomer(customerData);
      
      // Call parent callback instead of navigating
      onCustomerAdded(result);
      
      // Reset form
      form.reset();
      
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Customer form fields */}
      <div className="flex gap-2 mt-4">
        <Button type="submit">Klant Toevoegen</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
      </div>
    </form>
  );
};
```

## Implementation Priority
**HIGH** - Critical for workflow completion

## Dependencies
- Quote form must be stable
- Customer management system working

## Testing
- Add customer during quote creation → stays in quote
- New customer → auto-selected in form
- Cancel customer creation → returns to quote
- No popups appear during process
- Quote data preserved throughout