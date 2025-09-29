# 10 - Quote to Invoice Workflow

## Problem
- Quote → Invoice conversion creates concept invoice but can't be finalized
- No clear path from concept invoice to finalized invoice
- Missing "Factureren" functionality for approved quotes

## Current Implementation
- Quote approval creates concept invoice
- Concept invoice cannot be easily finalized
- Missing workflow completion

## Solution
1. **Enhanced Quote Approval Flow**
   - Approve quote → create concept invoice
   - Clear indicator of invoice creation
   - Navigate to invoice after creation

2. **Invoice Finalization Process**
   - "Finaliseren" button for concept invoices
   - Generate invoice number and PDF
   - Update status to 'sent' or 'finalized'
   - Email to customer

3. **Workflow Indicators**
   - Quote status shows if invoice created
   - Invoice shows source quote link
   - Clear workflow progression

4. **Project Integration**
   - Invoice finalization can trigger project creation
   - Link invoice → project → quote chain
   - Complete workflow visibility

## Files to Modify
- `src/components/Quotes.tsx` - Enhance approval process
- `src/components/invoicing/InvoicesTable.tsx` - Add finalize button
- `src/services/quoteToInvoiceService.ts` - Enhance conversion
- `src/hooks/useInvoices.ts` - Add finalize function
- `src/components/invoicing/InvoiceFinalizationDialog.tsx` - New component

## Invoice Finalization
```jsx
const InvoiceFinalizationDialog = ({ invoice, onFinalize }) => {
  const [emailCustomer, setEmailCustomer] = useState(true);
  const [createProject, setCreateProject] = useState(false);

  const handleFinalize = async () => {
    try {
      // Generate final invoice number
      // Create PDF
      // Send email if requested
      // Create project if requested
      // Update status
      onFinalize();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Factuur Finaliseren</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email"
              checked={emailCustomer}
              onCheckedChange={setEmailCustomer}
            />
            <Label htmlFor="email">E-mail naar klant versturen</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="project"
              checked={createProject}
              onCheckedChange={setCreateProject}
            />
            <Label htmlFor="project">Project aanmaken</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleFinalize}>Finaliseren</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

## Workflow Enhancement
```typescript
const finalizeInvoice = async (invoiceId: string, options: {
  emailCustomer: boolean;
  createProject: boolean;
}) => {
  // 1. Generate final invoice number
  const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');
  
  // 2. Update invoice status
  await supabase
    .from('invoices')
    .update({
      invoice_number: invoiceNumber,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', invoiceId);

  // 3. Send email if requested
  if (options.emailCustomer) {
    await supabase.functions.invoke('send-invoice-email', {
      body: { invoiceId }
    });
  }

  // 4. Create project if requested
  if (options.createProject) {
    // Create project logic
  }
};
```

## Implementation Priority
**HIGH** - Critical for complete workflow

## Dependencies
- Quote approval system must work
- Invoice edit system should be in place

## Testing
- Approve quote → concept invoice created
- Finalize concept invoice → becomes final
- Email sending works
- Project creation optional
- Status updates correctly