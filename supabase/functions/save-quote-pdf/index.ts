import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveQuotePdfRequest {
  quoteId: string;
  quoteNumber?: string;
}

// Simple HTML to PDF conversion using a web service
// For server-side PDF generation, we use a service like html2pdf.net API
const htmlToPdfBuffer = async (htmlContent: string): Promise<Uint8Array> => {
  try {
    // Use a public HTML to PDF API
    const response = await fetch('https://html2pdf.app/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        options: {
          margin: 10,
          filename: 'quote.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          enableLinks: true,
          pagebreak: { mode: 'css' }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`PDF API error: ${response.status}`);
    }

    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, quoteNumber }: SaveQuotePdfRequest = await req.json();

    if (!quoteId) {
      return new Response(
        JSON.stringify({ error: 'Quote ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📄 Saving PDF for quote:', quoteId);

    // 1. Generate PDF HTML content
    const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-quote-pdf', {
      body: { quoteId }
    });

    if (pdfError || !pdfData?.htmlContent) {
      console.error('Error generating PDF HTML:', pdfError);
      throw new Error('Failed to generate PDF HTML');
    }

    console.log('✅ PDF HTML generated, converting to PDF buffer...');

    // 2. Convert HTML to PDF buffer
    const pdfBuffer = await htmlToPdfBuffer(pdfData.htmlContent);
    console.log('✅ PDF buffer created, size:', pdfBuffer.length, 'bytes');

    // 3. Upload to Supabase Storage
    const pdfFilename = `${quoteNumber || 'quote'}-${quoteId}.pdf`;
    const pdfPath = `quotes/${pdfFilename}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('completed-quotes')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF to storage:', uploadError);
      throw uploadError;
    }

    console.log('✅ PDF uploaded to storage:', pdfPath);

    // 4. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('completed-quotes')
      .getPublicUrl(pdfPath);

    // 5. Update quote with PDF URL
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ 
        pdf_url: publicUrl
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating quote with PDF URL:', updateError);
      // Don't throw - storage succeeded even if DB update fails
    } else {
      console.log('✅ Quote updated with PDF URL:', publicUrl);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        pdfUrl: publicUrl,
        message: 'Quote PDF saved successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in save-quote-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to save quote PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);

