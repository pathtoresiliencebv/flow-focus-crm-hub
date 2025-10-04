# 🐛 EMAIL DEBUG - Maar 1 Email Zichtbaar

**Probleem:** IMAP sync haalt maar 1 email op (zou 199+ moeten zijn)

## Console Logs:
```
💾 Saving 1 inbox emails to database for persistence...
✅ Emails saved to database - will persist after refresh
```

## Edge Function Logs:
```
POST | 200 | imap-sync
execution_time_ms: 1281
version: 121
```

## Diagnose:
- ✅ IMAP verbinding succesvol (200 status)
- ✅ Geen errors
- ❌ Maar returnt maar 1 message (zou 200 moeten zijn)

## Mogelijke oorzaken:
1. ❌ IMAP FETCH command limiet?
2. ❌ Parser split regex faalt?
3. ❌ Response te groot → timeout?
4. ❌ Parser regex te complex?

## Volgende stappen:
1. Simplify IMAP FETCH (alleen essentials)
2. Better debug logging in parser
3. Check console.log output in Supabase logs
