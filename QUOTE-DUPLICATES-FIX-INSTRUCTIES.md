# 🔧 Fix voor Quote Number Duplicates

## ❌ Probleem
Je krijgt deze fout bij het opslaan van offertes:
```
Database fout: duplicate key value violates unique constraint "quotes_quote_number_key"
```

## 🔍 Oorzaak
De oude `generate_quote_number()` functie heeft **geen advisory locking**. Dit zorgt voor **race conditions** wanneer meerdere gebruikers tegelijk offertes aanmaken - ze krijgen dan hetzelfde nummer.

## ✅ Oplossing

### Stap 1: Open Supabase Dashboard
1. Ga naar [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecteer je project: **uovghphzrhqvgqtddhfw**
3. Ga naar **SQL Editor** (in het linkermenu)

### Stap 2: Voer de Fix SQL uit
1. Klik op **"New query"**
2. Open het bestand `FIX-QUOTE-DUPLICATES.sql` uit je project root
3. **Kopieer ALLES** uit dat bestand
4. **Plak** in de SQL Editor
5. Klik op **"Run"** (of druk F5)

### Stap 3: Fix Bestaande Duplicates
Na het uitvoeren van bovenstaande SQL, voer dit apart uit:
```sql
SELECT * FROM public.fix_duplicate_quote_numbers();
```

Dit laat zien welke duplicates zijn gefixed.

### Stap 4: Test de Nieuwe Functie
```sql
SELECT public.generate_quote_number();
```

Dit zou een uniek nummer moeten genereren zoals: `OFF-2025-0001`

## 🧪 Verificatie

### Check of er nog duplicates zijn:
```sql
SELECT quote_number, COUNT(*) as count
FROM quotes
GROUP BY quote_number
HAVING COUNT(*) > 1;
```

Als dit **geen resultaten** geeft → ✅ Geen duplicates!

### Test de nieuwe functie:
```sql
-- Run dit 3x en check dat je 3 verschillende nummers krijgt
SELECT public.generate_quote_number();
SELECT public.generate_quote_number();
SELECT public.generate_quote_number();
```

## 📊 Wat is er gefixed?

### Voor (Oude functie):
```sql
-- GEEN locking → Race conditions mogelijk
SELECT MAX(number) + 1 FROM quotes;  -- ❌ Onveilig
```

### Na (Nieuwe functie):
```sql
-- Advisory locking → Thread-safe
PERFORM pg_advisory_lock(lock_key);  -- ✅ Veilig
SELECT MAX(number) + 1 FROM quotes;
PERFORM pg_advisory_unlock(lock_key);
```

## 🎯 Technische Details

### Advisory Lock Werking:
1. **Lock aanvragen** met unieke key per jaar
2. **Nummer genereren** (niemand anders kan nu nummers genereren)
3. **Lock vrijgeven**
4. **Return nummer**

### Lock Key:
```sql
lock_key := ('x' || substring(md5('2025'), 1, 8))::bit(32)::integer;
```
- Uniek per jaar
- Verschillende jaren kunnen parallel werken
- Voorkomt blocking tussen jaren

## 🚨 Troubleshooting

### Fout: "permission denied for function"
```sql
-- Voer dit uit:
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_duplicate_quote_numbers() TO authenticated;
```

### Fout: "function already exists"
→ Dit is OK! De `CREATE OR REPLACE` update de bestaande functie.

### Nog steeds duplicates?
1. Check of de nieuwe functie actief is:
```sql
\df public.generate_quote_number
```

2. Kijk naar de functie definitie:
```sql
SELECT prosrc FROM pg_proc 
WHERE proname = 'generate_quote_number';
```

Moet `pg_advisory_lock` bevatten ✅

## 📞 Support
Als het probleem blijft bestaan na deze fix:
1. Check de Supabase logs voor errors
2. Verifieer dat beide functies zijn aangemaakt
3. Test handmatig met de verificatie queries hierboven

## ✨ Resultaat
Na deze fix:
- ✅ Geen duplicate quote numbers meer
- ✅ Veilig voor meerdere gelijktijdige gebruikers
- ✅ Automatische duplicate resolution
- ✅ Jaar-gebaseerde nummering (OFF-2025-0001, etc.)

