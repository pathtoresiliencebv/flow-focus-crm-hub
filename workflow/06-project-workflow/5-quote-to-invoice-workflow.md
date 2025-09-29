# Quote to Invoice Workflow Enhancement

## Doelstelling
Exacte kopie van quote blok structuur naar factuur met identieke formatting en layout.

## Probleem Statement
Huidige `quoteToInvoiceService.ts` verliest de blok structuur en formatting van de originele quote.

## Oplossing

### Enhanced Service
- **Behoud blok structuur**: Identieke blocks naar invoice
- **Preserve formatting**: Tekstblok formatting behouden
- **Maintain order**: Volgorde van items/blokken
- **Copy totals**: Correcte subtotalen en BTW

### Database Synchronisatie
```sql
-- Invoice items met blok informatie
ALTER TABLE invoice_items 
ADD COLUMN block_title TEXT,
ADD COLUMN block_order INTEGER,
ADD COLUMN item_formatting JSONB;
```

### Block Structure Conversion

#### Quote Blocks → Invoice Items
1. **Blok Header**: Title als tekstblok item
2. **Product Items**: Individuele regel items
3. **Text Items**: Formatting behouden
4. **Block Totals**: Subtotalen per blok

#### Formatting Preservation
- **Bold/Italic/Underline**: CSS formatting
- **Block Titles**: Consistent styling
- **Spacing**: Identieke layout

## Implementation

### Enhanced quoteToInvoiceService.ts
```typescript
// Preserve block structure
for (const block of quote.blocks) {
  // Add block header
  invoiceItems.push({
    type: 'block_header',
    description: `=== ${block.title} ===`,
    block_title: block.title,
    block_order: blockIndex
  });
  
  // Add block items with formatting
  for (const item of block.items) {
    invoiceItems.push({
      ...item,
      block_title: block.title,
      block_order: blockIndex,
      item_formatting: item.formatting
    });
  }
}
```

### Invoice Preview Component
- **Identical Layout**: Zelfde styling als quote
- **Block Sections**: Duidelijke blok scheiding  
- **Formatting**: Tekstblok styling behouden
- **Totals**: Per-blok en totaal overzicht

## Admin Interface

### Invoice Management
- **Block View**: Facturen met blok structuur
- **Edit Blocks**: Bewerk per blok indien nodig
- **Preview**: Identiek aan quote preview
- **Status**: Concept, verstuurd, betaald

### Administratie Workflow
1. Quote goedgekeurd → Invoice automatisch aangemaakt
2. Admin ziet factuur met identieke blok layout
3. Eventuele aanpassingen per blok mogelijk
4. Factuur versturen naar klant
5. Betaling tracking

## Benefits

### Consistency
- **Visual Continuity**: Quote en invoice zien er identiek uit
- **Professional**: Geen verlies van formatting
- **Recognition**: Klant herkent originele quote

### Efficiency
- **No Rework**: Geen handmatige herformattering
- **Automation**: Directe conversie mogelijk
- **Accuracy**: Geen transcriptie fouten

### Compliance
- **Audit Trail**: Duidelijke koppeling quote-invoice
- **Documentation**: Complete business trail
- **Legal**: Consistent contract → invoice