-- Create push subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  subscription_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for push subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'push_subscriptions' 
    AND policyname = 'Users can manage their own push subscriptions'
  ) THEN
    CREATE POLICY "Users can manage their own push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Insert demo notifications for testing
INSERT INTO public.user_notifications (user_id, title, message, type)
SELECT 
  p.id,
  'Welkom bij het notificatiesysteem!',
  'Het enterprise notificatiesysteem is nu actief. Je kunt nu push notificaties, real-time updates en meer ontvangen.',
  'info'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_notifications 
  WHERE user_id = p.id 
  AND title = 'Welkom bij het notificatiesysteem!'
);