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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
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
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get user from auth header
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader },
    });
    
    const user = await userResponse.json();
    if (!user?.id) {
      throw new Error('Failed to get user');
    }

    // Get user's calendar settings
    const settingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/google_calendar_settings?user_id=eq.${user.id}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const settings = await settingsResponse.json();
    if (!settings || settings.length === 0) {
      throw new Error('No calendar settings found');
    }

    const userSettings = settings[0];

    // Get planning items to sync (for demo, we'll create a sample event)
    const planningResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/planning_items?user_id=eq.${user.id}&google_event_id=is.null&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const planningItems = await planningResponse.json();
    let syncedCount = 0;
    const selectedCalendars = userSettings.selected_calendars || [{ id: userSettings.calendar_id }];

    for (const item of planningItems || []) {
      for (const calendar of selectedCalendars) {
        try {
          // Create event in Google Calendar
          const eventData = {
            summary: item.title,
            description: item.description,
            start: {
              dateTime: item.start_time,
              timeZone: 'Europe/Amsterdam'
            },
            end: {
              dateTime: item.end_time,
              timeZone: 'Europe/Amsterdam'
            },
            location: item.location
          };

          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${userSettings.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventData)
            }
          );

          if (response.ok) {
            const createdEvent = await response.json();
            
            // Update planning item with Google event ID
            await fetch(`${SUPABASE_URL}/rest/v1/planning_items?id=eq.${item.id}`, {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                google_event_id: createdEvent.id,
                calendar_id: calendar.id
              })
            });

            syncedCount++;
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }
    }

    return new Response(JSON.stringify({ syncedItems: syncedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error syncing planning:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleSyncFromGoogle(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get user from auth header
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader },
    });
    
    const user = await userResponse.json();
    if (!user?.id) {
      throw new Error('Failed to get user');
    }

    // Get user's calendar settings
    const settingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/google_calendar_settings?user_id=eq.${user.id}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const settings = await settingsResponse.json();
    if (!settings || settings.length === 0) {
      throw new Error('No calendar settings found');
    }

    const userSettings = settings[0];
    let importedCount = 0;
    const selectedCalendars = userSettings.selected_calendars || [{ id: userSettings.calendar_id }];
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(); // Next 30 days

    for (const calendar of selectedCalendars) {
      try {
        // Fetch events from Google Calendar
        const eventsResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
          `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              'Authorization': `Bearer ${userSettings.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!eventsResponse.ok) continue;

        const eventsData = await eventsResponse.json();
        
        for (const event of eventsData.items || []) {
          if (!event.start?.dateTime || !event.end?.dateTime) continue;

          // Check if event already exists
          const existingResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/planning_items?google_event_id=eq.${event.id}&user_id=eq.${user.id}`,
            {
              headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
            }
          );

          const existing = await existingResponse.json();

          if (!existing || existing.length === 0) {
            // Import new event
            const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/planning_items`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: user.id,
                title: event.summary || 'Untitled Event',
                description: event.description || '',
                start_time: event.start.dateTime,
                end_time: event.end.dateTime,
                location: event.location || '',
                google_event_id: event.id,
                calendar_id: calendar.id,
                status: event.status || 'confirmed'
              })
            });

            if (insertResponse.ok) {
              importedCount++;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to sync from calendar ${calendar.id}:`, error);
      }
    }

    return new Response(JSON.stringify({ importedEvents: importedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error syncing from Google:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleGetCalendars(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get user from auth header
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader },
    });
    
    const user = await userResponse.json();
    if (!user?.id) {
      throw new Error('Failed to get user');
    }

    // Get user's calendar settings with access token
    const settingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/google_calendar_settings?user_id=eq.${user.id}&select=access_token,refresh_token,token_expires_at`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const settings = await settingsResponse.json();
    if (!settings || settings.length === 0) {
      throw new Error('No calendar settings found');
    }

    const userSettings = settings[0];
    let accessToken = userSettings.access_token;

    // Check if token needs refresh
    if (userSettings.token_expires_at && new Date(userSettings.token_expires_at) <= new Date()) {
      // Refresh token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
          refresh_token: userSettings.refresh_token || '',
          grant_type: 'refresh_token'
        })
      });

      const refreshData = await refreshResponse.json();
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token: ' + refreshData.error_description);
      }

      accessToken = refreshData.access_token;
      
      // Update token in database
      await fetch(`${SUPABASE_URL}/rest/v1/google_calendar_settings?user_id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
        })
      });
    }

    // Fetch calendars from Google Calendar API
    const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!calendarsResponse.ok) {
      throw new Error('Failed to fetch calendars from Google');
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.items?.map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary,
      accessRole: cal.accessRole,
      backgroundColor: cal.backgroundColor,
      foregroundColor: cal.foregroundColor
    })) || [];

    return new Response(JSON.stringify({ calendars }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching calendars:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}