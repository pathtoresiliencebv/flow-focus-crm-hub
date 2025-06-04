
import { useState, useEffect } from 'react';
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
import { Eye, FileText, Edit, Link, Check, X, Send } from "lucide-react";
import { QuoteForm } from './QuoteForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Mock data van centraal punt
import { mockCustomers, mockProjects } from '@/data/mockData';

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  project_title: string;
  quote_date: string;
  valid_until: string;
  status: string;
  total_amount: number;
  public_token: string;
  client_signature_data: string;
  client_signed_at: string;
}

export function Quotes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotes:', error);
        toast({
          title: "Fout",
          description: "Kon offertes niet laden.",
          variant: "destructive",
        });
        return;
      }

      setQuotes(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter quotes based on search term and status filter
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.project_title && quote.project_title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === null || quote.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Goedgekeurd</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Verzonden</Badge>;
      case "concept":
        return <Badge className="bg-gray-100 text-gray-800">Concept</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Verlopen</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Afgewezen</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Handler for sending quote
  const handleSendQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId);

      if (error) {
        console.error('Error sending quote:', error);
        toast({
          title: "Fout",
          description: "Kon offerte niet verzenden.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Offerte verzonden",
        description: "De offerte is succesvol verzonden naar de klant.",
      });

      // Refresh quotes
      fetchQuotes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Copy public link to clipboard
  const copyPublicLink = (token: string) => {
    const link = `${window.location.origin}/quote/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link gekopieerd",
      description: "De openbare link is gekopieerd naar je klembord.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Offertes</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-smans-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

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
                fetchQuotes(); // Refresh quotes after creating new one
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
            variant={filterStatus === "concept" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("concept")}
          >
            Concepten
          </Button>
          <Button 
            variant={filterStatus === "sent" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("sent")}
          >
            Verzonden
          </Button>
          <Button 
            variant={filterStatus === "approved" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("approved")}
          >
            Goedgekeurd
          </Button>
          <Button 
            variant={filterStatus === "expired" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterStatus("expired")}
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
                  <TableCell className="font-medium">{quote.quote_number}</TableCell>
                  <TableCell>{quote.customer_name}</TableCell>
                  <TableCell>{quote.project_title || '-'}</TableCell>
                  <TableCell>{new Date(quote.quote_date).toLocaleDateString('nl-NL')}</TableCell>
                  <TableCell>{new Date(quote.valid_until).toLocaleDateString('nl-NL')}</TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell className="text-right">€{quote.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {quote.public_token && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Bekijk openbare versie"
                          onClick={() => window.open(`/quote/${quote.public_token}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {quote.status === "concept" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Verzenden naar klant"
                          onClick={() => handleSendQuote(quote.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}

                      {quote.public_token && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Openbare link kopiëren"
                          onClick={() => copyPublicLink(quote.public_token)}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      )}

                      {quote.client_signed_at && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Goedgekeurd door klant"
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
                    {quotes.length === 0 ? "Nog geen offertes aangemaakt" : "Geen offertes gevonden"}
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
            .reduce((sum, quote) => sum + quote.total_amount, 0)
            .toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </div>
      </div>
    </div>
  );
}
