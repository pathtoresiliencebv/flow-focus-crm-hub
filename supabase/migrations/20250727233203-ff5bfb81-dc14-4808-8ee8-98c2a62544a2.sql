-- Fix database security issues identified by linter

-- 1. Fix function search_path issues for all functions
ALTER FUNCTION public.generate_project_tasks_from_quote(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.auto_generate_project_tasks() SET search_path = '';
ALTER FUNCTION public.get_available_chat_users(uuid) SET search_path = '';
ALTER FUNCTION public.user_can_access_channel(uuid) SET search_path = '';
ALTER FUNCTION public.update_project_status_on_delivery() SET search_path = '';
ALTER FUNCTION public.start_project(uuid, uuid) SET search_path = '';

-- 2. Add RLS policies for tables that have RLS enabled but no policies
-- Check if conversation_insights needs RLS policies
ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;

-- Add policies for conversation_insights
CREATE POLICY "Users can view their own insights"
ON public.conversation_insights
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create insights"
ON public.conversation_insights
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own insights"
ON public.conversation_insights
FOR UPDATE
USING (user_id = auth.uid());

-- 3. Ensure proper RLS policies exist for all tables
-- Add missing policies if needed