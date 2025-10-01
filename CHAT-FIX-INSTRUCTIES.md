# 🔧 Fix voor Chat Berichten Blijven Leeg

## ❌ Probleem
Wanneer je een bericht intypt in de chat, blijft het bericht leeg staan en wordt niet verzonden.

## 🔍 Mogelijke Oorzaken
1. **Database schema conflict** - Meerdere migraties met verschillende kolom namen (`sender_id` vs `from_user_id`)
2. **RLS (Row Level Security) policies** blokkeren het insert
3. **Foreign key constraints** zijn niet correct
4. **Realtime subscriptions** werken niet

## ✅ Oplossing - Stap voor Stap

### Stap 1: Test met Enhanced Debugging

De code heeft nu uitgebreide debugging. Volg deze stappen:

1. **Open de applicatie** in je browser
2. **Open Developer Tools** (F12)
3. **Ga naar Console tab**
4. **Selecteer een contact** in de chat
5. **Typ een bericht** en klik op verzenden
6. **Kijk naar de console** voor deze messages:

```
📤 Sending message: { from: "...", to: "...", content: "..." }
📝 Insert data: { from_user_id: "...", to_user_id: "...", content: "..." }
```

**Als je een error ziet:**
- ❌ Dan krijg je een **ALERT** met de foutmelding
- Kopieer de **foutmelding** (inclusief code en details)
- Ga naar **Stap 2**

**Als je geen error ziet maar wel:**
```
✅ Message sent successfully: { ... }
📊 Messages updated, count: X
```
- Dan is het bericht verzonden maar mogelijk een UI probleem
- Refresh de pagina en check of het bericht er nu staat

### Stap 2: Check Database Schema

Voer dit uit in **Supabase Dashboard > SQL Editor**:

1. Open `CHECK-CHAT-DATABASE.sql`
2. Kopieer de inhoud
3. Plak in SQL Editor
4. Klik **"Run"**

**Check de resultaten:**

#### ✅ Query 1: Kolommen
Moet deze kolommen hebben:
- `id` (uuid)
- `from_user_id` (uuid) ← **BELANGRIJK**
- `to_user_id` (uuid) ← **BELANGRIJK**
- `content` (text)
- `created_at` (timestamp)

❌ Als je `sender_id` of `receiver_id` ziet → **GA NAAR STAP 3**

#### ✅ Query 2: Foreign Keys
Moet foreign keys hebben naar `auth.users(id)`

#### ✅ Query 3: RLS Policies
Moet minimaal deze policies hebben:
- "Users can send messages" (INSERT)
- "Users can view messages they sent or received" (SELECT)

#### ✅ Query 4: RLS Enabled
Moet `true` zijn

### Stap 3: Fix Database Schema (indien nodig)

**⚠️ ALLEEN uitvoeren als Stap 2 problemen toonde**

1. Open `FIX-CHAT-DATABASE.sql`
2. Kopieer **ALLES**
3. Plak in **Supabase Dashboard > SQL Editor**
4. Klik **"Run"**

Dit script doet:
- ✅ Verwijdert oude/conflicterende policies
- ✅ Checkt en fix het tabel schema
- ✅ Maakt correcte RLS policies aan
- ✅ Voegt performance indexes toe
- ✅ Enabled realtime subscriptions

**Na het uitvoeren:**
```sql
SELECT 
  COUNT(*) as message_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'direct_messages') as policy_count
FROM public.direct_messages;
```

Moet laten zien:
- `policy_count`: 4 (vier policies)

### Stap 4: Test de Fix

1. **Refresh de applicatie** (Ctrl + F5 voor hard refresh)
2. **Ga naar Chat**
3. **Selecteer een contact**
4. **Typ een test bericht**: "Test 123"
5. **Klik verzenden**

**Check Console (F12):**
```
📤 Sending message: ...
📝 Insert data: ...
✅ Message sent successfully: ...
📊 Messages updated, count: 1
```

**Check in de UI:**
- Bericht moet verschijnen in de chat
- Moet aan de rechterkant staan (eigen bericht)

### Stap 5: Test Realtime

