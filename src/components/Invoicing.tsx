import { useState } from "react";
import { FileText, Archive } from "lucide-react";
import { IconBox } from "@/components/ui/icon-box";
import { InvoicesTable } from "./invoicing/InvoicesTable";
import { InvoiceFilters } from "./invoicing/InvoiceFilters";
import { ArchivedInvoicesView } from "./invoicing/ArchivedInvoicesView";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceFinalizationDialog } from "./invoicing/InvoiceFinalizationDialog";
import { MultiBlockInvoiceForm } from "./invoicing/MultiBlockInvoiceForm";
import { SimpleInvoiceForm } from "./invoicing/SimpleInvoiceForm";
import { useInvoices } from "@/hooks/useInvoices";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface InvoicingProps {
  invoiceType?: 'simple' | 'detailed';
  showNewInvoice?: boolean;
  onCloseNewInvoice?: () => void;
}

export const Invoicing: React.FC<InvoicingProps> = ({ 
  invoiceType = 'detailed',
  showNewInvoice = false,
  onCloseNewInvoice
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invoices, loading, deleteInvoice, duplicateInvoice, archiveInvoice, sendPaymentReminder, refetch } = useInvoices();
  const [activeTab, setActiveTab] = useState("active");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showFinalizationDialog, setShowFinalizationDialog] = useState(false);
  const [showNewInvoiceForm, setShowNewInvoiceForm] = useState(showNewInvoice || window.location.pathname === "/invoices/new");
  const [currentInvoiceType, setCurrentInvoiceType] = useState<'simple' | 'detailed'>(invoiceType);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    dateRange: "all"
  });

  const handleSendInvoice = async (invoice: any) => {
    if (!invoice?.id) {
      toast({
        title: "Fout",
        description: "Geen geldige factuur geselecteerd.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📧 Sending invoice:', invoice.id, invoice.invoice_number);
      
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: { 
          invoiceId: invoice.id
        }
      });

      if (error) {
        console.error('❌ Error sending invoice:', error);
        toast({
          title: "Fout bij versturen",
          description: error.message || "Er is een fout opgetreden bij het versturen van de factuur.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Invoice sent successfully:', data);
      
      toast({
        title: "Factuur verzonden!",
        description: `Factuur ${invoice.invoice_number} is succesvol verzonden naar ${invoice.customer_email}.`,
      });
      
      refetch();
    } catch (error: any) {
      console.error('❌ Error sending invoice:', error);
      toast({
        title: "Fout bij versturen",
        description: error.message || "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvoice = async (invoice: any) => {
    if (window.confirm(`Weet je zeker dat je factuur ${invoice.invoice_number} wilt verwijderen?`)) {
      try {
        await deleteInvoice(invoice.id);
        toast({
          title: "Factuur verwijderd",
          description: `Factuur ${invoice.invoice_number} is succesvol verwijderd.`,
        });
        refetch();
      } catch (error) {
        toast({
          title: "Fout bij verwijderen",
          description: "Er is een fout opgetreden bij het verwijderen van de factuur.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditInvoice = (invoice: any) => {
    navigate(`/invoices/${invoice.id}/edit`);
  };

  const handleDuplicateInvoice = async (invoice: any) => {
    try {
      const duplicated = await duplicateInvoice(invoice.id);
      toast({
        title: "Factuur gedupliceerd",
        description: `Nieuwe factuur ${duplicated.invoice_number} is aangemaakt.`,
      });
      navigate(`/invoices/${duplicated.id}/edit`);
    } catch (error) {
      toast({
        title: "Fout bij dupliceren",
        description: "Er is een fout opgetreden bij het dupliceren van de factuur.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveInvoice = async (invoice: any) => {
    if (window.confirm(`Weet je zeker dat je factuur ${invoice.invoice_number} wilt archiveren?`)) {
      try {
        await archiveInvoice(invoice.id);
        toast({
          title: "Factuur gearchiveerd",
          description: `Factuur ${invoice.invoice_number} is gearchiveerd.`,
        });
        refetch();
      } catch (error) {
        toast({
          title: "Fout bij archiveren",
          description: "Er is een fout opgetreden bij het archiveren van de factuur.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFinalizeInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowFinalizationDialog(true);
  };

  const handleSendReminder = async (invoice: any) => {
    try {
      await sendPaymentReminder(invoice);
      refetch();
    } catch (error) {
      // Error handling is done in useInvoices hook
    }
  };

  // Filter invoices based on current filters - only active invoices
  const filteredInvoices = invoices
    .filter(invoice => !invoice.is_archived)
    .filter((invoice) => {
      const matchesSearch = invoice.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           invoice.invoice_number.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === "all" || invoice.status === filters.status;
      
      // Add date filtering logic here if needed
      
      return matchesSearch && matchesStatus;
    });

  const handleCloseNewInvoice = () => {
    setShowNewInvoiceForm(false);
    onCloseNewInvoice?.();
    refetch();
  };

  if (showNewInvoiceForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {currentInvoiceType === 'simple' ? 'Nieuwe eenvoudige factuur' : 'Nieuwe gedetailleerde factuur'}
          </h1>
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-6">
          {currentInvoiceType === 'simple' ? (
            <SimpleInvoiceForm onClose={handleCloseNewInvoice} />
          ) : (
            <MultiBlockInvoiceForm onClose={handleCloseNewInvoice} />
          )}
        </div>
      </div>
    );
  }

  // Show loading state while invoices are being fetched
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Facturen laden...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeInvoices = invoices.filter(inv => !inv.is_archived);
  const archivedInvoices = invoices.filter(inv => inv.is_archived);

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* Icon Boxes Navigation */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <IconBox
            icon={<FileText className="h-6 w-6" />}
            label="Actieve Facturen"
            active={activeTab === "active"}
            onClick={() => setActiveTab("active")}
            count={activeInvoices.length}
          />
          <IconBox
            icon={<Archive className="h-6 w-6" />}
            label="Gearchiveerd"
            active={activeTab === "archived"}
            onClick={() => setActiveTab("archived")}
            count={archivedInvoices.length}
          />
        </div>

        {/* Content */}
        {activeTab === "active" && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Zoeken..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            </div>
            <InvoicesTable 
              invoices={filteredInvoices}
              onSendInvoice={handleSendInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onEditInvoice={handleEditInvoice}
              onDuplicateInvoice={handleDuplicateInvoice}
              onArchiveInvoice={handleArchiveInvoice}
              onFinalizeInvoice={handleFinalizeInvoice}
              onSendReminder={handleSendReminder}
            />
          </div>
        )}

        {activeTab === "archived" && (
          <ArchivedInvoicesView />
        )}
      </div>

      <InvoiceFinalizationDialog
        invoice={selectedInvoice}
        isOpen={showFinalizationDialog}
        onClose={() => {
          setShowFinalizationDialog(false);
          setSelectedInvoice(null);
        }}
        onFinalized={() => {
          refetch();
        }}
      />
    </div>
  );
};