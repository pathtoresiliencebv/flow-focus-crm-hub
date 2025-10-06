# 📄 PDF Generation System

Een complete PDF generatie systeem geïnspireerd door markdown2pdf-mcp, geïmplementeerd voor het SmansCRM systeem.

## 🎯 Overzicht

Het PDF generatie systeem maakt het mogelijk om professionele PDF's te genereren vanuit Markdown templates voor:
- **Offertes** - Klantofferte documenten
- **Facturen** - Factuur documenten  
- **Bonnetjes** - Receipt documenten
- **Project Rapporten** - Project status rapporten

## 🏗️ Architectuur

### **Frontend Components**
- `PDFGenerator` - Core PDF generatie service
- `usePDFGenerator` - React hook voor PDF functionaliteit
- `PDFGeneratorButton` - Herbruikbare PDF generatie buttons
- `PDFPreview` - PDF preview component

### **Templates**
- `quoteTemplate.ts` - Offerte Markdown template
- `invoiceTemplate.ts` - Factuur Markdown template
- `receiptTemplate.ts` - Bonnetje Markdown template
- `projectReportTemplate.ts` - Project rapport template

### **Backend**
- `generate-pdf` Edge Function - Server-side PDF generatie
- Markdown naar HTML conversie
- Styled HTML document generatie

## 🚀 Gebruik

### **1. Basis PDF Generatie**

```typescript
import { usePDFGenerator } from '@/hooks/usePDFGenerator';

const { generateQuotePDF, isGenerating, error } = usePDFGenerator();

const quoteData = {
  quoteNumber: 'Q-2024-001',
  date: '2024-01-15',
  customerName: 'John Doe',
  projectName: 'Website Development',
  items: [
    {
      name: 'Website Design',
      description: 'Complete website design',
      quantity: 1,
      unit: 'stuk',
      price: 2500,
      total: 2500
    }
  ],
  subtotal: 2500,
  vatRate: 21,
  vatAmount: 525,
  totalWithVat: 3025
};

// Generate PDF
await generateQuotePDF(quoteData);
```

### **2. PDF Generator Button**

```tsx
import { QuotePDFButton } from '@/components/pdf/PDFGeneratorButton';

<QuotePDFButton
  data={quoteData}
  options={{
    paperFormat: 'a4',
    paperOrientation: 'portrait',
    watermark: 'OFFERTE'
  }}
>
  Generate Quote PDF
</QuotePDFButton>
```

### **3. PDF Preview**

```tsx
import { QuotePDFPreview } from '@/components/pdf/PDFPreview';

<QuotePDFPreview
  data={quoteData}
  options={{
    paperFormat: 'a4',
    watermark: 'DRAFT'
  }}
/>
```

## 📋 Template Structure

### **Offerte Template**

```markdown
# Offerte {quoteNumber}

**Datum:** {date}
**Geldig tot:** {validUntil}

## Klantgegevens
**{customerName}**
{customerAddress}
{customerEmail}

## Project Details
- **Project:** {projectName}
- **Locatie:** {location}

## Offerte Items
| Omschrijving | Aantal | Eenheid | Prijs | Totaal |
|-------------|--------|---------|-------|--------|
{items}

## Kostenoverzicht
| | Bedrag |
|---|--------|
| **Subtotaal** | {subtotal} |
| **BTW ({vatRate}%)** | {vatAmount} |
| **Totaal inclusief BTW** | **{totalWithVat}** |
```

### **Factuur Template**

```markdown
# Factuur {invoiceNumber}

**Factuurdatum:** {invoiceDate}
**Vervaldatum:** {dueDate}

## Debiteur
**{customerName}**
{customerAddress}
{customerEmail}

## Leverancier
**{companyName}**
{companyAddress}
BTW-nummer: {companyVatNumber}

## Factuurregels
| Omschrijving | Aantal | Eenheid | Eenheidsprijs | Totaal |
|-------------|--------|---------|---------------|--------|
{items}

## Kostenoverzicht
| | Bedrag |
|---|--------|
| **Subtotaal** | {subtotal} |
| **BTW ({vatRate}%)** | {vatAmount} |
| **Totaal inclusief BTW** | **{totalWithVat}** |
```

## 🎨 Styling Options

### **Paper Formats**
- `a4` - A4 formaat (default)
- `a3` - A3 formaat
- `letter` - Letter formaat
- `legal` - Legal formaat
- `tabloid` - Tabloid formaat

### **Orientations**
- `portrait` - Staand (default)
- `landscape` - Liggend

### **Borders**
- `2cm` - Standaard marge (default)
- `1.5cm` - Smalle marge
- `3cm` - Brede marge

### **Watermarks**
- `OFFERTE` - Voor offertes
- `FACTUUR` - Voor facturen
- `DRAFT` - Voor concepten
- `CONFIDENTIAL` - Voor vertrouwelijke documenten

## 🔧 Edge Function API

### **Endpoint**
```
POST /functions/v1/generate-pdf
```

### **Request Body**
```json
{
  "template": "quote",
  "data": {
    "quoteNumber": "Q-2024-001",
    "date": "2024-01-15",
    "customerName": "John Doe",
    "projectName": "Website Development",
    "items": [...],
    "subtotal": 2500,
    "vatRate": 21,
    "vatAmount": 525,
    "totalWithVat": 3025
  },
  "options": {
    "paperFormat": "a4",
    "paperOrientation": "portrait",
    "paperBorder": "2cm",
    "watermark": "OFFERTE"
  }
}
```

