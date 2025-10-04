import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, ListOrdered, Users } from "lucide-react";
import { EnhancedPlanningAgenda } from './planning/EnhancedPlanningAgenda';
import { SlideInPlanningPanel } from './planning/SlideInPlanningPanel';
import { usePlanningStore, PlanningItem } from '@/hooks/usePlanningStore';
import { useRealUserStore } from '@/hooks/useRealUserStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export function SimplifiedPlanningManagement() {
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const [showPlanningPanel, setShowPlanningPanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { 
    planningItems, 
    loading, 
    addPlanningItem,
  } = usePlanningStore();

  const { installers } = useRealUserStore();
  const { projects } = useCrmStore();

  // Convert planning items with installer names
  const eventsWithInstallers = planningItems.map(item => {
    const installer = installers.find(i => i.id === item.assigned_user_id);
    return {
      ...item,
      assigned_user_name: installer?.full_name || installer?.email || 'Onbekend'
    };
  });

  const handleDateClick = (date: Date, installerId?: string) => {
    setSelectedDate(date);
    setShowPlanningPanel(true);
  };

  const handleEventClick = (event: any) => {
    // Navigate to project if project_id exists
    if (event.project_id) {
      window.location.href = `/projects/${event.project_id}`;
    }
  };

  const handlePlanProject = async (data: {
    project_id: string;
    assigned_user_id: string;
    start_date: string;
    start_time: string;
    end_time: string;
    title: string;
    description: string;
  }) => {
    try {
      await addPlanningItem({
        ...data,
        user_id: user?.id || '',
        status: 'Gepland'
      });

      // Also update project status to 'gepland' and assign user
      const { updateProject } = useCrmStore.getState();
      await updateProject({
        id: data.project_id,
        status: 'gepland',
        assigned_user_id: data.assigned_user_id,
      });

      toast({
        title: "✅ Project ingepland!",
        description: `Project is succesvol ingepland voor ${format(new Date(data.start_date), 'dd MMMM yyyy', { locale: nl })}.`,
      });
    } catch (error) {
      console.error('Error planning project:', error);
      toast({
        title: "❌ Fout bij inplannen",
        description: "Er ging iets mis bij het inplannen van het project.",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Planning</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-smans-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Planning wordt geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Planning Overzicht
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Plan projecten direct in via de kalender
          </p>
        </div>
        
        {hasPermission("planning_create") && (
          <Button 
            onClick={() => setShowPlanningPanel(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            Project Inplannen
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Totaal Ingepland</p>
                <p className="text-2xl font-bold">{planningItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Actieve Monteurs</p>
                <p className="text-2xl font-bold">
                  {new Set(planningItems.map(item => item.assigned_user_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ListOrdered className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deze Week</p>
                <p className="text-2xl font-bold">
                  {planningItems.filter(item => {
                    const itemDate = new Date(item.start_date);
                    const now = new Date();
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1));
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 7);
                    return itemDate >= weekStart && itemDate < weekEnd;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Te Plannen</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'te-plannen').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      {hasPermission("planning_create") && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">💡 Hoe werkt het?</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>✓ Klik op een datum in de kalender of op "Project Inplannen"</li>
                <li>✓ Selecteer het project, monteur en datum in één overzicht</li>
                <li>✓ De monteur ziet alleen zijn ingeplande projecten op volgorde van datum</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Planning Agenda */}
      <EnhancedPlanningAgenda
        events={eventsWithInstallers}
        installers={installers}
        onEventClick={handleEventClick}
        onTimeSlotClick={handleDateClick}
      />

      {/* Recent Planning List */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Recente Planning</h3>
          {planningItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Nog geen projecten ingepland</p>
              <p className="text-xs text-gray-400 mt-1">Klik op "Project Inplannen" om te beginnen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {planningItems.slice(0, 5).map((item) => {
                const project = projects.find(p => p.id === item.project_id);
                const installer = installers.find(i => i.id === item.assigned_user_id);
                
                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.title}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {installer?.full_name || 'Onbekend'}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{format(new Date(item.start_date), 'dd MMM yyyy', { locale: nl })}</span>
                        <span className="mx-2">•</span>
                        <span>{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {item.status || 'Gepland'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slide-in Planning Panel */}
      <SlideInPlanningPanel
        projects={projects}
        installers={installers}
        selectedDate={selectedDate}
        isOpen={showPlanningPanel}
        onClose={() => {
          setShowPlanningPanel(false);
          setSelectedDate(undefined);
        }}
        onSubmit={handlePlanProject}
      />
    </div>
  );
}

