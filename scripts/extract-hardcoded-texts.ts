/**
 * Extract Hardcoded Dutch Texts from Codebase
 * 
 * This script scans all .tsx and .ts files in src/ directory
 * and extracts Dutch string literals for translation.
 * 
 * Output: translations/nl-texts.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ExtractedText {
  text: string;
  occurrences: Array<{
    file: string;
    line: number;
  }>;
  context?: string;
}

// Dutch language patterns for detection
const DUTCH_INDICATORS = [
  'de ', 'het ', 'een ', 'van ', 'is ', 'op ', 'aan ', 'bij ', 'met ', 'voor ',
  'niet ', 'dat ', 'zijn ', 'er ', 'maar ', 'worden ', 'kan ', 'heeft ', 'wordt ',
  'nieuwe ', 'alle ', 'deze ', 'geen ', 'moet ', 'naar ', 'uit ', 'tussen ',
  'klant', 'project', 'offerte', 'factuur', 'planning', 'monteur', 'gebruiker'
];

// Patterns to exclude (not user-facing text)
const EXCLUDE_PATTERNS = [
  /^[a-zA-Z_][a-zA-Z0-9_]*$/, // Variable names
  /^[A-Z_]+$/, // Constants
  /^\d+$/, // Numbers only
  /^[.\/\\]+$/, // Paths
  /^https?:\/\//, // URLs
  /^[a-z]+\.[a-z]+/, // File extensions or property access
  /console\./,  // Console logs
  /^(error|success|warning|info)$/i, // Log levels
];

function isDutch(text: string): boolean {
  if (text.length < 3) return false;
  
  const lowerText = ' ' + text.toLowerCase() + ' ';
  return DUTCH_INDICATORS.some(indicator => lowerText.includes(indicator));
}

function shouldExclude(text: string): boolean {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(text));
}

function extractStringsFromFile(filePath: string): Array<{ text: string; line: number }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const extracted: Array<{ text: string; line: number }> = [];
  
  lines.forEach((line, lineIndex) => {
    // Match string literals in various contexts
    const patterns = [
      // Double quotes
      /"([^"\\]*(\\.[^"\\]*)*)"/g,
      // Single quotes
      /'([^'\\]*(\\.[^'\\]*)*)'/g,
      // Template literals (simple ones without ${})
      /`([^`$\\]*(\\.[^`$\\]*)*)`/g,
      // JSX text content (between > and <)
      />([^<>{]+)</g,
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const text = match[1].trim();
        
        // Skip empty, very short, or excluded texts
        if (text.length < 3 || shouldExclude(text)) continue;
        
        // Check if it's likely Dutch
        if (isDutch(text) || /[a-zA-Z]/.test(text)) {
          extracted.push({
            text,
            line: lineIndex + 1
          });
        }
      }
    });
  });
  
  return extracted;
}

async function extractAllTexts() {
  console.log('🔍 Scanning codebase for Dutch texts...\n');
  
  const srcPath = path.join(process.cwd(), 'src');
  const files = await glob('**/*.{ts,tsx}', {
    cwd: srcPath,
    ignore: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/node_modules/**']
  });
  
  console.log(`📁 Found ${files.length} files to scan\n`);
  
  const textsMap = new Map<string, ExtractedText>();
  let fileCount = 0;
  
  for (const file of files) {
    const filePath = path.join(srcPath, file);
    const extracted = extractStringsFromFile(filePath);
    
    extracted.forEach(({ text, line }) => {
      if (textsMap.has(text)) {
        textsMap.get(text)!.occurrences.push({ file, line });
      } else {
        textsMap.set(text, {
          text,
          occurrences: [{ file, line }],
          context: path.dirname(file).split(path.sep)[0] // First directory as context
        });
      }
    });
    
    fileCount++;
    if (fileCount % 50 === 0) {
      console.log(`   Processed ${fileCount}/${files.length} files...`);
    }
  }
  
  console.log(`\n✅ Processed all ${files.length} files`);
  console.log(`📊 Found ${textsMap.size} unique texts\n`);
  
  // Sort by frequency (most occurrences first)
  const sortedTexts = Array.from(textsMap.values())
    .sort((a, b) => b.occurrences.length - a.occurrences.length);
  
  // Generate translation keys
  const translationData: Record<string, any> = {};
  sortedTexts.forEach((item) => {
    const key = generateKey(item.text);
    translationData[key] = {
      nl: item.text,
      key,
      occurrences: item.occurrences.length,
      context: item.context,
      files: item.occurrences.slice(0, 3).map(o => `${o.file}:${o.line}`) // First 3 occurrences
    };
  });
  
  // Save to file
  const outputPath = path.join(process.cwd(), 'translations', 'nl-texts.json');
  fs.writeFileSync(outputPath, JSON.stringify(translationData, null, 2), 'utf-8');
  
  console.log(`💾 Saved to: ${outputPath}`);
  console.log(`\n📈 Statistics:`);
  console.log(`   Total unique texts: ${sortedTexts.length}`);
  console.log(`   Most common: "${sortedTexts[0].text}" (${sortedTexts[0].occurrences.length} times)`);
  console.log(`\n✨ Done! Ready for translation.`);
}

function generateKey(text: string): string {
  // Convert text to snake_case key
  let key = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50); // Limit length
  
  return key || 'unknown_text';
}

// Run extraction
extractAllTexts().catch(console.error);

