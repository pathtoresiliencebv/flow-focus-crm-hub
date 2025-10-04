
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekCalendar } from "./WeekCalendar";
import { SimplePlanningForm } from "./SimplePlanningForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Plus, User } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { usePlanningStore } from "@/hooks/usePlanningStore";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";

interface ProjectPlanningEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'appointment' | 'meeting' | 'other';
  description?: string;
  projectId: string;
}

interface ProjectPlanningProps {
  projectId: string;
  projectTitle: string;
}

export const ProjectPlanning = ({ projectId, projectTitle }: ProjectPlanningProps) => {
  const { planningItems, addPlanningItem, loading } = usePlanningStore();
  const { monteurs } = useUsers();
  const { toast } = useToast();
  const [planningDialogOpen, setPlanningDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Filter planning items for this project
  const projectPlanningItems = planningItems.filter(item => 
    item.project_id === projectId
  );

  const handleAddPlanning = (date: Date) => {
    setSelectedDate(date);
    setPlanningDialogOpen(true);
  };

  const handlePlanningSubmit = async (planningData: any) => {
    try {
      console.log('📅 Adding planning item:', planningData);
      
      if (!planningData.assignedUserId) {
        toast({
          title: "Monteur vereist",
          description: "Selecteer een monteur om de planning toe te voegen.",
          variant: "destructive",
        });
        return;
      }
      
      const result = await addPlanningItem({
        title: planningData.title,
        description: planningData.description,
        start_date: planningData.date,
        start_time: planningData.startTime,
        end_time: planningData.endTime,
        location: planningData.location || '',
        status: 'Gepland',
        project_id: projectId,
        assigned_user_id: planningData.assignedUserId,
        user_id: '' // Will be set by the hook
      });
      
      if (result) {
        toast({
          title: "Planning toegevoegd! ✓",
          description: "De planning is succesvol toegevoegd aan het project.",
        });
        setPlanningDialogOpen(false);
      }
    } catch (error: any) {
      console.error('❌ Error adding planning:', error);
      // Error toast is already shown by usePlanningStore
    }
  };

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
  };

  // Convert planning items to events format for calendar
  const projectEvents = projectPlanningItems.map(item => ({
    id: item.id,
    title: item.title,
    startTime: item.start_time,
    endTime: item.end_time,
    date: item.start_date,
    type: 'other' as const,
    description: item.description || '',
    projectId: projectId
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning voor {projectTitle}
          </CardTitle>
          <Button size="sm" onClick={() => handleAddPlanning(new Date())}>
            <Plus className="h-4 w-4 mr-2" />
            Planning toevoegen
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Planning laden...</p>
            </div>
          ) : projectPlanningItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Nog geen planning beschikbaar</h3>
              <p className="text-sm mb-4">Voeg planning toe om te beginnen met het inplannen van dit project.</p>
              <Button onClick={() => handleAddPlanning(new Date())}>
                <Plus className="h-4 w-4 mr-2" />
                Eerste planning toevoegen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {projectPlanningItems.map((item) => {
                  const assignedMonteur = monteurs.find(m => m.id === item.assigned_user_id);
                  
                  return (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.start_date), 'EEEE dd MMMM yyyy', { locale: nl })} 
                            {' • '}
                            {item.start_time} - {item.end_time}
                          </p>
                          {item.description && (
                            <p className="text-sm mt-2">{item.description}</p>
                          )}
                          {assignedMonteur && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{assignedMonteur.full_name || assignedMonteur.email}</span>
                            </div>
                          )}
                          {item.location && (
                            <p className="text-sm text-muted-foreground mt-1">📍 {item.location}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'Gepland' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'In uitvoering' ? 'bg-orange-100 text-orange-800' :
                          item.status === 'Voltooid' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kalenderweergave</CardTitle>
        </CardHeader>
        <CardContent>
          <WeekCalendar
            events={projectEvents}
            onEventClick={handleEventClick}
            onAddPlanning={handleAddPlanning}
            showCurrentTimeLine={true}
          />
        </CardContent>
      </Card>

      <Dialog open={planningDialogOpen} onOpenChange={setPlanningDialogOpen}>
        <DialogContent className="max-w-md">
          <SimplePlanningForm
            selectedDate={selectedDate}
            onClose={() => setPlanningDialogOpen(false)}
            onSubmit={handlePlanningSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
