import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    switch (action) {
      case 'oauth_start':
        return handleOAuthStart(payload);
      
      case 'oauth_callback':
        return handleOAuthCallback(payload, req);
      
      case 'sync_planning':
        return handleSyncPlanning(req);
      
      case 'sync_from_google':
        return handleSyncFromGoogle(req);
      
      case 'get_calendars':
        return handleGetCalendars(req);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in google-calendar-sync:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function handleOAuthStart(payload: any) {
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const redirectUri = payload.redirectUri || 'http://localhost:3000/settings/calendar';
  
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID not configured');
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;

  return new Response(JSON.stringify({ authUrl }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleOAuthCallback(payload: any, req: Request) {
  const { code, redirectUri } = payload;
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  // Get user from auth header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  const tokens = await tokenResponse.json();
  
  if (!tokens.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(tokens));
  }

  // Get user profile from Supabase
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: authHeader },
  });
  
  const user = await userResponse.json();
  if (!user?.id) {
    throw new Error('Failed to get user');
  }

  // Get or create primary calendar
  const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  
  const calendars = await calendarsResponse.json();
  const primaryCalendar = calendars.items?.find((cal: any) => cal.primary);

  if (!primaryCalendar) {
    throw new Error('No primary calendar found');
  }

  // Get user profile to determine role
  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  
  const profiles = await profileResponse.json();
  const userRole = profiles[0]?.role || 'Bekijker';

  // Store calendar settings
  const calendarData = {
    user_id: user.id,
    user_role: userRole,
    calendar_id: primaryCalendar.id,
    calendar_name: primaryCalendar.summary,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    sync_enabled: true,
    sync_status: 'connected'
  };

  const upsertResponse = await fetch(`${SUPABASE_URL}/rest/v1/google_calendar_settings`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(calendarData),
  });

  if (!upsertResponse.ok) {
    const error = await upsertResponse.text();
    throw new Error('Failed to store calendar settings: ' + error);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    calendar: primaryCalendar,
    role: userRole 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSyncPlanning(req: Request) {
  // For now, return a simple success response
  // This would be implemented to sync planning items to Google Calendar
  return new Response(JSON.stringify({ 
    success: true, 
    syncedItems: 0,
    message: 'Sync planning functionality will be implemented'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSyncFromGoogle(req: Request) {
  // For now, return a simple success response
  // This would be implemented to sync from Google Calendar to planning items
  return new Response(JSON.stringify({ 
    success: true, 
    importedEvents: 0,
    message: 'Import from Google functionality will be implemented'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetCalendars(req: Request) {
  // For now, return empty calendars
  // This would be implemented to fetch available calendars
  return new Response(JSON.stringify({ 
    calendars: [], 
    connected: false,
    message: 'Get calendars functionality will be implemented'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}