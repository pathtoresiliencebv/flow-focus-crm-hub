# Quote Attachments Not Saved - FIXED ✅

**Datum**: 13 oktober 2025  
**Status**: ✅ OPGELOST

---

## 🐛 Probleem

Wanneer een gebruiker een bijlage toevoegde aan een offerte en deze opslaat als concept (draft), werden de bijlagen **niet** opgeslagen in de database. De bijlagen verdwenen na het opslaan.

### Symptomen:
- ✅ Bijlage upload werkt (wordt geüpload naar Supabase Storage)
- ✅ Bijlage verschijnt in de UI tijdens het bewerken
- ❌ Na opslaan als concept: bijlage is verdwenen
- ✅ Bij "Save and Send": bijlage wordt WEL opgeslagen

---

## 🔍 Root Cause Analysis

### De Code

In `src/components/quotes/MultiBlockQuoteForm.tsx` waren er **twee** save functies:

1. **`saveAsDraft`** (line 373-497) - Voor concept opslaan
2. **`saveAndPrepareToSend`** (line 569-699) - Voor verzenden

### Het Probleem

**`saveAndPrepareToSend`** had WEL de juiste velden (line 626-627):
```typescript
const quoteData = {
  // ... other fields ...
  payment_terms: JSON.stringify(paymentTerms),
  attachments: JSON.stringify(attachments),  // ✅ PRESENT
  // ... other fields ...
};
```

**`saveAsDraft`** miste deze velden (line 392-412):
```typescript
const quoteData = {
  // ... other fields ...
  // ❌ payment_terms: MISSING
  // ❌ attachments: MISSING
  items: JSON.parse(JSON.stringify(currentBlocks)),
  subtotal: currentTotalAmount,
  // ... other fields ...
};
```

### Waarom Gebeurde Dit?

De `saveAsDraft` functie was eerder geschreven en niet bijgewerkt toen:
1. Payment terms functionaliteit werd toegevoegd
2. File attachments functionaliteit werd toegevoegd

Deze features werden alleen toegevoegd aan `saveAndPrepareToSend`, niet aan `saveAsDraft`.

---

## ✅ Oplossing

### 1. Toegevoegd aan `saveAsDraft` quoteData object:

```typescript
const quoteData = {
  quote_number: values.quoteNumber,
  customer_id: values.customer || null,
  customer_name: customer?.name || '',
  customer_email: customer?.email || '',
  project_id: values.project || null,
  project_title: project?.title || '',
  quote_date: values.date,
  valid_until: values.validUntil,
  message: values.message || '',
  items: JSON.parse(JSON.stringify(currentBlocks)),
  payment_terms: JSON.stringify(paymentTerms),        // ✅ ADDED
  attachments: JSON.stringify(attachments),           // ✅ ADDED
  subtotal: currentTotalAmount,
  vat_amount: currentTotalVAT,
  total_amount: currentGrandTotal,
  status: 'concept',
  admin_signature_data: adminSignature || null,
  user_id: user?.id || null,
  updated_at: new Date().toISOString()
};
```

### 2. Updated Dependencies Array:

```typescript
}, [customers, projects, adminSignature, paymentTerms, attachments, toast, onClose]); 
// ✅ Added paymentTerms and attachments to dependencies
```

---

## 🧪 Testing

### Test Scenario 1: Save as Draft
1. ✅ Maak een nieuwe offerte
2. ✅ Upload een bijlage (bijv. PDF bestand)
3. ✅ Klik "Concept opslaan"
4. ✅ Heropen de offerte
5. ✅ Bijlage is nog steeds aanwezig

### Test Scenario 2: Auto-Save
1. ✅ Maak een nieuwe offerte
2. ✅ Upload een bijlage
3. ✅ Wacht op auto-save (blur event)
4. ✅ Refresh pagina
5. ✅ Bijlage is nog steeds aanwezig

