-- Create push subscriptions table for enhanced PWA notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  subscription_data JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add notification preferences to existing notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS instant_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_schedule JSONB DEFAULT '{"enabled": false, "start": "09:00", "end": "18:00"}';

-- Create index for faster push subscription lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active 
ON public.push_subscriptions(user_id, is_active) 
WHERE is_active = true;

-- Create index for endpoint lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON public.push_subscriptions(endpoint);