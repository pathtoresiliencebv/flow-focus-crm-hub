
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Search, 
  Eye, 
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Send,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCrmStore } from "@/hooks/useCrmStore";
import { supabase } from "@/integrations/supabase/client";
import { MultiBlockQuoteForm } from './quotes/MultiBlockQuoteForm';
import { MultiBlockQuotePreview } from './quotes/MultiBlockQuotePreview';
import { Quote } from '@/types/quote';

export function Quotes() {
  const { toast } = useToast();
  const { customers, projects } = useCrmStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
        return;
      }

      if (data) {
        const quotesWithBlocks = data.map(quote => ({
          ...quote,
          blocks: Array.isArray(quote.items) ? quote.items : []
        }));
        setQuotes(quotesWithBlocks);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.project_title && quote.project_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'concept': 'bg-gray-100 text-gray-800',
      'verstuurd': 'bg-blue-100 text-blue-800',
      'geaccepteerd': 'bg-green-100 text-green-800',
      'afgewezen': 'bg-red-100 text-red-800',
      'verlopen': 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const handlePreview = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowPreview(true);
  };

  const handleDelete = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        console.error('Error deleting quote:', error);
        toast({
          title: "Fout",
          description: "Kon offerte niet verwijderen.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Offerte verwijderd",
        description: "De offerte is succesvol verwijderd.",
      });

      fetchQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const handleViewPublic = (publicToken: string) => {
    const url = `${window.location.origin}/quote/${publicToken}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Offertes</h2>
        <Dialog open={showNewQuote} onOpenChange={setShowNewQuote}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Offerte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1400px] h-[90vh]">
            <DialogHeader>
              <DialogTitle>Nieuwe offerte aanmaken</DialogTitle>
            </DialogHeader>
            <MultiBlockQuoteForm 
              onClose={() => {
                setShowNewQuote(false);
                fetchQuotes();
              }}
              customers={customers}
              projects={projects}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek offertes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offertenummer</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Geldig tot</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>€{(quote.total_amount + quote.total_vat_amount).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(quote)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {quote.public_token && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPublic(quote.public_token!)}
                          title="Bekijk publieke link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(quote.id!)}
                        title="Verwijderen"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[1200px] h-[90vh]">
          <DialogHeader>
            <DialogTitle>Offerte Preview - {selectedQuote?.quote_number}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            {selectedQuote && <MultiBlockQuotePreview quote={selectedQuote} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
