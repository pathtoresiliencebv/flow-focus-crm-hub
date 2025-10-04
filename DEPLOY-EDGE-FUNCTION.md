# Deploy Edge Function via CLI

## Stap 1: Get Access Token

1. Open: https://supabase.com/dashboard/account/tokens
2. Click: "Generate new token"
3. Name: "Edge Function Deploy"
4. Copy de token (bewaar veilig!)

## Stap 2: Deploy via CLI

Open terminal in je project folder en run:

```bash
# Set access token (vervang YOUR_TOKEN met je token)
set SUPABASE_ACCESS_TOKEN=YOUR_TOKEN

# Deploy de function
npx supabase functions deploy save-email-account --project-ref pvesgvkyiaqmsudmmtkc
```

## Alternatief: PowerShell

```powershell
$env:SUPABASE_ACCESS_TOKEN="YOUR_TOKEN"
npx supabase functions deploy save-email-account --project-ref pvesgvkyiaqmsudmmtkc
```

Dit zou de function direct moeten deployen zonder via Dashboard!

