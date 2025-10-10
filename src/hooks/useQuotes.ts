import { useState, useEffect, useMemo } from 'react';
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
      const startTime = performance.now();
      
      let query = supabase
        .from('quotes')
        .select(`
          *,
          invoices:invoices(id, invoice_number, payment_term_sequence, total_payment_terms, status, total_amount)
        `);
      
      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }
      
      // OPTIMIZATION: Limit to recent quotes for better performance
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(200);

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
        const fetchTime = performance.now();
        console.log(`📊 Fetched ${data.length} quotes in ${(fetchTime - startTime).toFixed(0)}ms`);
        console.log(`Processing ${data.length} quotes from database`);
        
        const quotesWithBlocks = data.map((quote, index) => {
          // Removed verbose logging for performance
          // console.log(`Processing quote ${index + 1}/${data.length}:`, quote.quote_number);
          
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
        
        const endTime = performance.now();
        console.log(`✅ Successfully processed ${quotesWithBlocks.length} quotes in ${(endTime - startTime).toFixed(0)}ms total`);
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
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      console.log('🗂️ Archiving quote:', quoteId);
      
      // ✅ FIX: Get current user ID properly via JavaScript
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      if (!currentUserId) {
        console.error('❌ No user ID available for archiving');
        toast({
          title: "Fout",
          description: "Kon gebruiker niet identificeren.",
          variant: "destructive",
        });
        return;
      }

      console.log('👤 Archiving as user:', currentUserId);

      // Soft delete: archive instead of delete
      const { error } = await supabase
        .from('quotes')
        .update({ 
          is_archived: true, 
          archived_at: new Date().toISOString(),
          archived_by: currentUserId // ✅ Use actual user ID from auth
        })
        .eq('id', quoteId);

      if (error) {
        console.error('❌ Error archiving quote:', error);
        toast({
          title: "Fout",
          description: `Kon offerte niet archiveren: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Quote archived successfully');

      toast({
        title: "Offerte gearchiveerd ✓",
        description: "De offerte is gearchiveerd en is te vinden in het tabblad 'Gearchiveerde Offertes'.",
      });

      fetchQuotes(true);
    } catch (error) {
      console.error('❌ Error archiving quote:', error);
      toast({
        title: "Fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
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
      console.log('🔄 Duplicating quote:', quoteId);
      
      // Fetch the original quote with ALL data
      const { data: originalQuote, error: fetchError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching original quote:', fetchError);
        throw fetchError;
      }

      if (!originalQuote) {
        throw new Error('Offerte niet gevonden');
      }

      console.log('✅ Original quote fetched:', {
        id: originalQuote.id,
        quote_number: originalQuote.quote_number,
        has_items: !!originalQuote.items,
        items_count: originalQuote.items ? (Array.isArray(originalQuote.items) ? originalQuote.items.length : 0) : 0
      });

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
              console.log('✅ Generated unique quote number:', newQuoteNumber);
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
        newQuoteNumber = `OFF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-DUP`;
        console.warn('⚠️ Using fallback quote number:', newQuoteNumber);
      }

      // Create duplicate quote
      const today = new Date();
      const validUntil = new Date();
      validUntil.setDate(today.getDate() + 30);

      // ✅ IMPROVED: Deep clone items to ensure no reference issues
      let duplicatedItems = null;
      if (originalQuote.items) {
        try {
          duplicatedItems = JSON.parse(JSON.stringify(originalQuote.items));
          console.log('✅ Items deep cloned successfully');
        } catch (err) {
          console.error('❌ Error cloning items:', err);
          duplicatedItems = originalQuote.items; // Fallback to shallow copy
        }
      }

      // ✅ FIX: Create object WITHOUT id field (don't use undefined)
      // Destructure to remove fields that should be auto-generated
      const { id: _id, created_at: _created, updated_at: _updated, ...quoteWithoutAutoFields } = originalQuote;
      
      const duplicateData = {
        // Copy all fields from original (except auto-generated ones)
        ...quoteWithoutAutoFields,
        // Override with new values
        quote_number: newQuoteNumber,
        quote_date: today.toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        status: 'concept',
        items: duplicatedItems, // ✅ Include cloned items
        // Reset all signature and approval data
        public_token: null,
        admin_signature_data: null,
        client_signature_data: null,
        client_name: null,
        client_signed_at: null,
        // pdf_url removed - column doesn't exist in schema
        // Let database generate id, created_at, updated_at
      };

      console.log('📝 Inserting duplicate quote:', {
        quote_number: duplicateData.quote_number,
        customer_id: duplicateData.customer_id,
        has_items: !!duplicateData.items
      });

      const { data: newQuote, error: insertError } = await supabase
        .from('quotes')
        .insert([duplicateData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error inserting duplicate:', insertError);
        throw insertError;
      }

      console.log('✅ Quote duplicated successfully:', newQuote?.id);

      toast({
        title: "✅ Offerte gedupliceerd",
        description: `Nieuwe offerte ${newQuoteNumber} is aangemaakt`,
      });

      await fetchQuotes(true);
    } catch (error: any) {
      console.error('❌ Error duplicating quote:', error);
      toast({
        title: "❌ Fout bij dupliceren",
        description: error.message || "Kon offerte niet dupliceren",
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
