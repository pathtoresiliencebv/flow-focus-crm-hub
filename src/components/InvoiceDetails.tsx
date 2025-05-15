
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from "@/components/ui/table";
import { Receipt, Send } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

interface InvoiceItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  price: string;
  total: string;
}

interface Invoice {
  id: number;
  number: string;
  customer: string;
  project: string;
  date: string;
  dueDate: string;
  status: string;
  amount: string;
}

interface InvoiceDetailsProps {
  invoice: Invoice;
  items: InvoiceItem[];
  onSend?: (invoiceId: number) => void;
  onClose?: () => void;
}

export function InvoiceDetails({ invoice, items, onSend, onClose }: InvoiceDetailsProps) {
  const { toast } = useToast();
  
  // Calculate subtotal from items
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total.replace(',', '.'));
      return sum + itemTotal;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const vat = subtotal * 0.21;
  const total = subtotal + vat;

  const handleSendInvoice = () => {
    if (onSend) {
      onSend(invoice.id);
    } else {
      toast({
        title: "Factuur verzonden",
        description: `Factuur ${invoice.number} is verzonden naar ${invoice.customer}.`,
      });
    }
    
    if (onClose) {
      onClose();
    }
  };

  const canSendInvoice = invoice.status === "Concept";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">Factuur {invoice.number}</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          <h3 className="font-medium text-gray-600 mb-1">Factuurgegeven</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Factuurnummer:</span>
              <span className="font-medium">{invoice.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Datum:</span>
              <span>{invoice.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vervaldatum:</span>
              <span>{invoice.dueDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                ${invoice.status === "Betaald" ? "bg-green-100 text-green-800" : 
                  invoice.status === "Verzonden" ? "bg-blue-100 text-blue-800" :
                  invoice.status === "Verlopen" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-600 mb-1">Klant & Project</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Klant:</span>
              <span className="font-medium">{invoice.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Project:</span>
              <span>{invoice.project}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium mb-3">Factuurregels</h3>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Omschrijving</TableHead>
                <TableHead>Aantal</TableHead>
                <TableHead>Prijs</TableHead>
                <TableHead className="text-right">Totaal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>€{item.price}</TableCell>
                  <TableCell className="text-right">€{item.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotaal:</span>
            <span>€{subtotal.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>BTW (21%):</span>
            <span>€{vat.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between font-medium border-t pt-2">
            <span>Totaal:</span>
            <span>€{total.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        {canSendInvoice && (
          <Button onClick={handleSendInvoice} className="bg-blue-500 hover:bg-blue-600">
            <Send className="mr-2 h-4 w-4" />
            Verzenden
          </Button>
        )}
        <Button>
          <Receipt className="mr-2 h-4 w-4" />
          Downloaden
        </Button>
      </div>
    </>
  );
}
