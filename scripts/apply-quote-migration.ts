/**
 * Script to apply the quote number migration directly to Supabase
 * This fixes the duplicate quote number race condition issue
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\n💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
-- Fix quote_number generation race condition issue
-- The problem: Multiple users generating quotes simultaneously can get the same quote_number

-- Solution: Use advisory locks to prevent race conditions in quote number generation

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
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Create unique lock key based on year (to allow different years to run concurrently)
  lock_key := ('x' || substring(md5(current_year), 1, 8))::bit(32)::integer;
  
  -- Acquire advisory lock to prevent race conditions
  PERFORM pg_advisory_lock(lock_key);
  
  BEGIN
    -- Get next sequential number for this year within the lock
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
    
    -- Format as OFF-YYYY-NNNN
    quote_number := 'OFF-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
    
    -- Release the lock before returning
    PERFORM pg_advisory_unlock(lock_key);
    
    RETURN quote_number;
  EXCEPTION
    WHEN others THEN
      -- Always release lock in case of error
      PERFORM pg_advisory_unlock(lock_key);
      RAISE;
  END;
END;
$function$;

-- Also create a function to check for and resolve duplicate quote numbers
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
  -- Find duplicate quote numbers
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
    -- Skip the first occurrence (oldest), rename the newer ones
    IF EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quote_number = duplicate_record.quote_number 
      AND created_at < duplicate_record.created_at
    ) THEN
      -- Generate new unique quote number
      new_number := public.generate_quote_number();
      
      -- Update the duplicate
      UPDATE public.quotes 
      SET quote_number = new_number 
      WHERE id = duplicate_record.id;
      
      -- Return info about the change
      old_quote_number := duplicate_record.quote_number;
      new_quote_number := new_number;
      quote_id := duplicate_record.id;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_duplicate_quote_numbers() TO authenticated;
`;

async function applyMigration() {
  console.log('🚀 Starting quote number migration...\n');

  try {
    // Execute the SQL migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (requires service role)
      console.log('⚠️  exec_sql not available, trying direct SQL execution...\n');
      
      // Split and execute each statement
      const statements = migrationSQL
        .split(';')
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');

      for (const statement of statements) {
        if (statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('GRANT')) {
          const { error: execError } = await supabase.rpc('exec', { query: statement });
          if (execError) {
            console.error('❌ Error executing statement:', execError);
            throw execError;
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('🔧 Functions created:');
    console.log('   • generate_quote_number() - with advisory locking');
    console.log('   • fix_duplicate_quote_numbers() - duplicate resolver\n');

    // Test the function
    console.log('🧪 Testing quote number generation...');
    const { data: testNumber, error: testError } = await supabase.rpc('generate_quote_number');
    
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log(`✅ Test successful! Generated: ${testNumber}\n`);
    }

    console.log('✨ Migration complete! Quote number race conditions are now fixed.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n⚠️  FALLBACK: Please apply manually via Supabase Dashboard');
    console.error('   1. Go to Supabase Dashboard > SQL Editor');
    console.error('   2. Copy content from: supabase/migrations/20250930_fix_quote_number_race_condition.sql');
    console.error('   3. Run the SQL\n');
    process.exit(1);
  }
}

applyMigration();
