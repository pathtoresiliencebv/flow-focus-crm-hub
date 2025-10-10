import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, CheckCircle2, FileText, DollarSign, ClipboardCheck, Receipt, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface ProjectActivitiesProps {
  projectId: string;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata: any;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'planning_created':
      return <Calendar className="h-4 w-4 text-blue-600" />;
    case 'planning_removed':
      return <Calendar className="h-4 w-4 text-orange-600" />;
    case 'quote_approved':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'invoice_paid':
      return <DollarSign className="h-4 w-4 text-green-600" />;
    case 'project_completed':
      return <ClipboardCheck className="h-4 w-4 text-purple-600" />;
    case 'tasks_generated':
      return <FileText className="h-4 w-4 text-indigo-600" />;
    case 'workorder_added':
      return <Receipt className="h-4 w-4 text-blue-600" />;
    case 'receipt_added':
      return <Receipt className="h-4 w-4 text-orange-600" />;
    case 'task_completed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'status_changed':
      return <Activity className="h-4 w-4 text-gray-600" />;
    default:
      return <Activity className="h-4 w-4 text-gray-600" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'planning_created':
      return 'bg-blue-50 border-blue-200';
    case 'planning_removed':
      return 'bg-orange-50 border-orange-200';
    case 'quote_approved':
      return 'bg-green-50 border-green-200';
    case 'invoice_paid':
      return 'bg-green-50 border-green-200';
    case 'project_completed':
      return 'bg-purple-50 border-purple-200';
    case 'tasks_generated':
      return 'bg-indigo-50 border-indigo-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export const ProjectActivities: React.FC<ProjectActivitiesProps> = ({ projectId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      console.log('📊 ProjectActivities: Fetching activities for project:', projectId);
      
      try {
        const { data, error } = await supabase
          .from('project_activities')
          .select(`
            *,
            user:profiles!user_id(full_name, avatar_url)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('❌ Error fetching activities:', error);
          throw error;
        }

        console.log('✅ Fetched activities:', data?.length || 0);
        setActivities(data || []);
      } catch (error: any) {
        console.error('❌ Error in fetchActivities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`project_activities:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_activities',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('🔄 Realtime activity update:', payload);
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Activiteiten laden...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nog geen activiteiten</p>
            <p className="text-xs mt-1">Activiteiten zoals planning, goedkeuring en betalingen verschijnen hier.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activiteit
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            ({activities.length} {activities.length === 1 ? 'gebeurtenis' : 'gebeurtenissen'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex gap-3 p-3 rounded-lg border ${getActivityColor(activity.activity_type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.activity_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    
                    {activity.user?.full_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        door {activity.user.full_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.created_at), 'dd MMM HH:mm', { locale: nl })}
                  </div>
                </div>

                {/* Optional: Show metadata */}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {activity.metadata.task_count && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {activity.metadata.task_count} taken
                      </span>
                    )}
                    {activity.metadata.participants && Array.isArray(activity.metadata.participants) && (
                      <span className="inline-flex items-center gap-1 ml-3">
                        <Users className="h-3 w-3" />
                        {activity.metadata.participants.length} monteur(s)
                      </span>
                    )}
                    {activity.metadata.total_amount && (
                      <span className="inline-flex items-center gap-1 ml-3">
                        <DollarSign className="h-3 w-3" />
                        €{activity.metadata.total_amount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

