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
import { Eye, Send, Download, Trash2, MoreHorizontal, FileText, Printer, Pencil, Copy, Archive, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface InvoicesTableProps {
  invoices: any[];
  onSendInvoice?: (invoice: any) => void;
  onDeleteInvoice?: (invoice: any) => void;
  onEditInvoice?: (invoice: any) => void;
  onDuplicateInvoice?: (invoice: any) => void;
  onArchiveInvoice?: (invoice: any) => void;
  onFinalizeInvoice?: (invoice: any) => void;
}

export const InvoicesTable = ({ 
  invoices, 
  onSendInvoice, 
  onDeleteInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onArchiveInvoice,
  onFinalizeInvoice
}: InvoicesTableProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concept':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
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
                <Badge variant={getStatusBadge(invoice.status)}>
                  {invoice.status}
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
                    
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      PDF Downloaden
                    </DropdownMenuItem>

                    <DropdownMenuItem>
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