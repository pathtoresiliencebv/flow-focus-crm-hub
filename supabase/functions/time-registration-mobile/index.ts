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
    const endpoint = pathParts[pathParts.length - 1]
    const registrationId = pathParts[pathParts.length - 1]

    // GET /registrations - Get time registrations
    if (req.method === 'GET' && endpoint === 'registrations') {
      console.log(`Fetching time registrations for user: ${user.id} with role: ${userRole}`)

      let query = supabase
        .from('time_registrations')
        .select(`
          *,
          project:projects(title, customer_id),
          user:profiles!time_registrations_user_id_fkey(full_name),
          approved_by_user:profiles!time_registrations_approved_by_fkey(full_name)
        `)
        .order('date', { ascending: false })

      // Role-based filtering
      if (userRole === 'Installateur') {
        query = query.eq('user_id', user.id)
      }

      const { data: registrations, error } = await query

      if (error) {
        console.error('Error fetching time registrations:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch time registrations',
          code: 'FETCH_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: registrations || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /registrations - Create new time registration
    if (req.method === 'POST' && endpoint === 'registrations') {
      const { project_id, date, hours, activity_type, description, travel_distance } = await req.json()

      if (!project_id || !date || !hours || !activity_type) {
        return new Response(JSON.stringify({
          success: false,
          error: 'project_id, date, hours, and activity_type are required',
          code: 'MISSING_PARAMETERS'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Creating time registration for user: ${user.id}`)

      const { data: registration, error } = await supabase
        .from('time_registrations')
        .insert({
          user_id: user.id,
          project_id,
          date,
          hours,
          activity_type,
          description,
          travel_distance
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating time registration:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to create time registration',
          code: 'CREATE_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        data: registration,
        message: 'Time registration created successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /registrations/:id/approval - Update approval status
    if (req.method === 'PUT' && pathParts.includes('approval')) {
      const registrationId = pathParts[pathParts.length - 2]
      const { is_approved, approval_notes } = await req.json()

      if (is_approved === undefined) {
        return new Response(JSON.stringify({
          success: false,
          error: 'is_approved is required',
          code: 'MISSING_PARAMETER'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Updating approval for registration: ${registrationId}`)

      // Check if user has permission to approve
      if (userRole === 'Installateur') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient permissions to approve time registrations',
          code: 'PERMISSION_DENIED'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const updateData: any = {
        is_approved,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      }

      if (approval_notes !== undefined) {
        updateData.approval_notes = approval_notes
      }

      const { error } = await supabase
        .from('time_registrations')
        .update(updateData)
        .eq('id', registrationId)

      if (error) {
        console.error('Error updating approval:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to update approval status',
          code: 'UPDATE_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Approval status updated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /projects - Get projects for dropdown
    if (req.method === 'GET' && endpoint === 'projects') {
      console.log(`Fetching projects for dropdown for user: ${user.id}`)

      let query = supabase
        .from('projects')
        .select('id, title, status')
        .in('status', ['in-uitvoering', 'in-planning'])
        .order('title', { ascending: true })

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

    // GET /statistics - Get statistics for current week
    if (req.method === 'GET' && endpoint === 'statistics') {
      console.log(`Fetching statistics for user: ${user.id}`)

      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
      endOfWeek.setHours(23, 59, 59, 999)

      let query = supabase
        .from('time_registrations')
        .select('hours, activity_type, date')
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0])

      // Role-based filtering
      if (userRole === 'Installateur') {
        query = query.eq('user_id', user.id)
      }

      const { data: registrations, error } = await query

      if (error) {
        console.error('Error fetching statistics:', error.message)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch statistics',
          code: 'FETCH_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const totalHours = registrations?.reduce((sum, reg) => sum + (reg.hours || 0), 0) || 0
      const workingDays = registrations?.filter(reg => reg.hours > 0).length || 0
      const averageHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0
      const billableHours = registrations?.filter(reg => reg.activity_type !== 'reistijd').reduce((sum, reg) => sum + (reg.hours || 0), 0) || 0

      const statistics = {
        totalHours,
        averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
        billableHours,
        workingDays,
        weekStart: startOfWeek.toISOString().split('T')[0],
        weekEnd: endOfWeek.toISOString().split('T')[0]
      }

      return new Response(JSON.stringify({
        success: true,
        data: statistics
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