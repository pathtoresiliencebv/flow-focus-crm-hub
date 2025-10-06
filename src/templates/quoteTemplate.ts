/**
 * Quote Template for PDF Generation
 * Markdown template for generating quote PDFs
 */

export interface QuoteData {
  quoteNumber: string;
  date: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  projectName: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  items: QuoteItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  notes?: string;
  terms?: string;
  validUntil?: string;
}

export interface QuoteItem {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export const quoteTemplate = (data: QuoteData): string => {
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
${data.items.map(item => 
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
};

export const invoiceTemplate = (data: any): string => {
  // Similar structure but for invoices
  return quoteTemplate(data).replace('# Offerte', '# Factuur').replace('Offerte', 'Factuur');
};

export const projectReportTemplate = (data: any): string => {
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
};