### Test Scenario 3: Payment Terms
1. ✅ Maak een nieuwe offerte
2. ✅ Stel payment terms in
3. ✅ Klik "Concept opslaan"
4. ✅ Heropen de offerte
5. ✅ Payment terms zijn nog steeds ingesteld

---

## 📊 Impact

### Voor Gebruikers:
- ✅ Bijlagen blijven behouden na opslaan als concept
- ✅ Payment terms blijven behouden na opslaan als concept
- ✅ Auto-save slaat nu ook bijlagen en payment terms op
- ✅ Geen data verlies meer bij het werken aan offertes

### Technisch:
- **Files Changed**: 1 (`src/components/quotes/MultiBlockQuoteForm.tsx`)
- **Lines Changed**: +3 lines
- **Breaking Changes**: None
- **Backward Compatibility**: ✅ Fully compatible

---

## 🔄 Related Features

Deze fix raakt ook:

### 1. Auto-Save Functionaliteit
De `triggerAutoSave` functie (line 501-523) roept `saveAsDraft` aan, dus auto-save slaat nu ook bijlagen op.

### 2. Navigation Protection
De `beforeunload` event handler (line 549-567) roept `saveAsDraft` aan bij page close, dus bijlagen worden nu ook bewaard bij accidentele close.

### 3. Blur-Based Saving
De `handleFieldBlur` functie (line 535-537) triggert auto-save, dus bijlagen worden opgeslagen bij field blur events.

---

## 📝 Database Schema

### Quotes Table - Attachments Column:

```sql
-- Already exists from previous migration
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_terms JSONB DEFAULT '{}';
```

### Attachments JSONB Structure:

```json
[
  {
    "id": "uuid-v4",
    "name": "document.pdf",
    "url": "https://supabase-storage/quote-attachments/quotes/filename.pdf",
    "size": 245760,
    "type": "application/pdf",
    "uploadedAt": "2025-10-13T12:00:00.000Z"
  }
]
```

### Payment Terms JSONB Structure:

```json
{
  "method": "bank_transfer",
  "days": 30,
  "description": "Betaling binnen 30 dagen"
}
```

---

## 🚀 Deployment

**Status**: ✅ DEPLOYED

**Commit**: `95fd66c` - "Fix: Quote attachments and payment terms not saved in draft mode"

**Files Changed**:
- `src/components/quotes/MultiBlockQuoteForm.tsx` (+3 lines)

**Deployment Method**: Automatic via Git push → Vercel

---

## 🎓 Lessons Learned

### 1. Consistency is Key
Wanneer je multiple save functies hebt (`saveAsDraft`, `saveAndPrepareToSend`), moeten ze **dezelfde velden** opslaan. 

### 2. Code Review Checklist
Bij het toevoegen van nieuwe features:
- ✅ Check ALL save/update functies
- ✅ Check ALL database insert/update queries
- ✅ Check ALL dependencies arrays in callbacks

### 3. Better Pattern
Overweeg een **single source of truth** functie:

```typescript
const buildQuoteData = (values, options = {}) => {
  return {
    // All fields in ONE place
    quote_number: values.quoteNumber,
    // ... all fields including attachments and payment_terms
  };
};

const saveAsDraft = async (values) => {
  const quoteData = buildQuoteData(values, { status: 'concept' });
  // ... save logic
};

const saveAndPrepareToSend = async (values) => {
  const quoteData = buildQuoteData(values, { status: 'sent' });
  // ... save logic
};
```

Dit voorkomt inconsistenties tussen verschillende save functies.

---

## ✅ Resultaat

**Voor**: Bijlagen verdwenen na opslaan als concept  
**Na**: Bijlagen blijven behouden in alle save scenarios

**Voor**: Payment terms verdwenen na opslaan als concept  
**Na**: Payment terms blijven behouden in alle save scenarios

🎉 **Probleem Opgelost!**

---

**Fix Complete** ✅  
**Versie**: 2025-10-13 Quote Attachments Fix

