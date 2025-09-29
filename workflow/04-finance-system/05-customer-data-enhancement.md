# 05 - Customer Data Enhancement

## Problem
- Customers only have basic name/email/phone
- Missing KVK gegevens, BTW nummer
- Only single email address supported
- Insufficient business data for quotes/invoices

## Current Implementation
- Basic customer fields in database
- Single email field
- No business registration data

## Solution
1. **Extend Customer Database Schema**
   - KVK nummer (Chamber of Commerce)
   - BTW nummer (VAT number)
   - Multiple email addresses
   - Company registration details

2. **Update Customer Forms**
   - Add business data fields to customer creation
   - Multiple email input with tags
   - Validation for KVK/BTW format

3. **Quote/Invoice Integration**
   - Display business data in PDFs
   - Use multiple emails for communication
   - Proper business formatting

## Database Changes
```sql
-- Extend customers table
ALTER TABLE customers ADD COLUMN kvk_number VARCHAR(20);
ALTER TABLE customers ADD COLUMN btw_number VARCHAR(30);
ALTER TABLE customers ADD COLUMN email_addresses JSONB DEFAULT '[]';
ALTER TABLE customers ADD COLUMN company_name TEXT;
ALTER TABLE customers ADD COLUMN invoice_address JSONB;
ALTER TABLE customers ADD COLUMN shipping_address JSONB;

-- Migrate existing emails to new format
UPDATE customers 
SET email_addresses = CASE 
  WHEN email IS NOT NULL THEN jsonb_build_array(jsonb_build_object('email', email, 'type', 'primary'))
  ELSE '[]'::jsonb
END;
```

## Files to Modify
- `src/components/CustomerForm.tsx` - Add new fields
- `src/hooks/useCrmStore.ts` - Update customer type
- `src/components/quotes/MultiBlockQuoteForm.tsx` - Use enhanced customer data
- `src/components/CustomerDetail.tsx` - Display new fields
- `src/types/customer.ts` - Update interface

## Customer Interface Update
```typescript
interface Customer {
  id: string;
  name: string;
  email?: string; // Keep for backward compatibility
  email_addresses: EmailAddress[];
  phone?: string;
  company_name?: string;
  kvk_number?: string;
  btw_number?: string;
  invoice_address?: Address;
  shipping_address?: Address;
}

interface EmailAddress {
  email: string;
  type: 'primary' | 'billing' | 'support' | 'other';
  label?: string;
}
```

## UI Components
- Multi-email input with add/remove
- KVK/BTW validation
- Address forms for billing/shipping
- Business data display in quotes

## Implementation Priority
**MEDIUM-HIGH** - Required for professional invoicing

## Dependencies
- Customer management system must be stable

## Testing
- Add customer with KVK/BTW → saves correctly
- Multiple emails → all stored and retrievable
- Quote generation → includes business data
- PDF export → shows complete business info