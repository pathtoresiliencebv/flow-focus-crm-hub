/**
 * Invoice Template for PDF Generation
 * Markdown template for generating invoice PDFs
 */

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  customerVatNumber?: string;
  companyName: string;
  companyAddress: string;
  companyVatNumber: string;
  companyEmail: string;
  companyPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  notes?: string;
  paymentTerms?: string;
  bankDetails?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export const invoiceTemplate = (data: InvoiceData): string => {
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
${data.items.map(item => 
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
};

export const receiptTemplate = (data: any): string => {
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
};

