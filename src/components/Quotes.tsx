
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
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
import { Eye, FileText, Edit, Link, Check, X } from "lucide-react";
import { QuoteForm } from './QuoteForm';
import { useToast } from '@/hooks/use-toast';

// Mock data voor offertes
const mockQuotes = [
  {
    id: 1,
    number: "OFF-2024-001",
    customer: "Jan de Vries",
    project: "Kozijnen vervangen",
    date: "2024-01-10",
    validUntil: "2024-02-09",
    status: "Verzonden",
    amount: "4,500.00",
    publicLink: "https://smans.nl/quote/abc123",
    approved: false,
    signedAt: null
  },
  {
    id: 2,
    number: "OFF-2024-002",
    customer: "Marie Jansen",
    project: "Nieuwe ramen installeren",
    date: "2024-01-12",
    validUntil: "2024-02-11",
    status: "Goedgekeurd",
    amount: "7,500.00",
    publicLink: "https://smans.nl/quote/def456",
    approved: true,
    signedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: 3,
    number: "OFF-2024-003",
    customer: "Peter van Dam",
    project: "Voordeur plaatsen",
    date: "2024-01-15",
    validUntil: "2024-02-14",
    status: "Concept",
    amount: "1,512.50",
    publicLink: null,
    approved: false,
    signedAt: null
  }
];

// Mock data van centraal punt
import { mockCustomers, mockProjects } from '@/data/mockData';

export function Quotes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [quotes, setQuotes] = useState([...mockQuotes]);

  // Filter quotes based on search term and status filter
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.project.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === null || quote.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Goedgekeurd":
        return "bg-green-100 text-green-800";
      case "Verzonden":
        return "bg-blue-100 text-blue-800";
      case "Concept":
        return "bg-gray-100 text-gray-800";
      case "Verlopen":
        return "bg-red-100 text-red-800";
      case "Afgewezen":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handler for creating a new quote
  const handleNewQuote = (newQuote: any) => {
    setQuotes(prevQuotes => [...prevQuotes, newQuote]);
    toast({
      title: "Offerte aangemaakt",
      description: `Offerte ${newQuote.number} is aangemaakt voor project ${newQuote.project}.`,
    });
  };

  // Handler for sending quote
  const handleSendQuote = (quoteId: number) => {
    const updatedQuotes = quotes.map(quote => 
      quote.id === quoteId 
        ? { 
            ...quote, 
            status: "Verzonden",
            publicLink: `https://smans.nl/quote/${Math.random().toString(36).substr(2, 9)}`
          } 
        : quote
    );
    
    setQuotes(updatedQuotes);
    
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      toast({
        title: "Offerte verzonden",
        description: `Offerte ${quote.number} is verzonden naar de klant voor project "${quote.project}".`,
      });
    }
  };

  // Copy public link to clipboard
  const copyPublicLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link gekopieerd",
      description: "De openbare link is gekopieerd naar je klembord.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Offertes</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Nieuwe Offerte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1400px]">
            <DialogHeader>
              <DialogTitle>Nieuwe offerte aanmaken</DialogTitle>
              <DialogDescription>
                Vul de offertegegevens in en bekijk direct de preview van je offerte.
              </DialogDescription>
            </DialogHeader>
            <QuoteForm 
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
            placeholder="Zoek op offertenummer, klant of project..." 
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
            variant={filterStatus === "Goedgekeurd" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("Goedgekeurd")}
          >
            Goedgekeurd
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
                <TableHead>Offertenr.</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Geldig tot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.number}</TableCell>
                  <TableCell>{quote.customer}</TableCell>
                  <TableCell>{quote.project}</TableCell>
                  <TableCell>{quote.date}</TableCell>
                  <TableCell>{quote.validUntil}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(quote.status)}`}>
                      {quote.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">€{quote.amount}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Bekijken"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {quote.status === "Concept" && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Bewerken"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Verzenden"
                            onClick={() => handleSendQuote(quote.id)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {quote.status === "Verzonden" && !quote.approved && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Bewerken (nog niet goedgekeurd)"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {quote.publicLink && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Openbare link kopiëren"
                          onClick={() => copyPublicLink(quote.publicLink!)}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      )}

                      {quote.approved && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Goedgekeurd"
                          disabled
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredQuotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Geen offertes gevonden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-muted-foreground">
          Totaal: {filteredQuotes.length} offertes
        </div>
        <div className="font-medium">
          Totaalbedrag: €{filteredQuotes
            .reduce((sum, quote) => sum + parseFloat(quote.amount.replace(',', '.')), 0)
            .toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </div>
      </div>
    </div>
  );
}
