# 07 - Quote Signature Fixes

## Problem
- Client signature not displayed in approved quote version
- Signatures missing from final quote view
- No clear indication of signed status

## Current Implementation
- Signatures stored in database
- Not displayed in quote preview/PDF
- Public quote captures signature but doesn't show in admin view

## Solution
1. **Display Signatures in Quote Preview**
   - Show client signature in approved quotes
   - Display admin signature
   - Include signature timestamps

2. **Signature Section in PDF**
   - Render signatures in PDF generation
   - Include signed date and name
   - Professional signature formatting

3. **Signed Quote Indicators**
   - Clear visual indicators for signed quotes
   - Signature status in quotes table
   - Lock icon for fully signed quotes

## Files to Modify
- `src/components/quotes/MultiBlockQuotePreview.tsx` - Show signatures
- `src/pages/PublicQuote.tsx` - Display signature status
- `src/components/quotes/QuotesTable.tsx` - Signature indicators
- `supabase/functions/generate-quote-pdf/index.ts` - Include signatures in PDF

## Signature Display Component
```jsx
const QuoteSignatures = ({ quote }) => {
  if (!quote.client_signature_data && !quote.admin_signature_data) {
    return null;
  }

  return (
    <div className="quote-signatures">
      {quote.client_signature_data && (
        <div className="signature-block">
          <h4>Klant Handtekening</h4>
          <img src={quote.client_signature_data} alt="Client signature" />
          <p>Naam: {quote.client_name}</p>
          <p>Datum: {new Date(quote.client_signed_at).toLocaleDateString()}</p>
        </div>
      )}
      
      {quote.admin_signature_data && (
        <div className="signature-block">
          <h4>Bedrijf Handtekening</h4>
          <img src={quote.admin_signature_data} alt="Admin signature" />
        </div>
      )}
    </div>
  );
};
```

## PDF Integration
- Include signature images in PDF
- Proper positioning and sizing
- Signature validation text

## Implementation Priority
**HIGH** - Critical for legal/professional requirements

## Dependencies
- Quote signature capture system must be working

## Testing
- Approved quote → shows client signature
- PDF generation → includes signatures
- Signature timestamps → displayed correctly
- Unsigned quotes → no signature section shown