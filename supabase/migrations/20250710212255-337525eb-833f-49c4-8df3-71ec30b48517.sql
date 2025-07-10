-- Create notification delivery logs table
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID,
  user_id UUID NOT NULL,
  delivery_method TEXT NOT NULL, -- 'push', 'email', 'sms', 'webhook'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'opened', 'clicked'
  endpoint TEXT,
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification queue table for scheduled notifications
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 1, -- 1=low, 2=normal, 3=high, 4=emergency
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed', 'cancelled'
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook endpoints table
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret_key TEXT,
  event_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real-time event logs table
CREATE TABLE IF NOT EXISTS public.realtime_event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  channel_id TEXT,
  event_data JSONB DEFAULT '{}',
  delivery_status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'acknowledged'
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_event_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_delivery_logs
CREATE POLICY "Users can view their own delivery logs" 
ON public.notification_delivery_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage delivery logs" 
ON public.notification_delivery_logs 
FOR ALL 
USING (true);

-- Create RLS policies for notification_queue
CREATE POLICY "Users can view their own queued notifications" 
ON public.notification_queue 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage notification queue" 
ON public.notification_queue 
FOR ALL 
USING (true);

-- Create RLS policies for webhook_endpoints
CREATE POLICY "Users can manage their own webhooks" 
ON public.webhook_endpoints 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for realtime_event_logs
CREATE POLICY "Users can view their own event logs" 
ON public.realtime_event_logs 
FOR SELECT 
USING (auth.uid() = user_id OR get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "System can manage event logs" 
ON public.realtime_event_logs 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_user_id ON public.notification_delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_status ON public.notification_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON public.notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user_id ON public.webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_event_logs_user_id ON public.realtime_event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_event_logs_channel_id ON public.realtime_event_logs(channel_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_notification_delivery_logs_updated_at
BEFORE UPDATE ON public.notification_delivery_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
BEFORE UPDATE ON public.notification_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at
BEFORE UPDATE ON public.webhook_endpoints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();