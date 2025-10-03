# Test Guide: Email Auto-save & Searchable Customer Select

## 🎯 Functionaliteiten Geïmplementeerd

### 1. ✅ Automatische Email Opslag bij Verzenden
Wanneer een offerte of factuur wordt verzonden, wordt het email adres automatisch opgeslagen in de customers tabel.

**Locaties:**
- `supabase/functions/send-quote-email/index.ts` (regel 274-292)
- `supabase/functions/send-invoice-email/index.ts` (regel 373-391)

**Logica:**
```typescript
// Als quote/invoice een customer_id heeft en er is een recipient email
if (quote.customer_id && recipientEmail) {
  // Update customer record met email
  await supabase
    .from('customers')
    .update({ 
      email: recipientEmail,
      updated_at: new Date().toISOString()
    })
    .eq('id', quote.customer_id);
}
```

### 2. ✅ Zoekbare Klant Selector
Nieuwe component met zoekfunctionaliteit op naam, email, telefoon en bedrijfsnaam.

**Component:** `src/components/ui/searchable-customer-select.tsx`

**Features:**
- 🔍 Zoeken op naam, email, telefoon, bedrijfsnaam
- 📋 Toon klantdetails in dropdown (email + telefoon)
- ✓ Visuele selectie indicator
- 🎨 Mooie UI met icons en formatting
- ⚡ Real-time filtering

**Geïmplementeerd in:**
- `src/components/quotes/MultiBlockQuoteForm.tsx` (regel 939-945)
- `src/components/invoicing/MultiBlockInvoiceForm.tsx` (regel 546-551)

---

## 🧪 Test Scenario's

### Test 1: Email Auto-save bij Offerte Verzenden

**Stappen:**
1. Open een bestaande offerte OF maak een nieuwe offerte
2. Selecteer een klant die nog GEEN email adres heeft
3. Klik op "Versturen" knop
4. Vul een email adres in (bijv. `test@klant.nl`)
5. Verstuur de offerte
6. ✅ **Verwacht resultaat:** Email is verzonden

**Verificatie:**
1. Ga naar Klanten overzicht
2. Zoek de klant op
3. ✅ **Verwacht resultaat:** Email adres is nu ingevuld bij de klant

**Database Check:**
```sql
-- Controleer of email is opgeslagen
SELECT id, name, email, updated_at 
FROM customers 
WHERE id = '<customer_id>';
```

### Test 2: Email Auto-save bij Factuur Verzenden

**Stappen:**
1. Open een bestaande factuur OF maak een nieuwe factuur
2. Selecteer een klant met een oud/verkeerd email adres
3. Klik op "Versturen" of "Finaliseren en verzenden"
4. Wijzig het email adres naar een nieuw adres (bijv. `nieuw@email.nl`)
5. Verstuur de factuur
6. ✅ **Verwacht resultaat:** Factuur is verzonden

**Verificatie:**
1. Ga naar Klanten overzicht
2. Zoek de klant op
3. ✅ **Verwacht resultaat:** Email adres is geüpdatet naar het nieuwe adres

### Test 3: Zoekbare Klant Selector in Offerte

**Stappen:**
1. Ga naar "Nieuwe Offerte"
2. Klik op het klant veld
3. ✅ **Verwacht resultaat:** Dropdown opent met zoekbalk
4. Type "test" in de zoekbalk
5. ✅ **Verwacht resultaat:** Alleen klanten met "test" in naam/email/telefoon worden getoond
6. Type een email adres (bijv. "john@")
7. ✅ **Verwacht resultaat:** Klanten met dat email worden getoond
8. Type een telefoonnummer (bijv. "06")
9. ✅ **Verwacht resultaat:** Klanten met dat nummer worden getoond
10. Selecteer een klant
11. ✅ **Verwacht resultaat:** Klant is geselecteerd en dropdown sluit

### Test 4: Zoekbare Klant Selector in Factuur

**Stappen:**
1. Ga naar "Nieuwe Factuur"
2. Klik op het klant veld
3. ✅ **Verwacht resultaat:** Dropdown opent met zoekbalk
4. Test zoeken op verschillende criteria (naam, email, telefoon)
5. ✅ **Verwacht resultaat:** Filtering werkt correct
6. Selecteer een klant
7. ✅ **Verwacht resultaat:** Klant is geselecteerd

### Test 5: Edge Cases

**Test 5.1: Klant zonder email**
1. Maak een offerte voor een klant zonder email
2. Probeer te verzenden
3. ✅ **Verwacht:** Email veld in dialog is leeg maar kan ingevuld worden
4. Vul email in en verstuur
5. ✅ **Verwacht:** Email wordt opgeslagen bij klant

