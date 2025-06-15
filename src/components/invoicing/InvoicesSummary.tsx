
interface Invoice {
  id: number;
  number: string;
  customer: string;
  project: string;
  date: string;
  dueDate: string;
  status: string;
  amount: string;
}

interface InvoicesSummaryProps {
  invoices: Invoice[];
}

export const InvoicesSummary = ({ invoices }: InvoicesSummaryProps) => {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-muted-foreground">
        Totaal: {invoices.length} facturen
      </div>
      <div className="font-medium">
        Totaalbedrag: €{invoices
          .reduce((sum, invoice) => sum + parseFloat(invoice.amount.replace(',', '.')), 0)
          .toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }
      </div>
    </div>
  );
};
