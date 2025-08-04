import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  Users, 
  MessageCircle,
  Calendar,
  MapPin,
  ArrowRight,
  Plus,
  Bell,
  Camera,
  Phone,
  Mail
} from "lucide-react";
import { IOSNavigationBar, IOSNavigationBarConfigs } from './IOSNavigationBar';
import { IOSTabBar } from './IOSTabBar';
import { IOSActionSheet, useIOSActionSheet } from './IOSActionSheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  activeProjects: number;
  completedToday: number;
  pendingTasks: number;
  unreadMessages: number;
}

interface RecentProject {
  id: string;
  title: string;
  customer_name: string;
  address: string;
  status: string;
  priority: string;
  due_date?: string;
  customer_phone?: string;
  customer_email?: string;
}

export const IOSMobileDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    completedToday: 0,
    pendingTasks: 0,
    unreadMessages: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const actionSheet = useIOSActionSheet();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const [projectsResult, completionsResult, messagesResult] = await Promise.all([
        // Active projects
        supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .in('status', ['In Progress', 'Planning', 'On Hold']),
        
        // Completions today
        supabase
          .from('project_completions')
          .select('id', { count: 'exact' })
          .eq('completion_date', new Date().toISOString().split('T')[0]),
        
        // Unread messages (simplified)
        supabase
          .from('chat_messages')
          .select('id', { count: 'exact' })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        activeProjects: projectsResult.count || 0,
        completedToday: completionsResult.count || 0,
        pendingTasks: 0, // Would need tasks table
        unreadMessages: messagesResult.count || 0,
      });

      // Load recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          customer_name,
          address,
          status,
          priority,
          due_date,
          customer_phone,
          customer_email
        `)
        .in('status', ['In Progress', 'Planning', 'On Hold'])
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentProjects(projects || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = () => {
    actionSheet.showActionSheet({
      title: 'Quick Actions',
      options: [
        {
          label: 'New Project',
          icon: <Plus className="h-5 w-5" />,
          onClick: () => {
            // Navigate to new project
            console.log('New project');
          },
        },
        {
          label: 'Take Project Photo',
          icon: <Camera className="h-5 w-5" />,
          onClick: () => {
            // Open camera
            console.log('Take photo');
          },
        },
        {
          label: 'Complete Project',
          icon: <CheckCircle className="h-5 w-5" />,
          onClick: () => {
            // Navigate to completion flow
            console.log('Complete project');
          },
        },
        {
          label: 'View Calendar',
          icon: <Calendar className="h-5 w-5" />,
          onClick: () => {
            setActiveTab('calendar');
          },
        },
      ],
    });
  };

  const handleProjectContact = (project: RecentProject) => {
    const contactOptions = [];
    
    if (project.customer_phone) {
      contactOptions.push({
        label: `Call ${project.customer_name}`,
        icon: <Phone className="h-5 w-5" />,
        onClick: () => {
          window.open(`tel:${project.customer_phone}`, '_system');
        },
      });
    }
    
    if (project.customer_email) {
      contactOptions.push({
        label: `Email ${project.customer_name}`,
        icon: <Mail className="h-5 w-5" />,
        onClick: () => {
          window.open(`mailto:${project.customer_email}`, '_system');
        },
      });
    }

    contactOptions.push({
      label: 'View Project Details',
      icon: <FolderOpen className="h-5 w-5" />,
      onClick: () => {
        console.log('View project:', project.id);
      },
    });

    actionSheet.showActionSheet({
      title: project.title,
      options: contactOptions,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'on hold': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const renderDashboard = () => (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <IOSNavigationBar
        title="Dashboard"
        rightButton={{
          icon: <Plus className="h-5 w-5" />,
          onClick: handleQuickAction,
        }}
        subtitle={`Welcome back, ${profile?.full_name || 'User'}`}
      />

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {stats.activeProjects}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <FolderOpen className="h-4 w-4" />
                Active Projects
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.completedToday}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Completed Today
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {stats.pendingTasks}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                Pending Tasks
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.unreadMessages}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <MessageCircle className="h-4 w-4" />
                New Messages
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('projects')}
                className="text-blue-600"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                // Loading skeleton
                [1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active projects</p>
                </div>
              ) : (
                recentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectContact(project)}
                    className="border border-gray-200 rounded-lg p-3 active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {project.title}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {project.customer_name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500 truncate">
                            {project.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-3">
                        <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        {project.priority && (
                          <div className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                            {project.priority} Priority
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1"
                onClick={() => console.log('New project')}
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm">New Project</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1"
                onClick={() => console.log('Take photo')}
              >
                <Camera className="h-5 w-5" />
                <span className="text-sm">Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1"
                onClick={() => setActiveTab('chat')}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">Messages</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1"
                onClick={() => setActiveTab('calendar')}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Calendar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'projects':
        return <div className="p-4">Projects view would go here</div>;
      case 'chat':
        return <div className="p-4">Chat view would go here</div>;
      case 'calendar':
        return <div className="p-4">Calendar view would go here</div>;
      case 'profile':
        return <div className="p-4">Profile view would go here</div>;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
      
      <IOSTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={stats.unreadMessages}
      />

      <IOSActionSheet
        isOpen={actionSheet.isOpen}
        onClose={actionSheet.hideActionSheet}
        title={actionSheet.config.title}
        options={actionSheet.config.options}
        cancelLabel={actionSheet.config.cancelLabel}
      />
    </div>
  );
};