1. Open applicatie in **2 browser windows** (of incognito + normaal)
2. Log in als **verschillende gebruikers**
3. Stuur een bericht van user A naar user B
4. **Check of user B het bericht DIRECT ziet** (zonder refresh)

✅ Als user B het meteen ziet → Realtime werkt!
❌ Als user B moet refreshen → Realtime werkt niet (maar verzenden wel)

## 🐛 Troubleshooting

### Probleem: "new row violates row-level security policy"
**Oorzaak:** RLS policies blokkeren insert

**Oplossing:**
```sql
-- Check of je ingelogd bent
SELECT auth.uid();

-- Check policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'direct_messages';

-- Voer FIX-CHAT-DATABASE.sql uit
```

### Probleem: "null value in column from_user_id violates not-null constraint"
**Oorzaak:** Gebruiker is niet ingelogd of auth.uid() is null

**Oplossing:**
1. Check of je ingelogd bent
2. Refresh de pagina
3. Check in console: `localStorage.getItem('supabase.auth.token')`

### Probleem: "insert or update on table violates foreign key constraint"
**Oorzaak:** to_user_id bestaat niet in auth.users

**Oplossing:**
```sql
-- Check of gebruiker bestaat
SELECT id, email FROM auth.users WHERE id = 'USER_ID_HIER';

-- Check of to_user_id correct is
-- Kijk in console naar: 📤 Sending message: { to: "..." }
```

### Probleem: Berichten verschijnen niet (geen error)
**Oorzaak:** Realtime subscription werkt niet of UI update probleem

**Oplossing:**
1. Check database:
```sql
SELECT * FROM direct_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

Als berichten WEL in database staan:
- Refresh de pagina
- Check realtime setup
- Check of `selectedConversation` correct is

### Probleem: "relation direct_messages does not exist"
**Oorzaak:** Tabel is niet aangemaakt

**Oplossing:**
```sql
-- Voer FIX-CHAT-DATABASE.sql uit
```

## 📊 Debug Info

### Console Logs Uitleg

| Log | Betekenis |
|-----|-----------|
| `📤 Sending message` | Bericht wordt verzonden |
| `📝 Insert data` | Data die naar database gaat |
| `✅ Message sent successfully` | Database insert succesvol |
| `📊 Messages updated, count: X` | UI is bijgewerkt met X berichten |
| `❌ Database error` | Database error (zie alert) |
| `⚠️ Cannot send message` | Validatie gefaald (geen user/content) |
| `⚠️ Message already exists` | Duplicate (normaal bij realtime) |

### SQL Verificatie Queries

```sql
-- 1. Check laatste berichten
SELECT 
  dm.id,
  dm.content,
  dm.created_at,
  u1.email as from_user,
  u2.email as to_user
FROM direct_messages dm
JOIN auth.users u1 ON dm.from_user_id = u1.id
JOIN auth.users u2 ON dm.to_user_id = u2.id
ORDER BY dm.created_at DESC
LIMIT 10;

-- 2. Check berichten tussen 2 specifieke gebruikers
SELECT * FROM direct_messages
WHERE (from_user_id = 'USER_A_ID' AND to_user_id = 'USER_B_ID')
   OR (from_user_id = 'USER_B_ID' AND to_user_id = 'USER_A_ID')
ORDER BY created_at ASC;

-- 3. Check RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'direct_messages'
ORDER BY cmd, policyname;

-- 4. Test insert als current user
INSERT INTO direct_messages (from_user_id, to_user_id, content)
VALUES (auth.uid(), auth.uid(), 'Test bericht naar mezelf')
RETURNING *;
```

## ✨ Na de Fix

Eenmaal gefixed:
- ✅ Berichten kunnen verzonden worden
- ✅ Berichten verschijnen direct in de UI
- ✅ Realtime updates werken
- ✅ Uitgebreide console logging voor debugging
- ✅ Error alerts tonen exacte foutmelding

## 📞 Nog Steeds Problemen?

Als het nog niet werkt na alle stappen:

1. **Kopieer console output** (hele console, inclusief errors)
2. **Kopieer SQL output** van CHECK-CHAT-DATABASE.sql
3. **Screenshot van de alert** (als er een is)
4. **Check Supabase logs**: Dashboard > Logs > Database

Deel deze info en we kunnen verder debuggen!

