import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MultiBlockQuoteForm } from '@/components/quotes/MultiBlockQuoteForm';
import { supabase } from '@/integrations/supabase/client';
import { Quote } from '@/types/quote';
import { useToast } from '@/hooks/use-toast';

export default function EditQuote() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📄 EditQuote page loaded:', {
      path: window.location.pathname,
      id: id
    });
  }, []);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        navigate('/quotes');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        // Only allow editing of concept quotes
        if (data.status !== 'concept') {
          toast({
            title: "Niet bewerkbaar",
            description: "Alleen concept offertes kunnen worden bewerkt.",
            variant: "destructive",
          });
          navigate('/quotes');
          return;
        }

        // Transform database quote to Quote type
        const transformedQuote: Quote = {
          id: data.id,
          quote_number: data.quote_number,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          project_title: data.project_title,
          quote_date: data.quote_date,
          valid_until: data.valid_until,
          message: data.message,
          blocks: data.items ? (Array.isArray(data.items) ? data.items as any : []) : [],
          total_amount: data.total_amount || 0,
          total_vat_amount: data.vat_amount || 0,
          status: data.status,
          public_token: data.public_token,
          admin_signature_data: data.admin_signature_data,
          client_signature_data: data.client_signature_data,
          client_name: data.client_name,
          client_signed_at: data.client_signed_at
        };

        setQuote(transformedQuote);
      } catch (error) {
        console.error('Error fetching quote:', error);
        toast({
          title: "Fout",
          description: "Kon offerte niet laden.",
          variant: "destructive",
        });
        navigate('/quotes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id, navigate, toast]);

  const handleClose = () => {
    navigate('/quotes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Button>
          <h1 className="text-2xl font-bold">
            Offerte bewerken - {quote.quote_number}
          </h1>
        </div>
        
        <MultiBlockQuoteForm 
          onClose={handleClose} 
          existingQuote={quote}
        />
      </div>
    </div>
  );
}