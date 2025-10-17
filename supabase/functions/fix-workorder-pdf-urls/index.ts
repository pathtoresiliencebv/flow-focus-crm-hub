import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get all work orders without PDF URLs
    const { data: workOrders, error: workOrdersError } = await supabaseClient
      .from('project_work_orders')
      .select(`
        *,
        completion:project_completions!completion_id(pdf_url)
      `)
      .is('pdf_url', null)

    if (workOrdersError) throw workOrdersError

    console.log(`Found ${workOrders?.length || 0} work orders without PDF URLs`)

    let fixedCount = 0

    for (const workOrder of workOrders || []) {
      if (workOrder.completion?.pdf_url) {
        // Update work order with PDF URL from completion
        const { error: updateError } = await supabaseClient
          .from('project_work_orders')
          .update({ 
            pdf_url: workOrder.completion.pdf_url
          })
          .eq('id', workOrder.id)

        if (updateError) {
          console.error(`Error updating work order ${workOrder.id}:`, updateError)
        } else {
          fixedCount++
          console.log(`✅ Fixed work order ${workOrder.id}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Fixed ${fixedCount} work orders`,
        total: workOrders?.length || 0,
        fixed: fixedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error fixing work order PDF URLs:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
