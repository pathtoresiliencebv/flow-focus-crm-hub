
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Send, CreditCard, DollarSign } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  project_title?: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  source_quote_id?: string;
  payment_date?: string;
  payment_method?: string;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoiceId: string) => void;
  onSendInvoice: (invoiceId: string) => void;
  getStatusBadge: (status: string) => string;
}

export function InvoicesTable({ invoices, onViewInvoice, onSendInvoice, getStatusBadge }: InvoicesTableProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Factuurnummer</TableHead>
            <TableHead>Klant</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Vervaldatum</TableHead>
            <TableHead>Bedrag</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bron</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.customer_name}</TableCell>
              <TableCell>{invoice.project_title || '-'}</TableCell>
              <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</TableCell>
              <TableCell>{new Date(invoice.due_date).toLocaleDateString('nl-NL')}</TableCell>
              <TableCell>€{invoice.total_amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge className={getStatusBadge(invoice.status)}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell>
                {invoice.source_quote_id ? (
                  <Badge variant="outline" className="text-xs">
                    Offerte
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Handmatig
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewInvoice(invoice.id)}
                    title="Bekijken"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {invoice.status === "concept" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSendInvoice(invoice.id)}
                      title="Verzenden"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                Geen facturen gevonden
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
