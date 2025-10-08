/**
 * UI Text Extraction and Automatic Translation Script
 * 
 * This script:
 * 1. Scans all React components for Dutch text
 * 2. Extracts unique text strings
 * 3. Translates them to all supported languages via DeepL
 * 4. Stores translations in the database
 * 
 * Run with: npx tsx scripts/extract-and-translate-ui.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supported languages (excluding Dutch which is source)
const TARGET_LANGUAGES = ['en', 'pl', 'ro', 'tr'];

interface TextMatch {
  text: string;
  file: string;
  line: number;
}

/**
 * Extract Dutch text from React components
 */
function extractTextFromFile(filePath: string): TextMatch[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches: TextMatch[] = [];

  // Patterns to match Dutch text in common React patterns
  const patterns = [
    // JSX text content: <div>Tekst</div>
    />([\p{L}\s,.\-!?()]+)</gu,
    // String literals in attributes: title="Tekst"
    /(?:title|placeholder|label|description|aria-label)=["']([\p{L}\s,.\-!?()]+)["']/gu,
    // Object properties: { label: "Tekst" }
    /(?:label|title|description|placeholder|name):\s*["']([\p{L}\s,.\-!?()]+)["']/gu,
    // Toast messages: toast({ title: "Tekst" })
    /toast\([^)]*["']([\p{L}\s,.\-!?()]+)["']/gu,
  ];

  lines.forEach((line, lineIndex) => {
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern);
      let match;
      while ((match = regex.exec(line)) !== null) {
        const text = match[1]?.trim();
        
        // Filter out:
        // - Too short (< 3 chars)
        // - Numbers only
        // - Variables (contains {})
        // - Already in English (simple heuristic)
        if (
          text &&
          text.length >= 3 &&
          !/^\d+$/.test(text) &&
          !text.includes('{') &&
          !text.includes('}') &&
          !/^[A-Z_]+$/.test(text) && // Not constants
          containsDutchCharacteristics(text)
        ) {
          matches.push({
            text,
            file: filePath,
            line: lineIndex + 1
          });
        }
      }
    });
  });

  return matches;
}

/**
 * Simple heuristic to check if text is likely Dutch
 */
function containsDutchCharacteristics(text: string): boolean {
  // Common Dutch words/patterns
  const dutchIndicators = [
    /\b(de|het|een|van|op|in|is|zijn|voor|met|aan|te|bij|naar|als|dat|dit|deze|die|wat|wie|waar|wanneer|hoe|niet|geen)\b/i,
    /\b(klant|project|gebruiker|instellingen|beheer|toevoegen|verwijderen|bewerken|opslaan|annuleren)\b/i,
    /ij|oe|ui|aa|ee|oo|uu/i, // Dutch digraphs
  ];

  return dutchIndicators.some(pattern => pattern.test(text));
}

/**
 * Recursively scan directory for React files
 */
function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, etc.
      if (!['node_modules', 'dist', 'build', '.git', 'android', 'ios'].includes(file)) {
        scanDirectory(filePath, fileList);
      }
    } else if (file.match(/\.(tsx|ts|jsx|js)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Translate texts via Supabase Edge Function
 */
async function translateTexts(texts: string[], targetLang: string): Promise<string[]> {
  console.log(`📝 Translating ${texts.length} texts to ${targetLang.toUpperCase()}...`);

  try {
    const { data, error } = await supabase.functions.invoke('translate-ui-texts', {
      body: {
        texts,
        targetLanguage: targetLang,
        sourceLanguage: 'nl'
      }
    });

    if (error) {
      console.error(`❌ Translation error for ${targetLang}:`, error);
      return texts; // Return original on error
    }

    if (data?.translations) {
      console.log(`✅ Translated ${data.translations.length} texts to ${targetLang.toUpperCase()}`);
      return data.translations;
    }

    return texts;
  } catch (error) {
    console.error(`❌ Exception during translation to ${targetLang}:`, error);
    return texts;
  }
}

/**
 * Save translations to database
 */
async function saveTranslations(texts: string[], translations: string[], language: string) {
  const records = texts.map((text, index) => ({
    translation_key: text,
    language_code: language,
    translated_text: translations[index] || text,
    context: 'auto_extracted',
    updated_at: new Date().toISOString()
  }));

  // Batch insert (Supabase handles upserts)
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('ui_translations')
      .upsert(batch, {
        onConflict: 'translation_key,language_code'
      });

    if (error) {
      console.error(`❌ Error saving batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`💾 Saved batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting UI text extraction and translation...\n');

  // 1. Scan all React files
  console.log('📂 Scanning React components...');
  const srcDir = path.join(process.cwd(), 'src');
  const files = scanDirectory(srcDir);
  console.log(`✅ Found ${files.length} files\n`);

  // 2. Extract Dutch text
  console.log('🔍 Extracting Dutch text...');
  const allMatches: TextMatch[] = [];
  files.forEach(file => {
    const matches = extractTextFromFile(file);
    allMatches.push(...matches);
  });

  // Get unique texts
  const uniqueTexts = Array.from(new Set(allMatches.map(m => m.text)));
  console.log(`✅ Extracted ${allMatches.length} text instances`);
  console.log(`✅ Found ${uniqueTexts.length} unique texts\n`);

  // 3. Save Dutch originals
  console.log('💾 Saving Dutch originals...');
  await saveTranslations(uniqueTexts, uniqueTexts, 'nl');

  // 4. Translate to all target languages
  for (const lang of TARGET_LANGUAGES) {
    console.log(`\n🌍 Processing ${lang.toUpperCase()}...`);
    
    // Translate in batches of 50 (DeepL limit)
    const batchSize = 50;
    const allTranslations: string[] = [];

    for (let i = 0; i < uniqueTexts.length; i += batchSize) {
      const batch = uniqueTexts.slice(i, i + batchSize);
      console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uniqueTexts.length / batchSize)}`);
      
      const translations = await translateTexts(batch, lang);
      allTranslations.push(...translations);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save translations
    await saveTranslations(uniqueTexts, allTranslations, lang);
    console.log(`✅ ${lang.toUpperCase()} complete!`);
  }

  console.log('\n🎉 Translation complete!');
  console.log(`📊 Total: ${uniqueTexts.length} texts in ${TARGET_LANGUAGES.length + 1} languages`);
  console.log(`💾 Saved ${uniqueTexts.length * (TARGET_LANGUAGES.length + 1)} translation records`);
}

// Run the script
main().catch(console.error);

