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
import { Eye, Send, Download, Trash2, MoreHorizontal, FileText, Pencil, Copy, Archive, CheckCircle, Bell, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
// import html2pdf from 'html2pdf.js'; // Temporarily disabled for build

interface InvoicesTableProps {
  invoices: any[];
  onSendInvoice?: (invoice: any) => void;
  onDeleteInvoice?: (invoice: any) => void;
  onEditInvoice?: (invoice: any) => void;
  onDuplicateInvoice?: (invoice: any) => void;
  onArchiveInvoice?: (invoice: any) => void;
  onFinalizeInvoice?: (invoice: any) => void;
  onSendReminder?: (invoice: any) => void;
  onViewInvoice?: (invoice: any) => void;
}

export const InvoicesTable = ({ 
  invoices, 
  onSendInvoice, 
  onDeleteInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onArchiveInvoice,
  onFinalizeInvoice,
  onSendReminder,
  onViewInvoice
}: InvoicesTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

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
            <TableHead>Termijn</TableHead>
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
                {invoice.payment_term_sequence > 1 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({invoice.payment_term_sequence}/{invoice.total_payment_terms})
                  </span>
                )}
              </TableCell>
              <TableCell>{invoice.customer_name}</TableCell>
              <TableCell>{invoice.project_title || '-'}</TableCell>
              <TableCell>
                {invoice.total_payment_terms > 1 ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-lg">
                      {invoice.payment_term_sequence === 1 && invoice.total_payment_terms === 2 && '½'}
                      {invoice.payment_term_sequence === 2 && invoice.total_payment_terms === 2 && '½'}
                      {invoice.payment_term_sequence === 1 && invoice.total_payment_terms === 3 && '⅓'}
                      {invoice.payment_term_sequence === 2 && invoice.total_payment_terms === 3 && '⅓'}
                      {invoice.payment_term_sequence === 3 && invoice.total_payment_terms === 3 && '⅓'}
                      {invoice.payment_term_sequence === 1 && invoice.total_payment_terms === 4 && '¼'}
                      {invoice.payment_term_sequence === 2 && invoice.total_payment_terms === 4 && '¼'}
                      {invoice.payment_term_sequence === 3 && invoice.total_payment_terms === 4 && '¼'}
                      {invoice.payment_term_sequence === 4 && invoice.total_payment_terms === 4 && '¼'}
                      {!(invoice.total_payment_terms >= 2 && invoice.total_payment_terms <= 4) && `${invoice.payment_term_sequence}/${invoice.total_payment_terms}`}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Volledig</span>
                )}
              </TableCell>
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
                <div className="flex items-center justify-end gap-2">
                  {onSendInvoice && invoice.status === 'concept' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSendInvoice(invoice)}
                      title="Factuur versturen"
                    >
                      <Mail className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewInvoice?.(invoice)}>
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
                    
                    <DropdownMenuItem onClick={() => {
                       console.log('📄 Opening invoice detail for PDF download:', invoice.id);
                       navigate(`/invoices/${invoice.id}`);
                       toast({
                         title: "Factuur geopend",
                         description: "Gebruik de 'Download PDF' knop in de factuur om de PDF te downloaden.",
                       });
                     }}>
                       <Download className="mr-2 h-4 w-4" />
                       PDF downloaden
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};