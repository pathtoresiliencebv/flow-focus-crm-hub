

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { InvoiceDetails } from './InvoiceDetails';
import { SendInvoiceDialog } from './SendInvoiceDialog';
import { useInvoices } from '@/hooks/useInvoices';
import { useCrmStore } from "@/hooks/useCrmStore";
import { InvoicingHeader } from './invoicing/InvoicingHeader';
import { InvoiceFilters } from './invoicing/InvoiceFilters';
import { InvoicesTable } from './invoicing/InvoicesTable';
import { InvoicesSummary } from './invoicing/InvoicesSummary';
import { supabase } from '@/integrations/supabase/client';

export function Invoicing() {
  const { toast } = useToast();
  const { customers, projects } = useCrmStore();
  const { invoices, loading, fetchInvoiceItems, updateInvoiceStatus } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  // Filter invoices based on search term and status filter
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.project_title && invoice.project_title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === null || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "betaald":
        return "bg-green-100 text-green-800";
      case "verzonden":
        return "bg-blue-100 text-blue-800";
      case "concept":
        return "bg-gray-100 text-gray-800";
      case "verlopen":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handler for sending invoice with popup
  const handleSendInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setInvoiceToSend(invoice);
      setShowSendDialog(true);
    }
  };

  // Handler for confirming send
  const handleSendConfirm = async (emailData: { to: string; subject: string; message: string }) => {
    if (!invoiceToSend) return;
    
    try {
      console.log('Sending invoice email for invoice:', invoiceToSend.id);
      
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoiceToSend.id,
          recipientEmail: emailData.to,
          recipientName: invoiceToSend.customer_name,
          subject: emailData.subject,
          message: emailData.message
        }
      });

      console.log('Response from send-invoice-email:', { data, error });

      if (error) {
        console.error('Error sending invoice:', error);
        toast({
          title: "Fout bij verzenden",
          description: `Er is een fout opgetreden: ${error.message || 'Onbekende fout'}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Factuur verzonden",
        description: `Factuur ${invoiceToSend.invoice_number} is succesvol per e-mail verzonden naar ${emailData.to}.`,
      });
    } catch (error: any) {
      console.error('Unexpected error sending invoice:', error);
      toast({
        title: "Fout bij verzenden",
        description: `Er is een onverwachte fout opgetreden: ${error.message || 'Onbekende fout'}`,
        variant: "destructive",
      });
    } finally {
      setInvoiceToSend(null);
      setShowSendDialog(false);
    }
  };

  // Handler for viewing invoice details
  const handleViewInvoice = async (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    const items = await fetchInvoiceItems(invoiceId);
    setInvoiceItems(items);
    setOpenDetailDialog(true);
  };

  // Get invoice details
  const getInvoiceDetail = (id: string) => {
    const invoice = invoices.find(invoice => invoice.id === id);
    if (!invoice) return null;
    
    // Convert database invoice to InvoiceDetails expected format
    return {
      id: parseInt(invoice.id.slice(-8), 16), // Create numeric ID from UUID
      number: invoice.invoice_number,
      customer: invoice.customer_name,
      project: invoice.project_title || 'Geen project',
      date: new Date(invoice.invoice_date).toLocaleDateString('nl-NL'),
      dueDate: new Date(invoice.due_date).toLocaleDateString('nl-NL'),
      status: invoice.status === 'concept' ? 'Concept' : 
              invoice.status === 'verzonden' ? 'Verzonden' :
              invoice.status === 'betaald' ? 'Betaald' : 'Verlopen',
      amount: invoice.total_amount.toFixed(2)
    };
  };

  // Convert invoice items to expected format
  const getConvertedInvoiceItems = (items: any[]) => {
    return items.map((item, index) => ({
      id: index + 1,
      invoiceId: 1, // Not used in display
      description: item.description,
      quantity: item.quantity || 1,
      price: (item.unit_price || 0).toFixed(2),
      vatRate: item.vat_rate,
      total: (item.total || 0).toFixed(2)
    }));
  };

  // Close invoice detail dialog
  const closeDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedInvoice(null);
    setInvoiceItems([]);
  };

  // Convert customers and projects to the format expected by InvoicingHeader
  const formCustomers = customers.map(customer => ({
    id: customer.id, // Keep as string UUID
    name: customer.name
  }));

  const formProjects = projects.map(project => ({
    id: project.id, // Keep as string UUID
    title: project.title,
    value: project.value?.toString() || '0',
    customer: project.customer
  }));

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <InvoicingHeader customers={formCustomers} projects={formProjects} />

      <InvoiceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />
      
      <InvoicesTable
        invoices={filteredInvoices}
        onViewInvoice={handleViewInvoice}
        onSendInvoice={handleSendInvoice}
        getStatusBadge={getStatusBadge}
      />
      
      <InvoicesSummary invoices={filteredInvoices} />

      {/* Invoice Detail Dialog */}
      <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
        <DialogContent className="sm:max-w-[800px]">
          {selectedInvoice !== null && getInvoiceDetail(selectedInvoice) && (
            <InvoiceDetails 
              invoice={getInvoiceDetail(selectedInvoice)!}
              items={getConvertedInvoiceItems(invoiceItems)}
              onSend={(invoiceId: number) => handleSendInvoice(selectedInvoice!)}
              onClose={closeDetailDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Send Invoice Dialog */}
      <SendInvoiceDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        onSend={handleSendConfirm}
        invoiceNumber={invoiceToSend?.invoice_number || ''}
        customerEmail={invoiceToSend?.customer_email || "klant@example.com"}
        customerName={invoiceToSend?.customer_name || ''}
        type="invoice"
      />
    </div>
  );
}

