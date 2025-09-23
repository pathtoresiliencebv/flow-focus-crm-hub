import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Eye, Send, Download, Trash2, MoreHorizontal, FileText, Printer, Pencil, Copy, Archive, CheckCircle, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from '@/integrations/supabase/client';

interface InvoicesTableProps {
  invoices: any[];
  onSendInvoice?: (invoice: any) => void;
  onDeleteInvoice?: (invoice: any) => void;
  onEditInvoice?: (invoice: any) => void;
  onDuplicateInvoice?: (invoice: any) => void;
  onArchiveInvoice?: (invoice: any) => void;
  onFinalizeInvoice?: (invoice: any) => void;
  onSendReminder?: (invoice: any) => void;
}

export const InvoicesTable = ({ 
  invoices, 
  onSendInvoice, 
  onDeleteInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onArchiveInvoice,
  onFinalizeInvoice,
  onSendReminder
}: InvoicesTableProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concept':
        return 'secondary'; // grijs
      case 'sent':
      case 'verzonden':
        return 'default'; // custom groen in CSS
      case 'herinnering':
        return 'outline'; // custom blauw in CSS  
      case 'paid':
      case 'betaald':
        return 'default'; // success groen
      case 'overdue':
        return 'destructive'; // rood
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concept': return 'Concept';
      case 'sent':
      case 'verzonden': return 'Verzonden';
      case 'herinnering': return 'Herinnering';
      case 'paid':
      case 'betaald': return 'Betaald';
      case 'overdue': return 'Verlopen';
      default: return status;
    }
  };

  const isOverdue = (invoice: any) => {
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    return invoice.status !== 'betaald' && invoice.status !== 'paid' && dueDate < today;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Factuurnummer</TableHead>
            <TableHead>Klant</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Totaal</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.invoice_number}
              </TableCell>
              <TableCell>{invoice.customer_name}</TableCell>
              <TableCell>{invoice.project_title || '-'}</TableCell>
              <TableCell>
                {new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={getStatusBadge(isOverdue(invoice) ? 'overdue' : invoice.status)}
                  className={
                    invoice.status === 'verzonden' || invoice.status === 'sent' 
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' 
                      : invoice.status === 'herinnering'
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200'
                      : (invoice.status === 'betaald' || invoice.status === 'paid')
                      ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                      : ''
                  }
                >
                  {getStatusLabel(isOverdue(invoice) ? 'overdue' : invoice.status)}
                </Badge>
              </TableCell>
              <TableCell>€{invoice.total_amount.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Bekijken
                    </DropdownMenuItem>
                    
                    {invoice.status === 'concept' && onEditInvoice && (
                      <DropdownMenuItem onClick={() => onEditInvoice(invoice)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Bewerken
                      </DropdownMenuItem>
                    )}

                    {invoice.status === 'concept' && onFinalizeInvoice && (
                      <DropdownMenuItem onClick={() => onFinalizeInvoice(invoice)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Finaliseren
                      </DropdownMenuItem>
                    )}
                    
                    {invoice.status === 'concept' && onSendInvoice && (
                      <DropdownMenuItem onClick={() => onSendInvoice(invoice)}>
                        <Send className="mr-2 h-4 w-4" />
                        Versturen
                      </DropdownMenuItem>
                    )}

                    {(invoice.status === 'verzonden' || invoice.status === 'sent') && onSendReminder && (
                      <DropdownMenuItem onClick={() => onSendReminder(invoice)}>
                        <Bell className="mr-2 h-4 w-4" />
                        Betalingsherinnering
                      </DropdownMenuItem>
                    )}

                    {onDuplicateInvoice && (
                      <DropdownMenuItem onClick={() => onDuplicateInvoice(invoice)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Dupliceren
                      </DropdownMenuItem>
                    )}
                    
                     <DropdownMenuItem onClick={() => window.open(`/invoices/${invoice.id}/preview`, '_blank')}>
                       <FileText className="mr-2 h-4 w-4" />
                       PDF Preview
                     </DropdownMenuItem>
                     
                     <DropdownMenuItem onClick={() => {
                       // Download PDF using edge function
                       supabase.functions.invoke('generate-invoice-pdf', {
                         body: { invoiceId: invoice.id }
                       }).then(({ data, error }) => {
                         if (data?.success && data?.pdfData) {
                           const byteCharacters = atob(data.pdfData);
                           const byteNumbers = new Array(byteCharacters.length);
                           for (let i = 0; i < byteCharacters.length; i++) {
                             byteNumbers[i] = byteCharacters.charCodeAt(i);
                           }
                           const byteArray = new Uint8Array(byteNumbers);
                           const blob = new Blob([byteArray], { type: 'application/pdf' });
                           
                           const url = URL.createObjectURL(blob);
                           const link = document.createElement('a');
                           link.href = url;
                           link.download = `factuur-${invoice.invoice_number}.pdf`;
                           document.body.appendChild(link);
                           link.click();
                           document.body.removeChild(link);
                           URL.revokeObjectURL(url);
                         }
                       });
                     }}>
                       <Download className="mr-2 h-4 w-4" />
                       PDF Downloaden
                     </DropdownMenuItem>

                     <DropdownMenuItem onClick={() => window.print()}>
                       <Printer className="mr-2 h-4 w-4" />
                       Printen
                     </DropdownMenuItem>

                    {onArchiveInvoice && (
                      <DropdownMenuItem onClick={() => onArchiveInvoice(invoice)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archiveren
                      </DropdownMenuItem>
                    )}
                    
                    {onDeleteInvoice && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteInvoice(invoice)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Verwijderen
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};