import { supabase } from '@/integrations/supabase/client';

export async function applyQuoteMigration() {
  try {
    console.log('🚀 Applying quote number migration...');

    // Call the Edge Function to apply the migration
    const { data, error } = await supabase.functions.invoke('apply-quote-migration');

    if (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackInstructions: `
HANDMATIGE INSTRUCTIES:
1. Ga naar Supabase Dashboard: https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar SQL Editor
4. Kopieer de SQL uit: supabase/migrations/20250930_fix_quote_number_race_condition.sql
5. Voer de SQL uit
        `
      };
    }

    console.log('✅ Migration applied successfully:', data);
    return {
      success: true,
      message: data.message,
      testQuoteNumber: data.testQuoteNumber
    };

  } catch (error: any) {
    console.error('❌ Error applying migration:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
