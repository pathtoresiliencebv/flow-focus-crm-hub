import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  type: 'conversation' | 'user' | 'project' | 'system';
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year';
  filters?: {
    userIds?: string[];
    projectIds?: string[];
    languages?: string[];
  };
}

interface AnalyticsResponse {
  metrics: Record<string, number>;
  trends: Array<{ date: string; value: number }>;
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    recommendations: string[];
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, timeframe, filters }: AnalyticsRequest = await req.json();

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    let metrics: Record<string, number> = {};
    let trends: Array<{ date: string; value: number }> = [];
    let insights: Array<any> = [];

    if (type === 'conversation') {
      // Conversation analytics
      const { data: messages, error: messagesError } = await supabase
        .from('direct_messages')
        .select(`
          id,
          created_at,
          from_user_id,
          to_user_id,
          content,
          message_type,
          detected_language,
          translated_content
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (messagesError) {
        throw messagesError;
      }

      // Calculate basic metrics
      metrics = {
        totalMessages: messages?.length || 0,
        uniqueConversations: new Set(
          messages?.map(m => [m.from_user_id, m.to_user_id].sort().join('-'))
        ).size,
        averageMessageLength: messages?.reduce((sum, m) => sum + (m.content?.length || 0), 0) / (messages?.length || 1) || 0,
        translatedMessages: messages?.filter(m => m.translated_content).length || 0,
        voiceMessages: messages?.filter(m => m.message_type === 'voice').length || 0,
        fileMessages: messages?.filter(m => m.message_type === 'file').length || 0,
        imageMessages: messages?.filter(m => m.message_type === 'image').length || 0
      };

      // Generate trends (daily message counts)
      const dailyCounts = new Map<string, number>();
      messages?.forEach(message => {
        const date = message.created_at.split('T')[0];
        dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
      });

      trends = Array.from(dailyCounts.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Generate insights
      const translationRate = (metrics.translatedMessages / metrics.totalMessages) * 100;
      const voiceUsageRate = (metrics.voiceMessages / metrics.totalMessages) * 100;

      if (translationRate > 30) {
        insights.push({
          type: 'neutral',
          title: 'High Translation Usage',
          description: `${translationRate.toFixed(1)}% of messages required translation`,
          impact: 'medium',
          recommendations: [
            'Consider language training for team members',
            'Implement better language detection',
            'Create multilingual templates'
          ]
        });
      }

      if (voiceUsageRate > 20) {
        insights.push({
          type: 'positive',
          title: 'Strong Voice Communication',
          description: `${voiceUsageRate.toFixed(1)}% of messages are voice messages`,
          impact: 'low',
          recommendations: [
            'Voice communication shows engagement',
            'Consider improving voice quality settings'
          ]
        });
      }

      if (metrics.averageMessageLength < 20) {
        insights.push({
          type: 'negative',
          title: 'Short Message Length',
          description: `Average message length is only ${metrics.averageMessageLength.toFixed(1)} characters`,
          impact: 'medium',
          recommendations: [
            'Encourage more detailed communication',
            'Provide templates for common scenarios',
            'Consider if users need communication training'
          ]
        });
      }

    } else if (type === 'system') {
      // System-wide analytics
      const { data: allMessages, error: systemError } = await supabase
        .from('direct_messages')
        .select('id, created_at, message_type, detected_language')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (systemError) {
        throw systemError;
      }

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (usersError) {
        throw usersError;
      }

      metrics = {
        totalSystemMessages: allMessages?.length || 0,
        newUsers: users?.length || 0,
        averageMessagesPerDay: (allMessages?.length || 0) / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))),
        languageDistribution: allMessages?.reduce((acc: Record<string, number>, msg) => {
          const lang = msg.detected_language || 'unknown';
          acc[lang] = (acc[lang] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      // System health insights
      const messagesPerDay = metrics.averageMessagesPerDay;
      
      if (messagesPerDay > 100) {
        insights.push({
          type: 'positive',
          title: 'High System Activity',
          description: `${messagesPerDay.toFixed(1)} messages per day on average`,
          impact: 'low',
          recommendations: [
            'System is actively used',
            'Monitor performance for scaling needs'
          ]
        });
      } else if (messagesPerDay < 10) {
        insights.push({
          type: 'negative',
          title: 'Low System Usage',
          description: `Only ${messagesPerDay.toFixed(1)} messages per day on average`,
          impact: 'high',
          recommendations: [
            'Investigate user adoption barriers',
            'Provide additional training',
            'Consider feature improvements'
          ]
        });
      }
    }

    const response: AnalyticsResponse = {
      metrics,
      trends,
      insights
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      metrics: {},
      trends: [],
      insights: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});