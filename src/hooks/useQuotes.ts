import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteBlock } from '@/types/quote';

export const useQuotes = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async (includeArchived = false) => {
    try {
      setLoading(true);
      console.log('Fetching quotes, includeArchived:', includeArchived);
      
      let query = supabase
        .from('quotes')
        .select(`
          *,
          invoices:invoices(id, invoice_number, payment_term_sequence, total_payment_terms, status, total_amount)
        `);
      
      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotes:', error);
        toast({
          title: "Fout",
          description: "Kon offertes niet laden.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log(`Processing ${data.length} quotes from database`);
        
        const quotesWithBlocks = data.map((quote, index) => {
          console.log(`Processing quote ${index + 1}/${data.length}:`, quote.quote_number);
          
          let blocks: QuoteBlock[] = [];
          
          try {
            // Parse the items efficiently
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
                blocks = parsedItems.map((item: any, blockIndex: number) => ({
                  id: item.id || `block-${quote.id}-${blockIndex}`,
                  title: item.title || 'Untitled Block',
                  type: item.type || 'product',
                  items: (item.items || []).map((blockItem: any, itemIndex: number) => ({
                    id: blockItem.id || `item-${quote.id}-${blockIndex}-${itemIndex}`,
                    type: blockItem.type || 'product',
                    description: blockItem.description || '',
                    quantity: blockItem.quantity || 0,
                    unit_price: blockItem.unit_price || 0,
                    vat_rate: blockItem.vat_rate || 21,
                    total: blockItem.total || 0,
                    formatting: blockItem.formatting
                  })),
                  subtotal: item.subtotal || 0,
                  vat_amount: item.vat_amount || 0,
                  order_index: item.order_index || blockIndex,
                  content: item.content
                }));
              } else {
                // Old flat structure - convert to single block
                blocks = [{
                  id: `legacy-block-${quote.id}`,
                  title: 'Items',
                  type: 'product',
                  items: parsedItems.map((item: any, itemIndex: number) => ({
                    id: item.id || `legacy-item-${quote.id}-${itemIndex}`,
                    type: item.type || 'product',
                    description: item.description || '',
                    quantity: item.quantity || 0,
                    unit_price: item.unit_price || 0,
                    vat_rate: item.vat_rate || 21,
                    total: item.total || 0,
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

          return {
            ...quote,
            blocks,
            items: quote.items, // Keep raw items for service compatibility
            total_vat_amount: quote.vat_amount || 0
          } as Quote;
        });
        
        console.log(`Successfully processed ${quotesWithBlocks.length} quotes`);
        setQuotes(quotesWithBlocks);
      } else {
        console.log('No quotes data received');
        setQuotes([]);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het laden van offertes.",
        variant: "destructive",
      });
      setQuotes([]);
    } finally {
      setLoading(false);
      console.log('Quotes loading completed');
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      // Soft delete: archive instead of delete
      const { error } = await supabase
        .from('quotes')
        .update({ 
          is_archived: true, 
          archived_at: new Date().toISOString(),
          archived_by: 'auth.uid()' // Will be resolved by RLS
        })
        .eq('id', quoteId);

      if (error) {
        console.error('Error archiving quote:', error);
        toast({
          title: "Fout",
          description: "Kon offerte niet archiveren.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Offerte gearchiveerd ✓",
        description: "De offerte is gearchiveerd en is te vinden in het tabblad 'Gearchiveerde Offertes'.",
      });

      fetchQuotes(true);
    } catch (error) {
      console.error('Error archiving quote:', error);
    }
  };

  const restoreQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ 
          is_archived: false, 
          archived_at: null,
          archived_by: null
        })
        .eq('id', quoteId);

      if (error) {
        console.error('Error restoring quote:', error);
        toast({
          title: "Fout",
          description: "Kon offerte niet herstellen.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Offerte hersteld ✓",
        description: "De offerte is hersteld en staat weer bij de actieve offertes.",
      });

      fetchQuotes(true);
    } catch (error) {
      console.error('Error restoring quote:', error);
    }
  };

  const permanentDeleteQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        console.error('Error permanently deleting quote:', error);
        toast({
          title: "Fout",
          description: "Kon offerte niet permanent verwijderen.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Offerte permanent verwijderd ✓",
        description: "De offerte is definitief verwijderd en kan niet meer worden hersteld.",
      });

      fetchQuotes(true);
    } catch (error) {
      console.error('Error permanently deleting quote:', error);
    }
  };

  useEffect(() => {
    fetchQuotes(true); // Include archived quotes by default
  }, []);

  const duplicateQuote = async (quoteId: string) => {
    try {
      // Fetch the original quote
      const { data: originalQuote, error: fetchError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (fetchError) throw fetchError;

      // Generate new quote number with retry logic
      let newQuoteNumber = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts && !newQuoteNumber) {
        try {
          const { data, error } = await supabase.rpc('generate_quote_number');
          if (data && !error) {
            // Verify uniqueness
            const { data: existing } = await supabase
              .from('quotes')
              .select('id')
              .eq('quote_number', data)
              .maybeSingle();
              
            if (!existing) {
              newQuoteNumber = data;
              break;
            }
          }
        } catch (error) {
          console.error(`Quote number generation attempt ${attempts + 1} failed:`, error);
        }
        attempts++;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 200 * attempts));
      }
      
      // Fallback if all attempts failed
      if (!newQuoteNumber) {
        newQuoteNumber = `OFF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      }

      // Create duplicate quote
      const today = new Date();
      const validUntil = new Date();
      validUntil.setDate(today.getDate() + 30);

      const duplicateData = {
        ...originalQuote,
        id: undefined, // Let database generate new ID
        quote_number: newQuoteNumber,
        quote_date: today.toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        status: 'concept',
        public_token: null,
        admin_signature_data: null,
        client_signature_data: null,
        client_name: null,
        client_signed_at: null,
        created_at: undefined,
        updated_at: undefined,
      };

      const { error: insertError } = await supabase
        .from('quotes')
        .insert([duplicateData]);

      if (insertError) throw insertError;

      toast({
        title: "Succes",
        description: "Offerte gedupliceerd",
      });

      await fetchQuotes(true);
    } catch (error) {
      console.error('Error duplicating quote:', error);
      toast({
        title: "Fout",
        description: "Kon offerte niet dupliceren",
        variant: "destructive",
      });
    }
  };

  return {
    quotes,
    loading,
    fetchQuotes,
    deleteQuote,
    restoreQuote,
    permanentDeleteQuote,
    duplicateQuote,
  };
};
