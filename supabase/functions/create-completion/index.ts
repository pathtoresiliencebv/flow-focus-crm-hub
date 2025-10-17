import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { completionData, photos } = await req.json();

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!;

    // Create a Supabase client with the user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the token
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated.");
    }

    // Create a Supabase client with the service_role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 1. Create the project_completion entry, ensuring the installer_id is the authenticated user
    const { data: completion, error: completionError } = await supabaseAdmin
      .from('project_completions')
      .insert({
        ...completionData,
        installer_id: user.id, // Overwrite installer_id with authenticated user
      })
      .select('id, project_id')
      .single();

    if (completionError) throw completionError;

    // 2. Insert photos if any, ensuring the uploader_id is the authenticated user
    if (photos && photos.length > 0) {
      const photoUploads = photos.map((p: any) => ({ 
        ...p, 
        completion_id: completion.id,
        uploader_id: user.id, // Overwrite uploader_id
      }));
      const { error: photosError } = await supabaseAdmin.from('completion_photos').insert(photoUploads);
      if (photosError) console.warn('Failed to insert photos:', photosError.message);
    }

    // 3. Update project status via RPC
    const { error: rpcError } = await supabaseAdmin.rpc('complete_project', {
      p_project_id: completion.project_id,
      p_completion_id: completion.id,
    });
    if (rpcError) console.warn('Failed to update project status via RPC:', rpcError.message);

    return new Response(JSON.stringify({ completion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
