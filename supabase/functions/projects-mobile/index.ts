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
    const projectId = pathParts[pathParts.length - 1]

    // GET /projects - Get projects filtered by role
    if (req.method === 'GET' && !pathParts.includes('tasks') && pathParts[pathParts.length - 1] === 'projects') {
      console.log(`Fetching projects for user: ${user.id} with role: ${userRole}`)

      let query = supabase
        .from('projects')
        .select(`
          *,
          customer:customers(name, email, phone),
          quote:quotes(quote_number, total_amount)
        `)
        .order('created_at', { ascending: false })

      // Role-based filtering
      if (userRole === 'Installateur') {
        query = query.eq('assigned_to', user.id)
      }

      const { data: projects, error } = await query

      if (error) {
        console.error('Error fetching projects:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch projects',
          code: 'FETCH_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: projects || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /projects/:id - Get specific project with details
    if (req.method === 'GET' && !pathParts.includes('tasks') && projectId !== 'projects') {
      console.log(`Fetching project details for: ${projectId}`)

      let query = supabase
        .from('projects')
        .select(`
          *,
          customer:customers(*),
          quote:quotes(*),
          project_tasks(*),
          planning_items(*)
        `)
        .eq('id', projectId)

      // Role-based access control
      if (userRole === 'Installateur') {
        query = query.eq('assigned_to', user.id)
      }

      const { data: project, error } = await query.single()

      if (error) {
        console.error('Error fetching project:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Project not found or access denied',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: project
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /projects/:id/status - Update project status
    if (req.method === 'PUT' && pathParts.includes('status')) {
      const projectId = pathParts[pathParts.length - 2]
      const { status } = await req.json()

      if (!status) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Status is required',
          code: 'MISSING_PARAMETER'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Updating project ${projectId} status to: ${status}`)

      let query = supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId)

      // Role-based access control
      if (userRole === 'Installateur') {
        query = query.eq('assigned_to', user.id)
      }

      const { error } = await query

      if (error) {
        console.error('Error updating project status:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to update project status',
          code: 'UPDATE_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Project status updated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /projects/:id/tasks - Get project tasks
    if (req.method === 'GET' && pathParts.includes('tasks')) {
      const projectId = pathParts[pathParts.length - 2]
      
      console.log(`Fetching tasks for project: ${projectId}`)

      // Check if user has access to this project
      let projectQuery = supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)

      if (userRole === 'Installateur') {
        projectQuery = projectQuery.eq('assigned_to', user.id)
      }

      const { data: projectAccess } = await projectQuery.single()

      if (!projectAccess) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Project not found or access denied',
          code: 'ACCESS_DENIED'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: tasks, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Error fetching tasks:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch tasks',
          code: 'FETCH_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: tasks || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /projects/:id/tasks/:taskId - Update task status
    if (req.method === 'PUT' && pathParts.includes('tasks') && pathParts.length >= 4) {
      const projectId = pathParts[pathParts.length - 3]
      const taskId = pathParts[pathParts.length - 1]
      const { status, completed_at } = await req.json()

      console.log(`Updating task ${taskId} in project ${projectId}`)

      // Check if user has access to this project
      let projectQuery = supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)

      if (userRole === 'Installateur') {
        projectQuery = projectQuery.eq('assigned_to', user.id)
      }

      const { data: projectAccess } = await projectQuery.single()

      if (!projectAccess) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Project not found or access denied',
          code: 'ACCESS_DENIED'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const updateData: any = {}
      if (status !== undefined) updateData.status = status
      if (completed_at !== undefined) updateData.completed_at = completed_at

      const { error } = await supabase
        .from('project_tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('project_id', projectId)

      if (error) {
        console.error('Error updating task:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to update task',
          code: 'UPDATE_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Task updated successfully'
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