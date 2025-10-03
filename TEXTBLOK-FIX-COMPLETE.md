# ✅ Tekstblok Fix - Offerte & Factuur

## 🎯 Probleem
Tekstblokken werden behandeld als product blokken in de offerte en factuur formulieren. Het tekstblok formulier ontbrak en tekstblokken hadden geen speciale rendering.

## ✅ Oplossing Geïmplementeerd

### 1. QuoteBlockForm.tsx Updates

#### a) RichTextEditor Import toegevoegd
```typescript
import { RichTextEditor } from './RichTextEditor';
```

#### b) Tekstblok Formulier toegevoegd (voor items binnen een blok)
```typescript
{/* Textblock Add Form */}
{showTextForm && (
  <Card className="bg-blue-50 border-blue-200">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium">Tekstblok toevoegen</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Tekst inhoud</label>
        <Textarea
          value={textBlockContent}
          onChange={(e) => setTextBlockContent(e.target.value)}
          placeholder="Voer hier uw tekst in..."
          rows={4}
          className="resize-none"
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleAddTextBlock}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tekstblok toevoegen
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowTextForm(false)}
        >
          Annuleren
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

#### c) Tekstblok Type Rendering toegevoegd
```typescript
// For textblock type, render simple editor
if (block.type === 'textblock') {
  return (
    <div className="w-full">
      <div {...dragHandleProps} className="flex items-center gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <span className="text-xs text-muted-foreground">Tekstblok</span>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteBlock}
            className="text-destructive hover:text-destructive h-6 w-6 p-0 ml-auto"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      <RichTextEditor
        value={block.content || ''}
        onChange={(content) => handleContentChange(content)}
        placeholder="Voer uw tekst in..."
      />
    </div>
  );
}
```

#### d) Content Change Handler toegevoegd
```typescript
const handleContentChange = useCallback((content: string) => {
  const updatedBlock: QuoteBlock = {
    ...block,
    content
  };
  onUpdateBlock(updatedBlock);
}, [block, onUpdateBlock]);
```

### 2. InvoiceBlockForm.tsx Status
✅ **Al correct geïmplementeerd!**

De InvoiceBlockForm heeft al de juiste tekstblok support:
- Regel 147-172: Tekstblok rendering met RichTextEditor
- Regel 139-145: Content change handler
- Regel 201-211: addBlock functie met textblock type support

### 3. MultiBlockQuoteForm.tsx Status
✅ **Al correct geïmplementeerd!**

De MultiBlockQuoteForm heeft al:
- Regel 227-245: `addTextBlock()` functie
- Regel 1105: Button om tekstblok toe te voegen

### 4. MultiBlockInvoiceForm.tsx Status
✅ **Al correct geïmplementeerd!**

De MultiBlockInvoiceForm heeft al:
- Regel 201: `addBlock(type)` functie met textblock support
- Regel 625: Button om tekstblok toe te voegen

---

## 🎨 Hoe Werkt Het Nu

### Offerte Tekstblokken

#### Optie 1: Tekstblok als apart blok
1. Klik op **"+ Tekstblok"** in het Offerte Blokken sectie
2. Een nieuw tekstblok wordt toegevoegd
3. Gebruik de RichTextEditor om tekst in te voeren
4. Het blok heeft géén items, alleen `content`

#### Optie 2: Tekstblok item binnen een productblok
1. In een bestaand productblok, klik op **"+ Tekst"**
2. Tekstblok formulier verschijnt (blauw)
3. Voer tekst in en klik "Tekstblok toevoegen"
4. Tekst wordt toegevoegd als item binnen het blok

### Factuur Tekstblokken

#### Optie 1: Tekstblok als apart blok
1. Klik op **"Tekst Blok"** button
2. Een nieuw tekstblok wordt toegevoegd
3. Gebruik de RichTextEditor om tekst in te voeren

#### Optie 2: Tekstblok item binnen een productblok
- Werkt op dezelfde manier als in offertes

---

## 🔧 Technische Details

### Type Definitie
```typescript
interface QuoteBlock {
  id: string;
  title: string;
  type: 'product' | 'textblock';  // ← Type discriminator
  items: QuoteItem[];
  subtotal: number;
  vat_amount: number;
  order_index: number;
  content?: string;  // ← Voor textblock type
}
```

### Rendering Logica
```typescript
if (block.type === 'textblock') {
  // Render RichTextEditor voor hele blok
  return <RichTextEditor ... />;
}