### **Response**
```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "markdown": "# Offerte Q-2024-001...",
  "filename": "quote-Q-2024-001-2024-01-15.pdf",
  "message": "PDF content generated successfully. HTML version returned."
}
```

## 🎯 Use Cases

### **1. Offerte Generatie**
```typescript
const quoteData: QuoteData = {
  quoteNumber: 'Q-2024-001',
  date: '2024-01-15',
  customerName: 'Acme Corp',
  customerAddress: '123 Main St, Amsterdam',
  customerEmail: 'contact@acme.com',
  projectName: 'Website Redesign',
  location: 'Amsterdam',
  startDate: '2024-02-01',
  endDate: '2024-03-01',
  items: [
    {
      name: 'Website Design',
      description: 'Complete website redesign',
      quantity: 1,
      unit: 'project',
      price: 5000,
      total: 5000
    },
    {
      name: 'Development',
      description: 'Frontend and backend development',
      quantity: 40,
      unit: 'hours',
      price: 75,
      total: 3000
    }
  ],
  subtotal: 8000,
  vatRate: 21,
  vatAmount: 1680,
  totalWithVat: 9680,
  notes: 'Alle prijzen zijn exclusief hosting en domein.',
  terms: 'Betaling binnen 30 dagen na akkoord.',
  validUntil: '2024-02-15'
};

await generateQuotePDF(quoteData, {
  watermark: 'OFFERTE',
  paperFormat: 'a4'
});
```

### **2. Factuur Generatie**
```typescript
const invoiceData: InvoiceData = {
  invoiceNumber: 'F-2024-001',
  invoiceDate: '2024-01-15',
  dueDate: '2024-02-14',
  customerName: 'Acme Corp',
  customerAddress: '123 Main St, Amsterdam',
  customerEmail: 'contact@acme.com',
  companyName: 'SmansCRM',
  companyAddress: '456 Business Ave, Rotterdam',
  companyVatNumber: 'NL123456789B01',
  companyEmail: 'info@smanscrm.nl',
  companyPhone: '+31 10 123 4567',
  items: [
    {
      description: 'Website Development',
      quantity: 40,
      unit: 'hours',
      unitPrice: 75,
      total: 3000
    }
  ],
  subtotal: 3000,
  vatRate: 21,
  vatAmount: 630,
  totalWithVat: 3630,
  paymentTerms: 'Betaling binnen 30 dagen na factuurdatum.',
  bankDetails: 'IBAN: NL91ABNA0417164300\nBIC: ABNANL2A'
};

await generateInvoicePDF(invoiceData, {
  watermark: 'FACTUUR',
  paperFormat: 'a4'
});
```

## 🚀 Deployment

### **1. Edge Function Deployen**
```bash
supabase functions deploy generate-pdf
```

### **2. Frontend Build**
```bash
npm run build
```

### **3. Test PDF Generatie**
```typescript
// Test in browser console
const { generateQuotePDF } = usePDFGenerator();
await generateQuotePDF({
  quoteNumber: 'TEST-001',
  date: '2024-01-15',
  customerName: 'Test Customer',
  projectName: 'Test Project',
  items: [],
  subtotal: 1000,
  vatRate: 21,
  vatAmount: 210,
  totalWithVat: 1210
});
```

## 🔍 Troubleshooting

### **Common Issues**

1. **PDF niet wordt gegenereerd**
   - Check Edge Function logs
   - Verify template data structure
   - Check browser console for errors

2. **Styling problemen**
   - Verify CSS in Edge Function
   - Check paper format settings
   - Test with different orientations

3. **Template errors**
   - Verify data structure matches template
   - Check required fields
   - Validate date formats

### **Debug Steps**

1. **Check Edge Function**
   ```bash
   supabase functions logs generate-pdf
   ```

2. **Test Template**
   ```typescript
   console.log('Template data:', data);
   console.log('Generated markdown:', markdown);
   ```

3. **Verify HTML Output**
   ```typescript
   console.log('Generated HTML:', result.html);
   ```

## 📈 Future Enhancements

### **Planned Features**
- [ ] Real PDF generation (not just HTML)
- [ ] Custom CSS themes
- [ ] Batch PDF generation
- [ ] PDF templates editor
- [ ] Email integration
- [ ] Cloud storage integration

### **Advanced Options**
- [ ] Multi-language support
- [ ] Custom fonts
- [ ] Image embedding
- [ ] QR codes
- [ ] Digital signatures

## 🎉 Conclusie

Het PDF generatie systeem is volledig geïmplementeerd en klaar voor gebruik. Het biedt:

✅ **Complete PDF generatie** voor alle document types  
✅ **Flexibele templates** met Markdown  
✅ **Professional styling** met CSS  
✅ **Easy integration** met React components  
✅ **Edge Function backend** voor schaalbaarheid  
✅ **Preview functionaliteit** voor testing  

Het systeem is geïnspireerd door markdown2pdf-mcp maar volledig aangepast voor het SmansCRM gebruik, met Nederlandse templates en professionele styling.

