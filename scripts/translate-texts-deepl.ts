/**
 * Batch Translate Texts via DeepL API
 * 
 * Reads nl-texts.json and translates all texts to target languages
 * using Supabase Edge Function (which uses DeepL).
 * 
 * Input: translations/nl-texts.json
 * Output: translations/{lang}-texts.json for each language
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supported languages
const TARGET_LANGUAGES = ['en', 'pl', 'ro', 'tr'];
const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 1000; // 1 second

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  console.error('\n💡 Make sure .env file exists with:');
  console.error('   VITE_SUPABASE_URL=your_url');
  console.error('   VITE_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TranslationData {
  [key: string]: {
    nl: string;
    key: string;
    occurrences: number;
    context?: string;
    files?: string[];
  };
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
  try {
    console.log(`   Translating batch of ${texts.length} texts to ${targetLang.toUpperCase()}...`);
    
    const { data, error } = await supabase.functions.invoke('translate-ui-texts', {
      body: {
        texts,
        targetLanguage: targetLang,
        sourceLanguage: 'nl'
      }
    });
    
    if (error) {
      console.error(`   ⚠️  Error from Edge Function:`, error);
      // Return original texts as fallback
      return texts;
    }
    
    if (!data || !data.translations) {
      console.warn(`   ⚠️  No translations returned, using originals`);
      return texts;
    }
    
    console.log(`   ✅ Batch translated successfully`);
    return data.translations;
  } catch (error: any) {
    console.error(`   ❌ Error translating batch:`, error.message);
    return texts; // Fallback to original
  }
}

async function translateToLanguage(
  data: TranslationData,
  targetLang: string
): Promise<Record<string, any>> {
  console.log(`\n🌍 Translating to ${targetLang.toUpperCase()}...`);
  
  const keys = Object.keys(data);
  const totalBatches = Math.ceil(keys.length / BATCH_SIZE);
  
  console.log(`   Total texts: ${keys.length}`);
  console.log(`   Batches: ${totalBatches}`);
  
  const translatedData: Record<string, any> = {};
  let completed = 0;
  
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batchKeys = keys.slice(i, i + BATCH_SIZE);
    const batchTexts = batchKeys.map(key => data[key].nl);
    
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\n   📦 Batch ${batchNum}/${totalBatches}`);
    
    const translations = await translateBatch(batchTexts, targetLang);
    
    // Store translated texts
    batchKeys.forEach((key, index) => {
      translatedData[key] = {
        ...data[key],
        [targetLang]: translations[index]
      };
    });
    
    completed += batchKeys.length;
    console.log(`   Progress: ${completed}/${keys.length} (${Math.round(completed / keys.length * 100)}%)`);
    
    // Rate limiting: delay between batches
    if (i + BATCH_SIZE < keys.length) {
      console.log(`   ⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
  
  console.log(`\n✅ ${targetLang.toUpperCase()} translation complete!`);
  return translatedData;
}

async function main() {
  console.log('🚀 Starting batch translation process\n');
  console.log('━'.repeat(50));
  
  // Load source texts
  const inputPath = path.join(process.cwd(), 'translations', 'nl-texts.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Source file not found: ${inputPath}`);
    console.error('   Run extract-hardcoded-texts.ts first!');
    process.exit(1);
  }
  
  console.log(`📖 Loading source texts from: ${inputPath}`);
  const sourceData: TranslationData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const totalTexts = Object.keys(sourceData).length;
  
  console.log(`📊 Found ${totalTexts} unique texts to translate`);
  console.log(`🎯 Target languages: ${TARGET_LANGUAGES.join(', ').toUpperCase()}`);
  console.log('━'.repeat(50));
  
  // Translate to each language
  for (const lang of TARGET_LANGUAGES) {
    try {
      const translatedData = await translateToLanguage(sourceData, lang);
      
      // Save to file
      const outputPath = path.join(process.cwd(), 'translations', `${lang}-texts.json`);
      fs.writeFileSync(outputPath, JSON.stringify(translatedData, null, 2), 'utf-8');
      console.log(`💾 Saved to: ${outputPath}\n`);
      
      // Brief delay between languages
      if (TARGET_LANGUAGES.indexOf(lang) < TARGET_LANGUAGES.length - 1) {
        await delay(2000);
      }
    } catch (error: any) {
      console.error(`\n❌ Failed to translate to ${lang}:`, error.message);
      console.error('   Continuing with next language...\n');
    }
  }
  
  console.log('━'.repeat(50));
  console.log('✨ Translation process complete!');
  console.log(`\n📁 Output files:`);
  TARGET_LANGUAGES.forEach(lang => {
    console.log(`   - translations/${lang}-texts.json`);
  });
  console.log('\n🎉 Ready to seed database with: npm run seed-translations');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

