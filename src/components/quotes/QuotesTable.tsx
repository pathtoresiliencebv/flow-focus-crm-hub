
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Eye, ExternalLink, Trash2, CheckCircle, Mail, Copy, Pencil, FileSignature, RotateCcw, MoreHorizontal, Download, Printer } from "lucide-react";
import { Quote } from '@/types/quote';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuotesTableProps {
  quotes: Quote[];
  onPreview: (quote: Quote) => void;
  onViewPublic: (publicToken: string) => void;
  onDelete: (quoteId: string) => void;
  onApprove?: (quote: Quote) => void;
  onSendEmail?: (quote: Quote) => void;
  onDuplicate?: (quoteId: string) => void;
  onRestore?: (quoteId: string) => void;
  isArchived?: boolean;
}

export const QuotesTable: React.FC<QuotesTableProps> = ({
  quotes,
  onPreview,
  onViewPublic,
  onDelete,
  onApprove,
  onSendEmail,
  onDuplicate,
  onRestore,
  isArchived = false
}) => {
  const handlePDFDownload = async (quoteId: string) => {
    try {
      console.log('📄 Downloading PDF for quote:', quoteId);
      const { data, error } = await supabase.functions.invoke('generate-quote-pdf', {
        body: { quoteId }
      });

      console.log('📄 PDF Response:', { data, error });

      if (error) {
        console.error('❌ PDF Generation Error:', error);
        toast({
          title: "PDF Fout",
          description: `Kon PDF niet genereren: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.success && data?.htmlContent) {
        // Open PDF in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          // Wait for content to load, then trigger print
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        }
        
        toast({
          title: "PDF geopend",
          description: "Het PDF bestand is geopend voor afdrukken.",
        });
      } else {
        console.error('❌ No HTML content in response:', data);
        toast({
          title: "PDF Fout",
          description: "Geen PDF content ontvangen van server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      toast({
        title: "PDF Fout",
        description: "Er is een onverwachte fout opgetreden bij het downloaden.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async (quoteId: string) => {
    try {
      console.log('🖨️ Printing PDF for quote:', quoteId);
      const { data, error } = await supabase.functions.invoke('generate-quote-pdf', {
        body: { quoteId }
      });

      console.log('🖨️ Print PDF Response:', { data, error });

      if (error) {
        console.error('❌ PDF Print Error:', error);
        toast({
          title: "Print Fout",
          description: `Kon PDF niet genereren voor printen: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.success && data?.pdfUrl) {
        // Open PDF in new window for printing
        const printWindow = window.open(data.pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
          toast({
            title: "PDF wordt afgedrukt",
            description: "Het PDF bestand is geopend voor afdrukken.",
          });
        } else {
          toast({
            title: "Print Fout",
            description: "Kon printvenster niet openen. Controleer of pop-ups zijn toegestaan.",
            variant: "destructive",
          });
        }
      } else {
        console.error('❌ No PDF URL for printing:', data);
        toast({
          title: "Print Fout",
          description: "Geen PDF URL ontvangen voor printen.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error printing PDF:', error);
      toast({
        title: "Print Fout",
        description: "Er is een onverwachte fout opgetreden bij het printen.",
        variant: "destructive",
      });
    }
  };
  const navigate = useNavigate();
  const { toast } = useToast();
  const getStatusBadge = (status: string) => {
    const statusColors = {
      'concept': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-orange-100 text-orange-800'
    };

    const statusLabels = {
      'concept': 'Concept',
      'sent': 'Verzonden',
      'approved': 'Goedgekeurd',
      'rejected': 'Afgewezen',
      'expired': 'Verlopen'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Offertenummer</TableHead>
          <TableHead>Klant</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Datum</TableHead>
          <TableHead>Geldig tot</TableHead>
          <TableHead>Bedrag</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {quote.quote_number}
                {(quote.client_signature_data || quote.admin_signature_data) && (
                  <FileSignature className="h-4 w-4 text-green-600" />
                )}
              </div>
            </TableCell>
            <TableCell>{quote.customer_name}</TableCell>
            <TableCell>{quote.project_title || '-'}</TableCell>
            <TableCell>{new Date(quote.quote_date).toLocaleDateString('nl-NL')}</TableCell>
            <TableCell>{new Date(quote.valid_until).toLocaleDateString('nl-NL')}</TableCell>
            <TableCell>€{(quote.total_amount + quote.total_vat_amount).toFixed(2)}</TableCell>
            <TableCell>{getStatusBadge(quote.status)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(quote)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Bekijken
                  </DropdownMenuItem>
                  
                  {!isArchived && quote.status === 'concept' && (
                    <DropdownMenuItem onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Bewerken
                    </DropdownMenuItem>
                  )}
                  
                  {!isArchived && quote.public_token && (
                    <DropdownMenuItem onClick={() => onViewPublic(quote.public_token!)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Publieke link
                    </DropdownMenuItem>
                  )}
                  
                  {!isArchived && quote.status === 'concept' && onSendEmail && (
                    <DropdownMenuItem onClick={() => onSendEmail(quote)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Versturen
                    </DropdownMenuItem>
                  )}
                  
                  {!isArchived && (quote.status === 'concept' || quote.status === 'sent') && onApprove && (
                    <DropdownMenuItem onClick={() => onApprove(quote)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Goedkeuren
                    </DropdownMenuItem>
                  )}
                  
                  {!isArchived && onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(quote.id!)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Dupliceren
                    </DropdownMenuItem>
                  )}
                  
                  {isArchived && onRestore && (
                    <DropdownMenuItem onClick={() => onRestore(quote.id!)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Herstellen
                    </DropdownMenuItem>
                   )}
                   
                   <DropdownMenuSeparator />
                   
                   <DropdownMenuItem onClick={() => handlePDFDownload(quote.id!)}>
                     <Download className="mr-2 h-4 w-4" />
                     PDF downloaden
                   </DropdownMenuItem>
                   
                   <DropdownMenuItem onClick={() => handlePrint(quote.id!)}>
                      <Printer className="mr-2 h-4 w-4" />
                      PDF Printen
                    </DropdownMenuItem>
                   
                   {((!isArchived && onDelete) || (isArchived && onRestore)) && (
                     <DropdownMenuSeparator />
                   )}
                   
                   <DropdownMenuItem 
                     onClick={() => onDelete(quote.id!)}
                     className="text-destructive"
                   >
                     <Trash2 className="mr-2 h-4 w-4" />
                     {isArchived ? "Permanent verwijderen" : "Verwijderen"}
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
