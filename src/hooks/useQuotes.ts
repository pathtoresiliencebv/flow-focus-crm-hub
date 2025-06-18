
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteBlock } from '@/types/quote';

export const useQuotes = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.log('Raw quotes data from database:', data);
        
        const quotesWithBlocks = data.map(quote => {
          let blocks: QuoteBlock[] = [];
          console.log('Processing quote:', quote.id, 'items:', quote.items);
          
          try {
            if (Array.isArray(quote.items)) {
              // Check if items contain blocks structure
              if (quote.items.length > 0 && quote.items[0].items) {
                // New blocks structure
                blocks = quote.items.map((item: any) => ({
                  id: item.id || crypto.randomUUID(),
                  title: item.title || 'Untitled Block',
                  items: item.items || [],
                  subtotal: item.subtotal || 0,
                  vat_amount: item.vat_amount || 0,
                  order_index: item.order_index || 0
                }));
              } else {
                // Old flat structure - convert to single block
                blocks = [{
                  id: crypto.randomUUID(),
                  title: 'Items',
                  items: quote.items,
                  subtotal: quote.subtotal || 0,
                  vat_amount: quote.vat_amount || 0,
                  order_index: 0
                }];
              }
            }
          } catch (e) {
            console.error('Error parsing quote blocks for quote', quote.id, ':', e);
            blocks = [];
          }

          const processedQuote = {
            ...quote,
            blocks,
            total_vat_amount: quote.vat_amount || 0
          } as Quote;
          
          console.log('Processed quote:', processedQuote.id, 'with blocks:', processedQuote.blocks);
          return processedQuote;
        });
        
        setQuotes(quotesWithBlocks);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuote = async (quoteId: string) => {
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

  useEffect(() => {
    fetchQuotes();
  }, []);

  return {
    quotes,
    loading,
    fetchQuotes,
    deleteQuote
  };
};
