# 11 - Invoice Management Enhanced

## Problem
- Invoice management lacks advanced features quotes have
- No bulk operations for invoices
- Limited search and filtering
- Missing payment tracking features

## Current Implementation
- Basic invoice table
- Limited filtering options
- No payment status tracking
- Basic CRUD operations only

## Solution
1. **Enhanced Invoice Table**
   - Advanced filtering (status, date range, customer)
   - Search functionality
   - Bulk operations
   - Payment status indicators

2. **Payment Tracking**
   - Payment status field
   - Payment date tracking
   - Overdue invoice highlighting
   - Payment reminders

3. **Invoice Analytics**
   - Outstanding amounts
   - Payment statistics
   - Revenue tracking
   - Customer payment patterns

4. **Bulk Operations**
   - Bulk email sending
   - Bulk status updates
   - Bulk export to PDF
   - Bulk archiving

## Database Changes
```sql
-- Enhance invoices table
ALTER TABLE invoices ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE invoices ADD COLUMN payment_date DATE;
ALTER TABLE invoices ADD COLUMN payment_method TEXT;
ALTER TABLE invoices ADD COLUMN payment_reference TEXT;
ALTER TABLE invoices ADD COLUMN reminder_count INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN last_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Create payment tracking table
CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Files to Modify
- `src/components/invoicing/InvoicesTable.tsx` - Enhanced table
- `src/components/invoicing/InvoiceFilters.tsx` - Advanced filtering
- `src/components/invoicing/PaymentTracker.tsx` - New component
- `src/components/invoicing/BulkInvoiceActions.tsx` - New component
- `src/hooks/useInvoices.ts` - Enhanced functionality

## Enhanced Invoice Table
```jsx
const EnhancedInvoicesTable = () => {
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    dateRange: null,
    customer: null
  });

  return (
    <div className="space-y-4">
      <InvoiceFilters filters={filters} onFiltersChange={setFilters} />
      
      {selectedInvoices.length > 0 && (
        <BulkInvoiceActions 
          selectedInvoices={selectedInvoices}
          onActionComplete={() => setSelectedInvoices([])}
        />
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedInvoices.length === invoices.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Factuur Nr.</TableHead>
            <TableHead>Klant</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Bedrag</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Betaling</TableHead>
            <TableHead>Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Invoice rows with payment status indicators */}
        </TableBody>
      </Table>
    </div>
  );
};
```

## Payment Status Component
```jsx
const PaymentStatusBadge = ({ invoice }) => {
  const getPaymentStatus = () => {
    if (invoice.payment_status === 'paid') {
      return { label: 'Betaald', variant: 'success' };
    }
    
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    
    if (dueDate < today && invoice.payment_status === 'pending') {
      return { label: 'Achterstallig', variant: 'destructive' };
    }
    
    return { label: 'Openstaand', variant: 'warning' };
  };

  const status = getPaymentStatus();
  
  return <Badge variant={status.variant}>{status.label}</Badge>;
};
```

## Implementation Priority
**MEDIUM** - Enhances professional invoice management

## Dependencies
- Basic invoice system must be stable
- Invoice sync with quotes completed

## Testing
- Filter invoices by various criteria
- Payment status updates correctly
- Bulk operations work properly
- Overdue invoices highlighted
- Payment tracking functions