import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
const isRateLimited = (ip: string, limit = 100, windowMs = 60000): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (userLimit.count >= limit) {
    return true;
  }
  
  userLimit.count++;
  return false;
};

// Input validation and sanitization
const validateAndSanitizeInput = (data: any, method: string) => {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Invalid request body');
    return { isValid: false, errors, data: null };
  }
  
  // Check for required fields on POST
  if (method === 'POST') {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }
    if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
      errors.push('Valid email is required');
    }
  }
  
  // Sanitize and validate string inputs
  const sanitizedData: any = {};
  
  if (data.name) {
    sanitizedData.name = data.name.toString().trim().slice(0, 255);
    if (sanitizedData.name.length === 0) {
      errors.push('Name cannot be empty');
    }
  }
  
  if (data.email) {
    sanitizedData.email = data.email.toString().trim().slice(0, 255).toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      errors.push('Invalid email format');
    }
  }
  
  if (data.phone) {
    sanitizedData.phone = data.phone.toString().trim().slice(0, 50);
  }
  
  if (data.address) {
    sanitizedData.address = data.address.toString().trim().slice(0, 500);
  }
  
  if (data.company) {
    sanitizedData.company = data.company.toString().trim().slice(0, 255);
  }
  
  return { isValid: errors.length === 0, errors, data: sanitizedData };
};

// UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting based on IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(clientIP)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization') || '' } 
        } 
      }
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse URL and extract customer ID
    const url = new URL(req.url);
    const pathParts = url.pathname.replace(/\/$/, "").split('/');
    const customerId = pathParts[pathParts.length - 1] === 'customers-mobile' ? null : pathParts[pathParts.length - 1];

    // Validate customer ID format if provided
    if (customerId && !isValidUUID(customerId)) {
      return new Response(JSON.stringify({ error: 'Invalid customer ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (req.method) {
      case 'GET': {
        if (customerId) {
          // Get single customer - RLS ensures user can only access their own data
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();
            
          if (error) {
            return new Response(JSON.stringify({ error: 'Customer not found or access denied' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          return new Response(JSON.stringify(data), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        } else {
          // Get all customers - RLS ensures user can only access their own data
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) {
            return new Response(JSON.stringify({ error: 'Failed to fetch customers' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          return new Response(JSON.stringify(data || []), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      }
      
      case 'POST': {
        const requestBody = await req.json();
        const validation = validateAndSanitizeInput(requestBody, 'POST');
        
        if (!validation.isValid) {
          return new Response(JSON.stringify({ error: validation.errors }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Add user_id to ensure proper ownership
        const customerData = { ...validation.data, user_id: user.id };
        
        const { data, error } = await supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single();
          
        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify(data), { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      case 'PUT': {
        if (!customerId) {
          return new Response(JSON.stringify({ error: 'Customer ID required' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        const requestBody = await req.json();
        const validation = validateAndSanitizeInput(requestBody, 'PUT');
        
        if (!validation.isValid) {
          return new Response(JSON.stringify({ error: validation.errors }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Don't allow user_id to be modified
        const { user_id, ...updateData } = validation.data;
        
        const { data, error } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', customerId)
          .select()
          .single();
          
        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to update customer or access denied' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      case 'DELETE': {
        if (!customerId) {
          return new Response(JSON.stringify({ error: 'Customer ID required' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', customerId);
          
        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to delete customer or access denied' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify({ success: true }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      default:
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Customer API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});