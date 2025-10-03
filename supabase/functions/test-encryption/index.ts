/**
 * Test Encryption Edge Function
 * 
 * Tests if EMAIL_ENCRYPTION_KEY is properly configured
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encryptPassword, decryptPassword, validateEncryptionKey } from '../_shared/emailEncryption.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing encryption configuration...');

    // Step 1: Check if key is configured
    const keyStatus = await validateEncryptionKey();
    console.log('📊 Key validation:', keyStatus);

    if (!keyStatus.configured) {
      return new Response(
        JSON.stringify({
          success: false,
          step: 'configuration',
          error: 'EMAIL_ENCRYPTION_KEY not configured',
          details: keyStatus,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!keyStatus.working) {
      return new Response(
        JSON.stringify({
          success: false,
          step: 'validation',
          error: 'EMAIL_ENCRYPTION_KEY not working',
          details: keyStatus,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Test encryption with a sample password
    console.log('🔐 Testing encryption...');
    const testPassword = 'test-password-123!@#';
    const encrypted = await encryptPassword(testPassword);
    console.log('✅ Encryption successful, length:', encrypted.length);

    // Step 3: Test decryption
    console.log('🔓 Testing decryption...');
    const decrypted = await decryptPassword(encrypted);
    console.log('✅ Decryption successful');

    // Step 4: Verify they match
    const matches = testPassword === decrypted;
    console.log('🔍 Password match:', matches);

    if (!matches) {
      return new Response(
        JSON.stringify({
          success: false,
          step: 'verification',
          error: 'Decrypted password does not match original',
          expected: testPassword,
          received: decrypted,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Success!
    return new Response(
      JSON.stringify({
        success: true,
        message: '✅ Encryption is working correctly!',
        details: {
          keyConfigured: true,
          keyWorking: true,
          encryptionTested: true,
          decryptionTested: true,
          verificationPassed: true,
          encryptedFormat: encrypted,
          encryptedLength: encrypted.length,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Test failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        step: 'exception',
        error: error.message,
        stack: error.stack,
        type: error.constructor?.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

