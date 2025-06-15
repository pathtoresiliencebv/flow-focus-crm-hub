
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Belangrijk: De SERVICE_ROLE_KEY is nodig om RLS te omzeilen.
// Dit wordt hier gedaan voor de eenvoud van de mobiele API.
// In een productie-app moet de RLS zorgvuldig worden geconfigureerd.
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Verwerk CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verifieer eerst de JWT om de gebruiker te krijgen
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Admin client om database operaties uit te voeren
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.replace(/\/$/, "").split('/');
    const id = pathParts[pathParts.length - 1] === 'customers-mobile' ? null : pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET': {
        if (id) {
          const { data, error } = await supabaseAdmin.from('customers').select('*').eq('id', id).single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
          const { data, error } = await supabaseAdmin.from('customers').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      case 'POST': {
        const newCustomer = await req.json();
        const { data, error } = await supabaseAdmin.from('customers').insert(newCustomer).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      case 'PUT': {
        if (!id) return new Response(JSON.stringify({ error: 'Customer ID required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const updatedCustomer = await req.json();
        const { data, error } = await supabaseAdmin.from('customers').update(updatedCustomer).eq('id', id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      case 'DELETE': {
        if (!id) return new Response(JSON.stringify({ error: 'Customer ID required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const { error } = await supabaseAdmin.from('customers').delete().eq('id', id);
        if (error) throw error;
        return new Response(null, { status: 204, headers: { ...corsHeaders } });
      }
      default:
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
