import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError?.message)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user profile for role-based filtering
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(p => p)
    const planningId = pathParts[pathParts.length - 1]

    // GET /planning - Get planning items filtered by user/role
    if (req.method === 'GET' && (planningId === 'planning' || pathParts.includes('calendar'))) {
      console.log(`Fetching planning for user: ${user.id} with role: ${userRole}`)

      let query = supabase
        .from('planning_items')
        .select(`
          *,
          project:projects(title, customer_id),
          assigned_user:profiles!planning_items_assigned_user_id_fkey(full_name)
        `)
        .order('project_date', { ascending: true })

      // Role-based filtering
      if (userRole === 'Installateur') {
        query = query.eq('assigned_user_id', user.id)
      }

      const { data: planning, error } = await query

      if (error) {
        console.error('Error fetching planning:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch planning',
          code: 'FETCH_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // If calendar format is requested
      if (pathParts.includes('calendar')) {
        const calendarEvents = planning?.map(item => ({
          id: item.id,
          title: item.project?.title || 'Planning Item',
          date: item.project_date,
          description: item.description,
          type: 'planning'
        })) || []

        return new Response(JSON.stringify({
          success: true,
          data: calendarEvents
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: planning || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /planning - Create new planning item
    if (req.method === 'POST' && planningId === 'planning') {
      const { project_id, assigned_user_id, project_date, description } = await req.json()

      if (!project_id || !assigned_user_id || !project_date) {
        return new Response(JSON.stringify({
          success: false,
          error: 'project_id, assigned_user_id, and project_date are required',
          code: 'MISSING_PARAMETERS'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Creating planning item for project: ${project_id}`)

      // Check if user has permission to create planning
      // Monteurs can only create planning for themselves
      if (userRole === 'Installateur' && assigned_user_id !== userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Monteurs can only create planning for themselves',
          code: 'PERMISSION_DENIED'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: planning, error } = await supabase
        .from('planning_items')
        .insert({
          project_id,
          assigned_user_id,
          project_date,
          description
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating planning:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to create planning item',
          code: 'CREATE_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: planning,
        message: 'Planning item created successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /planning/:id - Update planning item
    if (req.method === 'PUT' && planningId !== 'planning') {
      const { project_date, description, assigned_user_id } = await req.json()

      console.log(`Updating planning item: ${planningId}`)

      // Check if user has permission to update this planning item
      let checkQuery = supabase
        .from('planning_items')
        .select('assigned_user_id')
        .eq('id', planningId)

      const { data: existingPlanning } = await checkQuery.single()

      if (!existingPlanning) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Planning item not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Role-based access control
      if (userRole === 'Installateur' && existingPlanning.assigned_user_id !== user.id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions to update this planning item',
          code: 'PERMISSION_DENIED'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const updateData: any = {}
      if (project_date !== undefined) updateData.project_date = project_date
      if (description !== undefined) updateData.description = description
      if (assigned_user_id !== undefined && userRole !== 'Installateur') {
        updateData.assigned_user_id = assigned_user_id
      }

      const { error } = await supabase
        .from('planning_items')
        .update(updateData)
        .eq('id', planningId)

      if (error) {
        console.error('Error updating planning:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to update planning item',
          code: 'UPDATE_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Planning item updated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE /planning/:id - Delete planning item
    if (req.method === 'DELETE' && planningId !== 'planning') {
      console.log(`Deleting planning item: ${planningId}`)

      // Check if user has permission to delete this planning item
      if (userRole === 'Installateur') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions to delete planning',
          code: 'PERMISSION_DENIED'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error } = await supabase
        .from('planning_items')
        .delete()
        .eq('id', planningId)

      if (error) {
        console.error('Error deleting planning:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to delete planning item',
          code: 'DELETE_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Planning item deleted successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Invalid endpoint
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid endpoint',
      code: 'INVALID_ENDPOINT'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Catch-all error:', error.message || error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
      code: 'INTERNAL_ERROR'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})