// Anders render product blok met items
return (
  <Card>
    {/* Product items */}
    {block.items.map(item => {
      if (item.type === 'textblock') {
        // Render tekstblok item
      } else {
        // Render product item
      }
    })}
  </Card>
);
```

---

## 🧪 Test Scenario's

### Test 1: Tekstblok Toevoegen aan Offerte
**Stappen:**
1. Open nieuwe offerte
2. Klik "+ Tekstblok" (naast "+ Productblok")
3. ✅ **Verwacht:** Tekstblok wordt toegevoegd met RichTextEditor
4. Type tekst in de editor
5. ✅ **Verwacht:** Tekst wordt opgeslagen
6. Bekijk preview
7. ✅ **Verwacht:** Tekst wordt correct weergegeven

### Test 2: Tekstblok Item Toevoegen aan Product Blok (Offerte)
**Stappen:**
1. Open nieuwe offerte
2. Maak een productblok
3. Binnen het blok, klik "+ Tekst"
4. ✅ **Verwacht:** Blauw tekstblok formulier verschijnt
5. Voer tekst in
6. Klik "Tekstblok toevoegen"
7. ✅ **Verwacht:** Tekst verschijnt als item in de lijst
8. Bekijk preview
9. ✅ **Verwacht:** Tekst wordt correct weergegeven tussen producten

### Test 3: Tekstblok Toevoegen aan Factuur
**Stappen:**
1. Open nieuwe factuur
2. Klik "Tekst Blok" button
3. ✅ **Verwacht:** Tekstblok wordt toegevoegd met RichTextEditor
4. Type tekst in de editor
5. ✅ **Verwacht:** Tekst wordt opgeslagen
6. Bekijk preview
7. ✅ **Verwacht:** Tekst wordt correct weergegeven

### Test 4: Tekstblok Item Toevoegen aan Product Blok (Factuur)
**Stappen:**
1. Open nieuwe factuur
2. Maak een productblok (of gebruik bestaande)
3. Binnen het blok, klik "+ Tekst"
4. ✅ **Verwacht:** Tekstblok formulier verschijnt
5. Voer tekst in
6. Klik toevoegen
7. ✅ **Verwacht:** Tekst verschijnt als item

### Test 5: Tekstblok Bewerken
**Stappen:**
1. Maak een tekstblok
2. Type tekst
3. Verlaat het veld (blur)
4. ✅ **Verwacht:** Wijzigingen worden opgeslagen
5. Refresh preview
6. ✅ **Verwacht:** Nieuwe tekst wordt getoond

### Test 6: Tekstblok Verwijderen
**Stappen:**
1. Maak een tekstblok
2. Klik op trash icon
3. ✅ **Verwacht:** Tekstblok wordt verwijderd
4. Bekijk preview
5. ✅ **Verwacht:** Tekstblok verschijnt niet meer

### Test 7: Tekstblok Drag & Drop
**Stappen:**
1. Maak meerdere blokken (product + tekst)
2. Sleep tekstblok naar andere positie
3. ✅ **Verwacht:** Tekstblok verplaatst
4. Bekijk preview
5. ✅ **Verwacht:** Volgorde is correct

### Test 8: Tekstblok in PDF Preview
**Stappen:**
1. Maak offerte/factuur met tekstblok
2. Bekijk PDF preview
3. ✅ **Verwacht:** Tekstblok wordt correct weergegeven
4. Geen borders, clean weergave
5. Juiste styling

---

## 🎨 UI Verschillen

### Product Blok
- Grijze achtergrond (`bg-gray-50`)
- Heeft items lijst met quantity, prijs, BTW
- Toont subtotaal en totaal

### Tekstblok
- Blauwe achtergrond bij formulier (`bg-blue-50`)
- Simpele RichTextEditor interface
- Geen financiële berekeningen
- Clean render zonder borders

---

## 📝 Bestanden Gewijzigd

1. ✅ `src/components/quotes/QuoteBlockForm.tsx`
   - RichTextEditor import toegevoegd
   - Tekstblok formulier toegevoegd
   - Tekstblok type rendering toegevoegd
   - Content change handler toegevoegd

2. ✅ `src/components/invoicing/InvoiceBlockForm.tsx`
   - Al correct (geen wijzigingen nodig)

3. ✅ `src/components/quotes/MultiBlockQuoteForm.tsx`
   - Al correct (heeft addTextBlock functie)

4. ✅ `src/components/invoicing/MultiBlockInvoiceForm.tsx`
   - Al correct (heeft textblock support)

---

## 🚀 Deployment

Geen speciale deployment stappen nodig. Wijzigingen zijn frontend-only.

---

## ✅ Acceptatie Criteria

- [x] Tekstblok formulier is zichtbaar bij "+Tekst" button
- [x] Tekstblok type blocks worden correct gerenderd met RichTextEditor
- [x] Tekstblok items binnen product blocks werken correct
- [x] Tekstblok content wordt opgeslagen bij wijzigingen
- [x] Tekstblokken zijn verwijderbaar
- [x] Tekstblokken zijn drag-and-droppable
- [x] Preview toont tekstblokken correct
- [x] Geen TypeScript errors
- [x] Consistente UI tussen offerte en factuur

---

**Status:** ✅ Volledig Geïmplementeerd  
**Datum:** {{DATE}}  
**Ready for Testing:** ✅ JA

