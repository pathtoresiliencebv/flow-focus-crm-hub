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

// Import mock data from central location
import { mockInvoices, mockCustomers, mockProjects } from '@/data/mockData';

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

    await updateInvoiceStatus(invoiceToSend.id, "verzonden");
    
    toast({
      title: "Factuur verzonden",
      description: `Factuur ${invoiceToSend.invoice_number} is verzonden naar ${emailData.to}.`,
    });
    
    setInvoiceToSend(null);
    setOpenDetailDialog(false);
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
    return invoices.find(invoice => invoice.id === id);
  };

  // Get invoice items
  const getInvoiceItems = (id: string) => {
    return mockInvoiceItems.filter(item => item.invoiceId === id);
  };

  // Close invoice detail dialog
  const closeDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedInvoice(null);
    setInvoiceItems([]);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <InvoicingHeader customers={customers} projects={projects} />

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
              items={invoiceItems}
              onSend={handleSendInvoice}
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
