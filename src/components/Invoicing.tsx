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

// Mock invoice data
export const mockInvoices = [
  { id: 1, number: "INV-2025-1001", customer: "Jan de Vries", project: "Renovatie woonkamer", date: "05-05-2025", dueDate: "19-05-2025", status: "Betaald", amount: "5,445.00" },
  { id: 2, number: "INV-2025-1002", customer: "Marie Jansen", project: "Nieuwe kozijnen achtergevel", date: "08-05-2025", dueDate: "22-05-2025", status: "Verzonden", amount: "3,388.00" },
  { id: 3, number: "INV-2025-1003", customer: "Peter Bakker", project: "Vervangen voordeur", date: "10-05-2025", dueDate: "24-05-2025", status: "Concept", amount: "1,512.50" },
  { id: 4, number: "INV-2025-1004", customer: "Sara Visser", project: "Isolatieglas installatie", date: "12-05-2025", dueDate: "26-05-2025", status: "Verzonden", amount: "4,356.00" },
  { id: 5, number: "INV-2025-1005", customer: "Thomas Mulder", project: "Kunststof kozijnen", date: "15-05-2025", dueDate: "29-05-2025", status: "Concept", amount: "6,292.00" },
];

// Mock customer data for form
export const mockCustomers = [
  { id: 1, name: "Jan de Vries" },
  { id: 2, name: "Marie Jansen" },
  { id: 3, name: "Peter Bakker" },
  { id: 4, name: "Sara Visser" },
  { id: 5, name: "Thomas Mulder" },
];

// Mock project data for form
export const mockProjects = [
  { id: 1, title: "Renovatie woonkamer", customer: "Jan de Vries", value: "4,500" },
  { id: 2, title: "Nieuwe kozijnen achtergevel", customer: "Marie Jansen", value: "2,800" },
  { id: 3, title: "Vervangen voordeur", customer: "Peter Bakker", value: "1,250" },
  { id: 4, title: "Isolatieglas installatie", customer: "Sara Visser", value: "3,600" },
  { id: 5, title: "Kunststof kozijnen", customer: "Thomas Mulder", value: "5,200" },
];

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

  // Filter invoices based on search term and status filter
  const filteredInvoices = mockInvoices.filter(invoice => {
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

  // Handler for sending invoice
  const handleSendInvoice = (invoiceId: number) => {
    toast({
      title: "Factuur verzonden",
      description: `Factuur ${mockInvoices.find(inv => inv.id === invoiceId)?.number} is verzonden naar de klant.`,
    });
  };

  // Get invoice details
  const getInvoiceDetail = (id: number) => {
    return mockInvoices.find(invoice => invoice.id === id);
  };

  // Get invoice items
  const getInvoiceItems = (id: number) => {
    return mockInvoiceItems.filter(item => item.invoiceId === id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Facturering</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Nieuwe Factuur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Nieuwe factuur aanmaken</DialogTitle>
              <DialogDescription>
                Vul de factuurgegevens in om een nieuwe factuur aan te maken.
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Bekijken">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                          <InvoiceDetails 
                            invoice={getInvoiceDetail(invoice.id)!}
                            items={getInvoiceItems(invoice.id)}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      {invoice.status === "Concept" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Verzenden"
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
    </div>
  );
}
