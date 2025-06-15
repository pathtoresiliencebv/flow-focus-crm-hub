
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { InvoiceDetails } from './InvoiceDetails';
import { SendInvoiceDialog } from './SendInvoiceDialog';

// Import mock data from central location
import { mockInvoices, mockCustomers, mockProjects } from '@/data/mockData';
import { InvoicingHeader } from './invoicing/InvoicingHeader';
import { InvoiceFilters } from './invoicing/InvoiceFilters';
import { InvoicesTable } from './invoicing/InvoicesTable';
import { InvoicesSummary } from './invoicing/InvoicesSummary';

// Mock invoice items for detail view
export const mockInvoiceItems = [
  { id: 1, invoiceId: 1, description: "Renovatie materialen", quantity: 1, price: "3,250.00", total: "3,250.00" },
  { id: 2, invoiceId: 1, description: "Installatie", quantity: 1, price: "1,250.00", total: "1,250.00" },
  { id: 3, invoiceId: 1, description: "Afwerking", quantity: 1, price: "945.00", total: "945.00" },
  { id: 4, invoiceId: 2, description: "Kunststof kozijnen 120x180", quantity: 2, price: "980.00", total: "1,960.00" },
  { id: 5, invoiceId: 2, description: "Montage", quantity: 1, price: "840.00", total: "840.00" },
  { id: 6, invoiceId: 2, description: "Afwerking", quantity: 1, price: "588.00", total: "588.00" },
  { id: 7, invoiceId: 3, description: "Voordeur hoogwaardig", quantity: 1, price: "950.00", total: "950.00" },
  { id: 8, invoiceId: 3, description: "Plaatsing", quantity: 1, price: "420.00", total: "420.00" },
  { id: 9, invoiceId: 3, description: "Afwerking", quantity: 1, price: "142.50", total: "142.50" },
  { id: 10, invoiceId: 4, description: "HR++ Glas 90x120", quantity: 6, price: "520.00", total: "3,120.00" },
  { id: 11, invoiceId: 4, description: "Installatie", quantity: 1, price: "1,236.00", total: "1,236.00" },
  { id: 12, invoiceId: 5, description: "Kunststof kozijnen complete set", quantity: 1, price: "4,800.00", total: "4,800.00" },
  { id: 13, invoiceId: 5, description: "Montage", quantity: 1, price: "1,200.00", total: "1,200.00" },
  { id: 14, invoiceId: 5, description: "Afwerking en details", quantity: 1, price: "292.00", total: "292.00" },
];

export function Invoicing() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [invoices, setInvoices] = useState([...mockInvoices]);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<any>(null);

  // Filter invoices based on search term and status filter
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.project.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === null || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Betaald":
        return "bg-green-100 text-green-800";
      case "Verzonden":
        return "bg-blue-100 text-blue-800";
      case "Concept":
        return "bg-gray-100 text-gray-800";
      case "Verlopen":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handler for sending invoice with popup
  const handleSendInvoice = (invoiceId: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setInvoiceToSend(invoice);
      setShowSendDialog(true);
    }
  };

  // Handler for confirming send
  const handleSendConfirm = (emailData: { to: string; subject: string; message: string }) => {
    if (!invoiceToSend) return;

    const updatedInvoices = invoices.map(inv => 
      inv.id === invoiceToSend.id 
        ? { ...inv, status: "Verzonden" } 
        : inv
    );
    
    setInvoices(updatedInvoices);
    
    toast({
      title: "Factuur verzonden",
      description: `Factuur ${invoiceToSend.number} is verzonden naar ${emailData.to}.`,
    });
    
    setInvoiceToSend(null);
    setOpenDetailDialog(false);
  };

  // Handler for viewing invoice details
  const handleViewInvoice = (invoiceId: number) => {
    setSelectedInvoice(invoiceId);
    setOpenDetailDialog(true);
  };

  // Get invoice details
  const getInvoiceDetail = (id: number) => {
    return invoices.find(invoice => invoice.id === id);
  };

  // Get invoice items
  const getInvoiceItems = (id: number) => {
    return mockInvoiceItems.filter(item => item.invoiceId === id);
  };

  // Close invoice detail dialog
  const closeDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <InvoicingHeader customers={mockCustomers} projects={mockProjects} />

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
              items={getInvoiceItems(selectedInvoice)}
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
        invoiceNumber={invoiceToSend?.number || ''}
        customerEmail="klant@example.com" // In echte app van klantgegevens
        customerName={invoiceToSend?.customer || ''}
        type="invoice"
      />
    </div>
  );
}
