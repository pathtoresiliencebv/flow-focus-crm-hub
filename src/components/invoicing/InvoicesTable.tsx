
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Send } from "lucide-react";

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

interface InvoicesTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoiceId: number) => void;
  onSendInvoice: (invoiceId: number) => void;
  getStatusBadge: (status: string) => string;
}

export const InvoicesTable = ({ invoices, onViewInvoice, onSendInvoice, getStatusBadge }: InvoicesTableProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factuurnr.</TableHead>
              <TableHead>Klant</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Vervaldatum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Bedrag</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.number}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoice.project}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">€{invoice.amount}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Bekijken"
                      onClick={() => onViewInvoice(invoice.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {(invoice.status === "Concept" || invoice.status === "Verzonden" || invoice.status === "Verlopen") && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title={invoice.status === "Concept" ? "Verzenden" : "Opnieuw verzenden"}
                        onClick={() => onSendInvoice(invoice.id)}
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Geen facturen gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
