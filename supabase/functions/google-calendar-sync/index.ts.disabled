import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, access_token, event, event_id, updates } = await req.json();

    if (!access_token) {
      throw new Error("Access token is required");
    }

    const baseUrl = 'https://www.googleapis.com/calendar/v3';
    const calendarId = 'primary'; // Use primary calendar

    switch (action) {
      case 'create_event': {
        if (!event) {
          throw new Error("Event data is required");
        }

        const response = await fetch(`${baseUrl}/calendars/${calendarId}/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create event: ${error}`);
        }

        const createdEvent = await response.json();

        return new Response(JSON.stringify({
          success: true,
          event: createdEvent
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'update_event': {
        if (!event_id || !updates) {
          throw new Error("Event ID and updates are required");
        }

        const response = await fetch(`${baseUrl}/calendars/${calendarId}/events/${event_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update event: ${error}`);
        }

        const updatedEvent = await response.json();

        return new Response(JSON.stringify({
          success: true,
          event: updatedEvent
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'delete_event': {
        if (!event_id) {
          throw new Error("Event ID is required");
        }

        const response = await fetch(`${baseUrl}/calendars/${calendarId}/events/${event_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (!response.ok && response.status !== 404) {
          const error = await response.text();
          throw new Error(`Failed to delete event: ${error}`);
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Event deleted successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'get_events': {
        const { timeMin, timeMax } = await req.json();
        
        const params = new URLSearchParams({
          timeMin: timeMin || new Date().toISOString(),
          timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          singleEvents: 'true',
          orderBy: 'startTime'
        });

        const response = await fetch(`${baseUrl}/calendars/${calendarId}/events?${params}`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to get events: ${error}`);
        }

        const events = await response.json();

        return new Response(JSON.stringify({
          success: true,
          events: events.items || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'get_calendars': {
        const response = await fetch(`${baseUrl}/users/me/calendarList`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to get calendars: ${error}`);
        }

        const calendars = await response.json();

        return new Response(JSON.stringify({
          success: true,
          calendars: calendars.items || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error("Google Calendar sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});