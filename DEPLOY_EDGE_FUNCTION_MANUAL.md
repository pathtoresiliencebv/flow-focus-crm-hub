# Edge Function Handmatig Deployen via Supabase Dashboard

## 📝 Stap-voor-Stap Instructies

### Stap 1: Open Supabase Dashboard

1. Ga naar: https://supabase.com/dashboard
2. Log in met je account
3. Selecteer je project

### Stap 2: Navigeer naar Edge Functions

1. Klik in het linker menu op **"Edge Functions"**
2. Klik op de knop **"Create a new function"** of **"Deploy new function"**

### Stap 3: Maak de Functie Aan

**Function Name**: `generate-stream-token`

**Code** (kopieer onderstaande code):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { StreamChat } from 'https://esm.sh/stream-chat@8.40.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    console.log('🔐 Generating Stream token for user:', {
      id: profile.id,
      name: profile.full_name,
      role: profile.role
    });

    // Initialize Stream Chat server-side client
    const streamApiKey = Deno.env.get('STREAM_API_KEY');
    const streamApiSecret = Deno.env.get('STREAM_API_SECRET');

    if (!streamApiKey || !streamApiSecret) {
      throw new Error('Stream API credentials not configured');
    }

    const serverClient = StreamChat.getInstance(streamApiKey, streamApiSecret);

    // Create or update user in Stream
    const streamUser = {
      id: profile.id,
      name: profile.full_name,
      role: profile.role,
      email: profile.email,
    };

    // Upsert user in Stream (creates if doesn't exist, updates if exists)
    await serverClient.upsertUser(streamUser);

    // Generate user token
    const userToken = serverClient.createToken(profile.id);

    console.log('✅ Stream token generated successfully');

    return new Response(
      JSON.stringify({
        token: userToken,
        apiKey: streamApiKey,
        userId: profile.id,
        user: streamUser,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error generating Stream token:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate Stream token',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

### Stap 4: Stel Secrets In

1. Ga in het dashboard naar **"Edge Functions"** > **"Settings"** of **"Secrets"**
2. Voeg de volgende secrets toe:

**STREAM_API_KEY**:
```
your_stream_api_key
```

**STREAM_API_SECRET**:
```
your_stream_api_secret
```

### Stap 5: Deploy de Functie

1. Klik op **"Deploy function"**
2. Wacht tot de deployment voltooid is
3. Je ziet een groene status indicator als het succesvol is

### Stap 6: Test de Functie

1. In het dashboard, klik op de functie naam
2. Ga naar **"Invocations"** of **"Logs"**
3. Test de functie met een request

## ✅ Verificatie

Test of de functie werkt:

### Via curl (in Git Bash):

```bash
curl -X POST 'https://your-project-id.supabase.co/functions/v1/generate-stream-token' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id"}'
```

### Via Web App Console:

```javascript
const { data, error } = await supabase.functions.invoke('generate-stream-token', {
  body: { userId: user.id }
});

console.log('Token:', data);
```

## 🔒 Belangrijk

1. **Geheimen Behouden**: Stream API Secret NOOIT in code plaatsen
2. **CORS**: De functie heeft CORS headers voor web/mobile toegang
3. **Authentication**: Functie vereist geldige Supabase JWT token

## 📋 Checklist

- [ ] Edge Function aangemaakt in dashboard
- [ ] Code gekopieerd en geplakt
- [ ] STREAM_API_KEY secret toegevoegd
- [ ] STREAM_API_SECRET secret toegevoegd
- [ ] Functie deployed
- [ ] Functie getest en werkt

---

**Deployment Methode**: Handmatig via Dashboard  
**Status**: Manual deployment instructies  
**Datum**: 13 Oktober 2025

