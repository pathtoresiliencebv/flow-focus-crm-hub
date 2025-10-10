
import React, { useState } from 'react';
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
import { Eye, ExternalLink, Trash2, CheckCircle, Mail, Copy, Pencil, FileSignature, RotateCcw, MoreHorizontal, Download, Archive } from "lucide-react";
import { Quote } from '@/types/quote';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// import html2pdf from 'html2pdf.js'; // Temporarily disabled for build
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

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
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  const handlePDFDownload = async (quote: Quote) => {
    try {
      console.log('📄 Downloading PDF for quote:', quote.id);
      
      const { data, error } = await supabase.functions.invoke('generate-quote-pdf', {
        body: { 
          quoteId: quote.id,
          includeSigned: quote.status === 'approved' || quote.status === 'goedgekeurd'
        }
      });

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
        // Create a temporary element to render the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        document.body.appendChild(tempDiv);

        // Use html2pdf to generate and download PDF
        const html2pdf = (await import('html2pdf.js')).default;
        
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Offerte-${quote.quote_number || 'onbekend'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            scrollY: 0,
            scrollX: 0,
            windowHeight: tempDiv.scrollHeight,
            logging: false
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compressPDF: true },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['img', 'table', '.avoid-break'] },
        };

        await html2pdf().set(opt).from(tempDiv).save();
        
        // Clean up
        document.body.removeChild(tempDiv);

        toast({
          title: "PDF Gedownload",
          description: "PDF is succesvol gedownload",
        });
      } else {
        toast({
          title: "PDF Fout",
          description: "Geen PDF data ontvangen",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Error downloading PDF:', error);
      toast({
        title: "Fout bij PDF downloaden",
        description: error.message || "Er ging iets mis bij het downloaden van de PDF.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async (quoteId: string) => {
    try {
      console.log('🖨️ Printing PDF for quote:', quoteId);
      
      // Find quote to get quote number for filename
      const quote = quotes.find(q => q.id === quoteId);
      const filename = `Offerte-${quote?.quote_number || 'onbekend'}`;
      
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

      if (data?.success && data?.htmlContent) {
        // Open HTML in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          // Wait for content to load, then trigger print
          setTimeout(() => {
            printWindow.print();
          }, 500);
          
          toast({
            title: "PDF Geopend",
            description: "Het PDF bestand is geopend voor afdrukken.",
          });
        } else {
          toast({
            title: "Pop-up Geblokkeerd",
            description: "Sta pop-ups toe voor deze website om PDF te openen.",
            variant: "destructive",
          });
        }
      } else {
        console.error('❌ No HTML content for printing:', data);
        toast({
          title: "PDF Fout",
          description: "Geen PDF content ontvangen van server.",
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

  // Helper function to get invoice term fraction display
  const getInvoiceTermDisplay = (quote: any) => {
    if (!quote.invoices || quote.invoices.length === 0) return null;
    
    const totalTerms = quote.invoices[0]?.total_payment_terms || 1;
    const currentTerm = quote.invoices.length;
    
    if (totalTerms === 1) return '1/1';
    if (totalTerms === 2) return '½';
    if (totalTerms === 3) return '⅓';
    if (totalTerms === 4) return '¼';
    return `${currentTerm}/${totalTerms}`;
  };

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Offertenummer</TableHead>
          <TableHead>Klant</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Gefactureerd</TableHead>
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
            <TableCell>
              {quote.invoices && quote.invoices.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg text-green-600">
                    {getInvoiceTermDisplay(quote)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({quote.invoices.length}/{quote.invoices[0]?.total_payment_terms || 1})
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
            <TableCell>{new Date(quote.quote_date).toLocaleDateString('nl-NL')}</TableCell>
            <TableCell>{new Date(quote.valid_until).toLocaleDateString('nl-NL')}</TableCell>
            <TableCell>€{(quote.total_amount + quote.total_vat_amount).toFixed(2)}</TableCell>
            <TableCell>{getStatusBadge(quote.status)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                {onSendEmail && quote.status === 'concept' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSendEmail(quote)}
                    title="Offerte versturen"
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
                  <DropdownMenuItem onClick={() => onPreview(quote)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Bekijken
                  </DropdownMenuItem>
                  
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
                   
                   <DropdownMenuItem onClick={() => handlePDFDownload(quote)}>
                     <Download className="mr-2 h-4 w-4" />
                     PDF downloaden
                   </DropdownMenuItem>
                   
                   {onDelete && (
                     <DropdownMenuSeparator />
                   )}
                   
                   {!isArchived && onDelete && (
                     <DropdownMenuItem 
                       onClick={() => {
                         setQuoteToDelete(quote);
                         setDeleteDialogOpen(true);
                       }}
                       className="text-orange-600"
                     >
                       <Archive className="mr-2 h-4 w-4" />
                       Archiveren
                     </DropdownMenuItem>
                   )}
                   
                   {isArchived && onDelete && (
                     <DropdownMenuItem 
                       onClick={() => {
                         setQuoteToDelete(quote);
                         setDeleteDialogOpen(true);
                       }}
                       className="text-destructive"
                     >
                       <Trash2 className="mr-2 h-4 w-4" />
                       Permanent verwijderen
                     </DropdownMenuItem>
                   )}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    
    <ConfirmDeleteDialog
      isOpen={deleteDialogOpen}
      onClose={() => {
        setDeleteDialogOpen(false);
        setQuoteToDelete(null);
      }}
      onConfirm={() => {
        if (quoteToDelete?.id) {
          onDelete(quoteToDelete.id);
        }
      }}
      quote={quoteToDelete}
      isArchiving={!isArchived}
    />
  </>
  );
};
