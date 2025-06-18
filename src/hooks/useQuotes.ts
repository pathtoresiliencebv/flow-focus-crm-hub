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
            // Parse the items from Json to actual objects
            let parsedItems: any[] = [];
            if (quote.items) {
              if (typeof quote.items === 'string') {
                parsedItems = JSON.parse(quote.items);
              } else if (Array.isArray(quote.items)) {
                parsedItems = quote.items as any[];
              }
            }

            if (parsedItems.length > 0) {
              // Check if items contain blocks structure
              if (parsedItems[0] && typeof parsedItems[0] === 'object' && parsedItems[0].items) {
                // New blocks structure
                blocks = parsedItems.map((item: any) => ({
                  id: item.id || crypto.randomUUID(),
                  title: item.title || 'Untitled Block',
                  items: (item.items || []).map((blockItem: any) => ({
                    id: blockItem.id || crypto.randomUUID(),
                    type: blockItem.type || 'product',
                    description: blockItem.description || '',
                    quantity: blockItem.quantity,
                    unit_price: blockItem.unit_price,
                    vat_rate: blockItem.vat_rate || 21,
                    total: blockItem.total,
                    formatting: blockItem.formatting
                  })),
                  subtotal: item.subtotal || 0,
                  vat_amount: item.vat_amount || 0,
                  order_index: item.order_index || 0
                }));
              } else {
                // Old flat structure - convert to single block
                blocks = [{
                  id: crypto.randomUUID(),
                  title: 'Items',
                  items: parsedItems.map((item: any) => ({
                    id: item.id || crypto.randomUUID(),
                    type: item.type || 'product',
                    description: item.description || '',
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    vat_rate: item.vat_rate || 21,
                    total: item.total,
                    formatting: item.formatting
                  })),
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
            items: quote.items, // Keep raw items for service compatibility
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
