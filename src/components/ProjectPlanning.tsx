
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekCalendar } from "./WeekCalendar";
import { SimplePlanningForm } from "./SimplePlanningForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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
  const [events, setEvents] = useState<ProjectPlanningEvent[]>([
    {
      id: "1",
      title: `Voormeting - ${projectTitle}`,
      startTime: "09:00",
      endTime: "11:00",
      date: "2025-01-20",
      type: "appointment",
      description: "Opmeten voor kozijnvervangen",
      projectId
    },
    {
      id: "2",
      title: `Installatie - ${projectTitle}`,
      startTime: "08:00",
      endTime: "16:00",
      date: "2025-01-25",
      type: "other",
      description: "Installatie nieuwe kozijnen",
      projectId
    }
  ]);
  
  const [planningDialogOpen, setPlanningDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleAddPlanning = (date: Date) => {
    setSelectedDate(date);
    setPlanningDialogOpen(true);
  };

  const handlePlanningSubmit = (planningData: any) => {
    const newEvent: ProjectPlanningEvent = {
      id: Date.now().toString(),
      title: `${planningData.title} - ${projectTitle}`,
      startTime: planningData.startTime,
      endTime: planningData.endTime,
      date: planningData.date,
      type: 'other',
      description: planningData.description,
      projectId
    };
    
    setEvents(prev => [...prev, newEvent]);
    setPlanningDialogOpen(false);
  };

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
  };

  const projectEvents = events.filter(event => event.projectId === projectId);

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
          {projectEvents.length === 0 ? (
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
                {projectEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.date), 'EEEE dd MMMM yyyy', { locale: nl })} 
                          {' • '}
                          {event.startTime} - {event.endTime}
                        </p>
                        {event.description && (
                          <p className="text-sm mt-2">{event.description}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        event.type === 'appointment' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'meeting' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.type === 'appointment' ? 'Afspraak' :
                         event.type === 'meeting' ? 'Vergadering' : 'Werkzaamheden'}
                      </span>
                    </div>
                  </div>
                ))}
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
            onPlanningAdded={handlePlanningSubmit}
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
