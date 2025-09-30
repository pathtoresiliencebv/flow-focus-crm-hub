import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Starting quote number migration...');

    // Step 1: Create the improved generate_quote_number function with advisory locking
    const generateQuoteNumberSQL = `
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  quote_number TEXT;
  lock_key INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  lock_key := ('x' || substring(md5(current_year), 1, 8))::bit(32)::integer;
  
  PERFORM pg_advisory_lock(lock_key);
  
  BEGIN
    SELECT COALESCE(MAX(
      CASE 
        WHEN quote_number ~ ('^OFF-' || current_year || '-[0-9]+$')
        THEN CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_number
    FROM public.quotes
    WHERE quote_number LIKE ('OFF-' || current_year || '-%');
    
    quote_number := 'OFF-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
    PERFORM pg_advisory_unlock(lock_key);
    RETURN quote_number;
  EXCEPTION
    WHEN others THEN
      PERFORM pg_advisory_unlock(lock_key);
      RAISE;
  END;
END;
$function$;`;

    const { error: error1 } = await supabaseClient.rpc('exec', { 
      sql: generateQuoteNumberSQL 
    });

    if (error1) {
      console.error('Error creating generate_quote_number:', error1);
      throw error1;
    }

    console.log('✅ generate_quote_number function created');

    // Step 2: Create the fix_duplicate_quote_numbers function
    const fixDuplicatesSQL = `
CREATE OR REPLACE FUNCTION public.fix_duplicate_quote_numbers()
RETURNS TABLE(old_quote_number text, new_quote_number text, quote_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  duplicate_record RECORD;
  new_number TEXT;
BEGIN
  FOR duplicate_record IN
    SELECT q1.id, q1.quote_number, q1.created_at
    FROM public.quotes q1
    WHERE EXISTS (
      SELECT 1 FROM public.quotes q2 
      WHERE q2.quote_number = q1.quote_number 
      AND q2.id != q1.id
    )
    ORDER BY q1.created_at ASC
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quote_number = duplicate_record.quote_number 
      AND created_at < duplicate_record.created_at
    ) THEN
      new_number := public.generate_quote_number();
      
      UPDATE public.quotes 
      SET quote_number = new_number 
      WHERE id = duplicate_record.id;
      
      old_quote_number := duplicate_record.quote_number;
      new_quote_number := new_number;
      quote_id := duplicate_record.id;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;`;

    const { error: error2 } = await supabaseClient.rpc('exec', { 
      sql: fixDuplicatesSQL 
    });

    if (error2) {
      console.error('Error creating fix_duplicate_quote_numbers:', error2);
      throw error2;
    }

    console.log('✅ fix_duplicate_quote_numbers function created');

    // Step 3: Grant permissions
    const grantSQL = `
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_duplicate_quote_numbers() TO authenticated;`;

    const { error: error3 } = await supabaseClient.rpc('exec', { 
      sql: grantSQL 
    });

    if (error3) {
      console.error('Error granting permissions:', error3);
      throw error3;
    }

    console.log('✅ Permissions granted');

    // Step 4: Test the new function
    const { data: testNumber, error: testError } = await supabaseClient.rpc('generate_quote_number');
    
    if (testError) {
      console.error('Test failed:', testError);
    } else {
      console.log('✅ Test successful! Generated:', testNumber);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration applied successfully',
        testQuoteNumber: testNumber,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Migration failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Please apply migration manually via Supabase Dashboard SQL Editor'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
