import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, FileText, Receipt, Send } from "lucide-react";
import { InvoiceForm } from './InvoiceForm';
import { useToast } from '@/hooks/use-toast';
import { InvoiceDetails } from './InvoiceDetails';
import { SendInvoiceDialog } from './SendInvoiceDialog';

// Import mock data from central location
import { mockInvoices, mockCustomers, mockProjects } from '@/data/mockData';

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

  // Handler for creating a new invoice
  const handleNewInvoice = (newInvoice: any) => {
    setInvoices(prevInvoices => [...prevInvoices, newInvoice]);
    toast({
      title: "Factuur aangemaakt",
      description: `Factuur ${newInvoice.number} is aangemaakt voor project ${newInvoice.project}.`,
    });
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Facturering</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Nieuwe Factuur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1400px]">
            <DialogHeader>
              <DialogTitle>Nieuwe factuur aanmaken</DialogTitle>
              <DialogDescription>
                Vul de factuurgegevens in en bekijk direct de preview van je factuur.
              </DialogDescription>
            </DialogHeader>
            <InvoiceForm 
              onClose={() => {
                const dialogCloseButton = document.querySelector('[data-state="open"] button[data-state="closed"]');
                if (dialogCloseButton instanceof HTMLElement) {
                  dialogCloseButton.click();
                }
              }}
              customers={mockCustomers}
              projects={mockProjects}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3">
          <Input 
            placeholder="Zoek op factuurnummer, klant of project..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filterStatus === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus(null)}
          >
            Alle
          </Button>
          <Button 
            variant={filterStatus === "Concept" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("Concept")}
          >
            Concepten
          </Button>
          <Button 
            variant={filterStatus === "Verzonden" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("Verzonden")}
          >
            Verzonden
          </Button>
          <Button 
            variant={filterStatus === "Betaald" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("Betaald")}
          >
            Betaald
          </Button>
          <Button 
            variant={filterStatus === "Verlopen" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("Verlopen")}
          >
            Verlopen
          </Button>
        </div>
      </div>
      
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
              {filteredInvoices.map((invoice) => (
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
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {(invoice.status === "Concept" || invoice.status === "Verzonden" || invoice.status === "Verlopen") && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title={invoice.status === "Concept" ? "Verzenden" : "Opnieuw verzenden"}
                          onClick={() => handleSendInvoice(invoice.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredInvoices.length === 0 && (
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
      
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-muted-foreground">
          Totaal: {filteredInvoices.length} facturen
        </div>
        <div className="font-medium">
          Totaalbedrag: €{filteredInvoices
            .reduce((sum, invoice) => sum + parseFloat(invoice.amount.replace(',', '.')), 0)
            .toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </div>
      </div>

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
