/**
 * Seed UI Translations to Database
 * 
 * Loads all translation JSON files and inserts them into ui_translations table.
 * Handles upserts and conflict resolution.
 * 
 * Input: translations/{lang}-texts.json for all languages
 * Output: Populates ui_translations table in Supabase
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const LANGUAGES = ['nl', 'en', 'pl', 'ro', 'tr'];
const BATCH_SIZE = 100; // Insert in batches for performance

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service key for bulk operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\n💡 Make sure .env file has:');
  console.error('   VITE_SUPABASE_URL=your_url');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('\n⚠️  Service role key is required for bulk database inserts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TranslationEntry {
  translation_key: string;
  language_code: string;
  translated_text: string;
  context?: string;
}

async function loadTranslationFile(lang: string): Promise<Map<string, any>> {
  const filePath = path.join(process.cwd(), 'translations', `${lang}-texts.json`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return new Map();
  }
  
  console.log(`📖 Loading ${lang.toUpperCase()} translations from: ${filePath}`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return new Map(Object.entries(data));
}

async function seedLanguage(lang: string, translationsMap: Map<string, any>): Promise<number> {
  console.log(`\n🌍 Seeding ${lang.toUpperCase()} translations...`);
  
  if (translationsMap.size === 0) {
    console.log(`   ⚠️  No translations to seed for ${lang.toUpperCase()}`);
    return 0;
  }
  
  const entries: TranslationEntry[] = [];
  
  // Prepare entries for database
  for (const [key, data] of translationsMap.entries()) {
    if (!data[lang]) {
      console.warn(`   ⚠️  Missing ${lang} translation for key: ${key}`);
      continue;
    }
    
    entries.push({
      translation_key: key,
      language_code: lang,
      translated_text: data[lang],
      context: data.context || null
    });
  }
  
  console.log(`   📊 Preparing ${entries.length} translations`);
  
  // Insert in batches
  let inserted = 0;
  const totalBatches = Math.ceil(entries.length / BATCH_SIZE);
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    console.log(`   📦 Batch ${batchNum}/${totalBatches} (${batch.length} items)`);
    
    try {
      const { error, count } = await supabase
        .from('ui_translations')
        .upsert(batch, {
          onConflict: 'translation_key,language_code',
          count: 'exact'
        });
      
      if (error) {
        console.error(`   ❌ Error inserting batch ${batchNum}:`, error.message);
        continue;
      }
      
      inserted += batch.length;
      console.log(`   ✅ Batch ${batchNum} inserted (Total: ${inserted}/${entries.length})`);
    } catch (error: any) {
      console.error(`   ❌ Exception in batch ${batchNum}:`, error.message);
    }
  }
  
  console.log(`\n✅ ${lang.toUpperCase()}: ${inserted}/${entries.length} translations seeded`);
  return inserted;
}

async function main() {
  console.log('🚀 Starting database seeding process\n');
  console.log('━'.repeat(60));
  
  // Load all translation files
  console.log('📚 Loading translation files...\n');
  const translationsByLang = new Map<string, Map<string, any>>();
  
  for (const lang of LANGUAGES) {
    const translations = await loadTranslationFile(lang);
    translationsByLang.set(lang, translations);
  }
  
  console.log('\n━'.repeat(60));
  
  // Seed each language
  const results: Record<string, number> = {};
  
  for (const lang of LANGUAGES) {
    const translations = translationsByLang.get(lang);
    if (translations) {
      results[lang] = await seedLanguage(lang, translations);
    }
  }
  
  console.log('\n━'.repeat(60));
  console.log('✨ Seeding complete!\n');
  console.log('📊 Summary:');
  
  let grandTotal = 0;
  for (const [lang, count] of Object.entries(results)) {
    console.log(`   ${lang.toUpperCase()}: ${count} translations`);
    grandTotal += count;
  }
  
  console.log(`\n   Total: ${grandTotal} translations across ${LANGUAGES.length} languages`);
  console.log('\n🎉 Database is ready for multilingual support!');
  console.log('\n💡 Next steps:');
  console.log('   1. Update components to use useI18n() hook');
  console.log('   2. Replace hardcoded text with t() function calls');
  console.log('   3. Test language switching in the app');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

