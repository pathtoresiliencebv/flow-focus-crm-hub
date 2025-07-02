import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  templateName: string;
  variables: Record<string, any>;
  recipientEmail?: string;
  recipientName?: string;
  scheduleFor?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  template_type: 'email' | 'push' | 'system';
  subject_template?: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function replaceVariables(template: string, variables: Record<string, any>): string {
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    return variables[key] || match;
  });
}

async function processEmailNotification(
  template: NotificationTemplate,
  variables: Record<string, any>,
  recipientEmail: string,
  recipientName?: string,
  scheduleFor?: string
) {
  console.log('Processing email notification:', { template: template.name, recipientEmail });

  const subject = replaceVariables(template.subject_template || '', variables);
  const bodyHtml = replaceVariables(template.body_template, variables);
  
  // Queue the email for sending
  const { error: queueError } = await supabase
    .from('email_queue')
    .insert({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      template_id: template.id,
      subject,
      body_html: bodyHtml,
      template_variables: variables,
      scheduled_for: scheduleFor ? new Date(scheduleFor).toISOString() : new Date().toISOString(),
      status: 'pending'
    });

  if (queueError) {
    throw new Error(`Failed to queue email: ${queueError.message}`);
  }

  console.log('Email queued successfully');
}

async function processPushNotification(
  template: NotificationTemplate,
  variables: Record<string, any>,
  userId: string
) {
  console.log('Processing push notification:', { template: template.name, userId });

  const title = replaceVariables(template.subject_template || template.name, variables);
  const message = replaceVariables(template.body_template, variables);

  // Create user notification
  const { error: notificationError } = await supabase
    .from('user_notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type: 'info',
      reference_type: variables.reference_type,
      reference_id: variables.reference_id
    });

  if (notificationError) {
    throw new Error(`Failed to create notification: ${notificationError.message}`);
  }

  console.log('Push notification created successfully');
}

async function checkUserPreferences(userId: string, notificationType: string): Promise<boolean> {
  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !preferences) {
    console.log('No preferences found, using defaults');
    return true; // Default to allow notifications
  }

  // Check if user wants this type of notification
  switch (notificationType) {
    case 'email':
      return preferences.email_notifications;
    case 'push':
      return preferences.push_notifications || preferences.browser_notifications;
    case 'chat':
      return preferences.chat_notifications;
    case 'project':
      return preferences.project_notifications;
    case 'quote':
      return preferences.quote_notifications;
    default:
      return true;
  }
}

async function checkQuietHours(userId: string): Promise<boolean> {
  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select('quiet_hours_start, quiet_hours_end, weekend_notifications')
    .eq('user_id', userId)
    .single();

  if (error || !preferences) {
    return false; // No quiet hours configured
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Check weekend notifications
  if (!preferences.weekend_notifications && (currentDay === 0 || currentDay === 6)) {
    return true; // It's weekend and user doesn't want weekend notifications
  }

  // Check quiet hours
  const quietStart = preferences.quiet_hours_start;
  const quietEnd = preferences.quiet_hours_end;

  if (quietStart && quietEnd) {
    if (quietStart <= quietEnd) {
      // Same day quiet hours (e.g., 22:00 - 08:00 next day)
      return currentTime >= quietStart && currentTime <= quietEnd;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 08:00)
      return currentTime >= quietStart || currentTime <= quietEnd;
    }
  }

  return false;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, templateName, variables, recipientEmail, recipientName, scheduleFor }: NotificationRequest = await req.json();

    console.log('Processing notification request:', { userId, templateName });

    // Get the notification template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('name', templateName)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Check user preferences
    const notificationType = template.template_type;
    const allowNotification = await checkUserPreferences(userId, notificationType);

    if (!allowNotification) {
      console.log('Notification blocked by user preferences');
      return new Response(
        JSON.stringify({ message: 'Notification blocked by user preferences' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check quiet hours for push notifications
    if (notificationType === 'push' || notificationType === 'system') {
      const isQuietHours = await checkQuietHours(userId);
      if (isQuietHours) {
        console.log('Notification delayed due to quiet hours');
        // Schedule for after quiet hours - simplified to 8 AM next day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        scheduleFor = tomorrow.toISOString();
      }
    }

    // Process based on template type
    if (template.template_type === 'email') {
      const email = recipientEmail || variables.recipient_email;
      const name = recipientName || variables.recipient_name;
      
      if (!email) {
        throw new Error('Recipient email is required for email notifications');
      }

      await processEmailNotification(template, variables, email, name, scheduleFor);
    } else if (template.template_type === 'push' || template.template_type === 'system') {
      await processPushNotification(template, variables, userId);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notification processed successfully',
        template_type: template.template_type,
        scheduled: !!scheduleFor
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error processing notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);