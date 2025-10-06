import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFRequest {
  template: 'quote' | 'invoice' | 'receipt' | 'project-report';
  data: any;
  options?: {
    paperFormat?: 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid';
    paperOrientation?: 'portrait' | 'landscape';
    paperBorder?: string;
    watermark?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 PDF Generation started');
    
    const { template, data, options = {} }: PDFRequest = await req.json();
    console.log('📄 Template:', template, 'Options:', options);

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Generate markdown from template
    const markdown = generateMarkdownFromTemplate(template, data);
    console.log('📝 Generated markdown:', markdown.substring(0, 200) + '...');

    // Create HTML from markdown
    const html = markdownToHtml(markdown);
    console.log('🌐 Generated HTML');

    // Create styled HTML document
    const styledHtml = createStyledHTML(html, options);
    console.log('🎨 Applied styling');

    // For now, return the HTML content
    // In a real implementation, you'd use a PDF generation library
    const result = {
      success: true,
      html: styledHtml,
      markdown: markdown,
      filename: generateFilename(template, data),
      message: 'PDF content generated successfully. HTML version returned.'
    };

    console.log('✅ PDF generation completed');

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ PDF generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'PDF generation failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Generate markdown from template and data
 */
function generateMarkdownFromTemplate(template: string, data: any): string {
  switch (template) {
    case 'quote':
      return generateQuoteMarkdown(data);
    case 'invoice':
      return generateInvoiceMarkdown(data);
    case 'receipt':
      return generateReceiptMarkdown(data);
    case 'project-report':
      return generateProjectReportMarkdown(data);
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

/**
 * Generate quote markdown
 */
function generateQuoteMarkdown(data: any): string {
  const formatCurrency = (amount: number) => `€${amount.toFixed(2).replace('.', ',')}`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL');
  };

  return `# Offerte ${data.quoteNumber}

**Datum:** ${formatDate(data.date)}
${data.validUntil ? `**Geldig tot:** ${formatDate(data.validUntil)}` : ''}

---

## Klantgegevens

**${data.customerName}**
${data.customerAddress ? data.customerAddress : ''}
${data.customerEmail ? `Email: ${data.customerEmail}` : ''}

## Project Details

- **Project:** ${data.projectName}
${data.location ? `- **Locatie:** ${data.location}` : ''}
${data.startDate ? `- **Startdatum:** ${formatDate(data.startDate)}` : ''}
${data.endDate ? `- **Einddatum:** ${formatDate(data.endDate)}` : ''}

---

## Offerte Items

| Omschrijving | Aantal | Eenheid | Prijs | Totaal |
|-------------|--------|---------|-------|--------|
${data.items.map((item: any) => 
  `| ${item.name} | ${item.quantity} | ${item.unit} | ${formatCurrency(item.price)} | ${formatCurrency(item.total)} |`
).join('\n')}

---

## Kostenoverzicht

| | Bedrag |
|---|--------|
| **Subtotaal** | ${formatCurrency(data.subtotal)} |
| **BTW (${data.vatRate}%)** | ${formatCurrency(data.vatAmount)} |
| **Totaal inclusief BTW** | **${formatCurrency(data.totalWithVat)}** |

---

${data.notes ? `## Opmerkingen

${data.notes}

---` : ''}

${data.terms ? `## Algemene Voorwaarden

${data.terms}

---` : ''}

**Deze offerte is geldig tot ${data.validUntil ? formatDate(data.validUntil) : '30 dagen na datum'}.**

Voor vragen kunt u contact opnemen via email of telefoon.

---
*Offerte gegenereerd op ${formatDate(new Date().toISOString())}*`;
}

/**
 * Generate invoice markdown
 */
function generateInvoiceMarkdown(data: any): string {
  const formatCurrency = (amount: number) => `€${amount.toFixed(2).replace('.', ',')}`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL');
  };

  return `# Factuur ${data.invoiceNumber}

**Factuurdatum:** ${formatDate(data.invoiceDate)}
**Vervaldatum:** ${formatDate(data.dueDate)}

---

## Debiteur

**${data.customerName}**
${data.customerAddress ? data.customerAddress : ''}
${data.customerEmail ? `Email: ${data.customerEmail}` : ''}
${data.customerVatNumber ? `BTW-nummer: ${data.customerVatNumber}` : ''}

## Leverancier

**${data.companyName}**
${data.companyAddress}
BTW-nummer: ${data.companyVatNumber}
Email: ${data.companyEmail}
Telefoon: ${data.companyPhone}

---

## Factuurregels

| Omschrijving | Aantal | Eenheid | Eenheidsprijs | Totaal |
|-------------|--------|---------|---------------|--------|
${data.items.map((item: any) => 
  `| ${item.description} | ${item.quantity} | ${item.unit} | ${formatCurrency(item.unitPrice)} | ${formatCurrency(item.total)} |`
).join('\n')}

---

## Kostenoverzicht

| | Bedrag |
|---|--------|
| **Subtotaal** | ${formatCurrency(data.subtotal)} |
| **BTW (${data.vatRate}%)** | ${formatCurrency(data.vatAmount)} |
| **Totaal inclusief BTW** | **${formatCurrency(data.totalWithVat)}** |

---

${data.notes ? `## Opmerkingen

${data.notes}

---` : ''}

## Betalingsvoorwaarden

${data.paymentTerms || 'Betaling binnen 30 dagen na factuurdatum.'}

${data.bankDetails ? `
## Bankgegevens

${data.bankDetails}
` : ''}

**Gelieve het bedrag van ${formatCurrency(data.totalWithVat)} over te maken naar bovenstaande rekening.**

---
*Factuur gegenereerd op ${formatDate(new Date().toISOString())}*`;
}

/**
 * Generate receipt markdown
 */
function generateReceiptMarkdown(data: any): string {
  return `# Bonnetje ${data.receiptNumber}

**Datum:** ${data.date}
**Klant:** ${data.customerName}

## Items

| Omschrijving | Aantal | Prijs | Totaal |
|-------------|--------|-------|--------|
${data.items.map((item: any) => 
  `| ${item.description} | ${item.quantity} | €${item.price} | €${item.total} |`
).join('\n')}

**Totaal:** €${data.total}

---
*Bonnetje gegenereerd op ${new Date().toLocaleDateString('nl-NL')}*`;
}

/**
 * Generate project report markdown
 */
function generateProjectReportMarkdown(data: any): string {
  return `# Project Rapport: ${data.projectName}

**Periode:** ${data.startDate} - ${data.endDate}
**Projectleider:** ${data.projectManager}

## Status Overzicht

- **Voortgang:** ${data.progress}%
- **Status:** ${data.status}
- **Voltooiingsdatum:** ${data.completionDate}

## Werkzaamheden

### Week 1
- [x] ${data.completedTask1}
- [x] ${data.completedTask2}
- [ ] ${data.pendingTask1}

## Materialen Gebruikt

| Materiaal | Aantal | Kosten |
|-----------|--------|--------|
| ${data.material1} | ${data.qty1} | €${data.cost1} |
`;
}

/**
 * Convert markdown to HTML
 */
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]*)`/gim, '<code>$1</code>')
    // Line breaks
    .replace(/\n/gim, '<br>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

  return html;
}

/**
 * Create styled HTML document
 */
function createStyledHTML(html: string, options: any): string {
  const paperSize = getPaperSize(options.paperFormat);
  const orientation = options.paperOrientation || 'portrait';
  const border = options.paperBorder || '2cm';
  const watermark = options.watermark;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDF Document</title>
  <style>
    @page {
      size: ${paperSize} ${orientation};
      margin: ${border};
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: #2563eb;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    h1 { font-size: 2em; border-bottom: 2px solid #2563eb; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    
    p { margin-bottom: 1em; }
    
    strong { font-weight: 600; }
    em { font-style: italic; }
    
    code {
      background-color: #f3f4f6;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    
    pre {
      background-color: #f3f4f6;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1em 0;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }
    
    li {
      margin-bottom: 0.5em;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    
    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.5em;
      text-align: left;
    }
    
    th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 3em;
      color: rgba(0, 0, 0, 0.1);
      z-index: -1;
      pointer-events: none;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${watermark ? `<div class="watermark">${watermark}</div>` : ''}
  ${html}
</body>
</html>`;
}

/**
 * Get paper size for CSS
 */
function getPaperSize(format?: string): string {
  switch (format) {
    case 'a3': return 'A3';
    case 'letter': return 'letter';
    case 'legal': return 'legal';
    case 'tabloid': return 'tabloid';
    default: return 'A4';
  }
}

/**
 * Generate filename
 */
function generateFilename(template: string, data: any): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const number = data.quoteNumber || data.invoiceNumber || data.receiptNumber || 'document';
  return `${template}-${number}-${timestamp}.pdf`;
}

