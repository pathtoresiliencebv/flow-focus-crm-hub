/**
 * OX MAIL API SYNC
 * 
 * Uses OX Mail REST API (Open-Xchange) instead of raw IMAP
 * Hostnet uses OX Mail - much better than raw IMAP parsing!
 * 
 * Benefits:
 * - JSON responses (no regex parsing)
 * - Attachments with download URLs
 * - Proper HTML + plain text
 * - Reliable and tested
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptPassword } from '../_shared/emailEncryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  accountId: string;
  maxMessages?: number;
}

interface OXSession {
  session: string;
  user: string;
}

/**
 * OX Mail API Client for Hostnet
 */
class OXMailClient {
  private baseUrl = 'https://webmail.hostnet.nl/ajax';
  private session: string | null = null;

  /**
   * Login to OX Mail and get session
   */
  async login(username: string, password: string): Promise<void> {
    console.log('🔐 OX Mail: Logging in as', username);
    
    const response = await fetch(`${this.baseUrl}/login?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: username,
        password: password,
      }),
    });

    if (!response.ok) {
      throw new Error(`OX login failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OX login error: ${data.error}`);
    }

    this.session = data.session;
    console.log('✅ OX Mail: Login successful, session:', this.session?.substring(0, 10));
  }

  /**
   * Fetch emails from a folder
   */
  async fetchEmails(folder: string = 'default0/INBOX', maxMessages: number = 200): Promise<any[]> {
    if (!this.session) throw new Error('Not logged in');

    console.log('📧 OX Mail: Fetching emails from', folder);

    const url = `${this.baseUrl}/mail?action=all&session=${this.session}&folder=${folder}&columns=600,601,602,603,604,605,607,608,610,611,614`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OX fetch failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`OX fetch error: ${data.error}`);
    }

    const emails = data.data || [];
    console.log(`✅ OX Mail: Fetched ${emails.length} emails`);

    // Transform OX format to our format
    return emails.slice(0, maxMessages).map((email: any) => ({
      id: `ox-${email[600]}`, // ID column
      uid: email[600],
      from_email: email[601] || 'unknown', // From
      to_email: email[602] ? [email[602]] : [], // To
      subject: email[603] || '(Geen onderwerp)', // Subject  
      date: email[604] ? new Date(email[604]).toISOString() : new Date().toISOString(), // Date
      body_text: email[607] || '', // Preview/snippet
      body_html: null, // Will fetch on demand
      attachments: email[614] === true ? [{ filename: 'bijlage' }] : null, // Has attachments flag
      status: (email[605] & 32) === 0 ? 'unread' : 'read', // Flags (32 = \\Seen)
      is_starred: (email[605] & 2) !== 0, // 2 = \\Flagged
      folder: 'inbox',
      received_at: email[604] ? new Date(email[604]).toISOString() : new Date().toISOString(),
      external_message_id: `ox:${email[600]}`,
    }));
  }

  /**
   * Logout from OX Mail
   */
  async logout(): Promise<void> {
    if (!this.session) return;

    try {
      await fetch(`${this.baseUrl}/login?action=logout&session=${this.session}`);
      console.log('👋 OX Mail: Logged out');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      this.session = null;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accountId, maxMessages = 200 }: SyncRequest = await req.json();

    // Get Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get account
    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    console.log('📧 Starting OX Mail sync for:', account.email_address);

    // Decrypt password
    const password = await decryptPassword(account.imap_password);

    // Connect to OX Mail API
    const ox = new OXMailClient();
    
    try {
      await ox.login(account.email_address, password);
      const messages = await ox.fetchEmails('default0/INBOX', maxMessages);
      await ox.logout();

      // Update account
      await supabaseClient
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          connection_status: 'connected',
          last_error: null,
        })
        .eq('id', accountId);

      console.log('✅ OX Mail sync completed:', messages.length, 'messages');

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully fetched ${messages.length} messages via OX API`,
          messages,
          messageCount: messages.length,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error: any) {
      console.error('❌ OX Mail sync error:', error);
      
      await supabaseClient
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          connection_status: 'error',
          last_error: error.message,
          last_error_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      throw error;
    } finally {
      await ox.logout();
    }
  } catch (error: any) {
    console.error('OX Mail sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