**Test 5.2: Offerte/Factuur zonder customer_id**
1. Maak een offerte zonder klant te selecteren (als mogelijk)
2. ✅ **Verwacht:** Formulier valideert en vraagt om klant
3. Of: Als verzonden zonder customer_id, geen crash en email wordt NIET opgeslagen

**Test 5.3: Veel klanten (performance)**
1. Test met 100+ klanten in lijst
2. Open klant selector
3. ✅ **Verwacht:** Dropdown laadt snel
4. Type in zoekbalk
5. ✅ **Verwacht:** Filtering is real-time en snel

**Test 5.4: Speciale karakters in zoek**
1. Zoek op klant met é, ü, ñ etc in naam
2. ✅ **Verwacht:** Zoeken werkt correct
3. Zoek op email met + of . 
4. ✅ **Verwacht:** Zoeken werkt correct

---

## 🔧 Technische Details

### Edge Function Logs Checken

Bij verzenden van offerte/factuur, check de logs:
```bash
# Lokaal
supabase functions logs send-quote-email

# Of in Supabase Dashboard > Edge Functions > Logs
```

**Verwachte log output:**
```
Sending quote email for ID: <quote_id> to: test@klant.nl
💾 Saving customer email: { customer_id: '<id>', email: 'test@klant.nl' }
✅ Customer email saved successfully
Quote email sent successfully
```

### Database Migration Status

Check of customer email veld bestaat:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'email';
```

**Verwacht resultaat:**
```
column_name | data_type
email       | text
```

---

## 🐛 Troubleshooting

### Probleem: Email wordt niet opgeslagen

**Mogelijke oorzaken:**
1. Quote/Invoice heeft geen `customer_id` 
   - **Fix:** Zorg dat customer altijd geselecteerd is
2. Edge function heeft geen toegang tot customers tabel
   - **Fix:** Check RLS policies op customers tabel
3. `recipientEmail` is leeg
   - **Fix:** Valideer dat email veld verplicht is

**Debug stappen:**
1. Check Edge Function logs (zie hierboven)
2. Check of `customer_id` aanwezig is in quote/invoice
3. Check of email veld gevuld is bij verzenden
4. Check database RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'customers';
   ```

### Probleem: Zoekbalk werkt niet

**Mogelijke oorzaken:**
1. Component niet correct geïmporteerd
   - **Fix:** Check imports in MultiBlockQuoteForm/InvoiceForm
2. Customers array is leeg
   - **Fix:** Check of useCrmStore() customers laadt
3. TypeScript errors
   - **Fix:** Check console voor errors

**Debug stappen:**
1. Open browser console
2. Check of customers array gevuld is: `console.log(customers)`
3. Check of SearchableCustomerSelect component rendert
4. Check voor TypeScript/React errors

---

## ✅ Acceptatie Criteria

De implementatie is succesvol als:

1. ✅ Bij verzenden offerte wordt email automatisch opgeslagen bij klant
2. ✅ Bij verzenden factuur wordt email automatisch opgeslagen bij klant
3. ✅ Email wordt alleen opgeslagen als er een customer_id is
4. ✅ Bestaande email wordt overschreven met nieuwe waarde
5. ✅ Zoekbalk in offerte formulier werkt op naam, email, telefoon
6. ✅ Zoekbalk in factuur formulier werkt op naam, email, telefoon
7. ✅ Zoekresultaten tonen relevante klantinformatie
8. ✅ Selecteren van klant werkt correct
9. ✅ Performance is goed met veel klanten
10. ✅ Geen linter errors of warnings

---

## 📝 Aanvullende Opmerkingen

### Voordelen van deze implementatie:

1. **Automatisch data beheer** - Klant emails blijven up-to-date zonder handmatige actie
2. **Betere UX** - Zoeken is veel sneller dan scrollen door lange lijst
3. **Minder fouten** - Automatisch opslaan voorkomt vergeten emails
4. **Consistente data** - Email wordt opgeslagen op het moment van verzenden
5. **Backwards compatible** - Bestaande functionaliteit blijft werken

### Toekomstige verbeteringen:

1. **Auto-complete email** - Suggest emails based on company domain
2. **Bulk email update** - Update multiple customers at once
3. **Email validation** - Check if email format is valid before saving
4. **Email change log** - Track when customer email was changed
5. **Duplicate detection** - Warn if email already exists for other customer

---

**Implementatie datum:** {{DATE}}  
**Versie:** 1.0  
**Status:** ✅ Ready for Testing

