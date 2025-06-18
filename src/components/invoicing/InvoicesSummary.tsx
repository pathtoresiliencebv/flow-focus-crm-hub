
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Invoice {
  id: string;
  status: string;
  total_amount: number;
}

interface InvoicesSummaryProps {
  invoices: Invoice[];
}

export function InvoicesSummary({ invoices }: InvoicesSummaryProps) {
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const conceptCount = invoices.filter(inv => inv.status === 'concept').length;
  const sentCount = invoices.filter(inv => inv.status === 'verzonden').length;
  const paidCount = invoices.filter(inv => inv.status === 'betaald').length;
  const overdueCount = invoices.filter(inv => inv.status === 'verlopen').length;

  const paidAmount = invoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);

  const outstandingAmount = invoices
    .filter(inv => inv.status === 'verzonden' || inv.status === 'verlopen')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totaal Facturen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{invoices.length}</div>
          <p className="text-xs text-muted-foreground">
            €{totalAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Concept:</span>
              <span>{conceptCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Verzonden:</span>
              <span>{sentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Betaald:</span>
              <span>{paidCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Verlopen:</span>
              <span>{overdueCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Betaalde Facturen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            €{paidAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {paidCount} facturen
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Openstaand Bedrag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            €{outstandingAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {sentCount + overdueCount} facturen
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
