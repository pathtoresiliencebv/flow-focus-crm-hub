import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🧪 SIMPLE TEST - START');
    
    // Step 1: Just return hello
    console.log('✅ Step 1: Function started');
    
    // Step 2: Try Deno.connectTls
    console.log('🔍 Step 2: Testing TLS connection to imap.hostnet.nl:993');
    
    const conn = await Deno.connectTls({
      hostname: 'imap.hostnet.nl',
      port: 993,
    });
    
    console.log('✅ Step 2: TLS connection successful!');
    
    // Step 3: Read greeting
    const buffer = new Uint8Array(1024);
    const bytesRead = await conn.read(buffer);
    const greeting = new TextDecoder().decode(buffer.subarray(0, bytesRead || 0));
    
    console.log('✅ Step 3: Greeting received:', greeting.substring(0, 100));
    
    conn.close();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'IMAP connection test successful!',
        greeting: greeting.substring(0, 200),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ TEST ERROR:', error);
    console.error('Stack:', error.stack);
    console.error('Message:', error.message);
    console.error('Name:', error.name);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        name: error.name,
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

