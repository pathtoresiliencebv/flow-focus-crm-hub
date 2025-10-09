// Public Supabase client for non-authenticated routes
// Used for public quote/invoice views without auth requirements
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pvesgvkyiaqmsudmmtkc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjI5MjIsImV4cCI6MjA2NDAzODkyMn0.Z-0t4zz2WyTiLaUIRPZzwxx9YtDiEe457X6RgQOXmU8";

// Create client without auth persistence for public routes
// This prevents auth state changes from affecting public pages
export const publicSupabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

