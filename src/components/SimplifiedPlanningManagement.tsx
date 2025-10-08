import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { LocationSearch } from './LocationSearch';
import { CustomerPlanningDialog, type PlanningFormData } from './CustomerPlanningDialog';
import { usePlanningStore } from '@/hooks/usePlanningStore';
import { useRealUserStore } from '@/hooks/useRealUserStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';

export function SimplifiedPlanningManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstaller, setSelectedInstaller] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locationKey, setLocationKey] = useState(0); // Key to force LocationSearch re-render
  // Simplified state - removed complex features for build stability

  const { 
    planningItems, 
    loading, 
    addPlanningItem,
    addPlanningWithParticipants,
  } = usePlanningStore();

  const { installers } = useRealUserStore();
  const { projects, customers } = useCrmStore();

  // Simplified component - removed complex features for build stability

  // Filter projects that need planning
  const projectsToSchedule = projects.filter(p => 
    p.status === 'te-plannen' || p.status === 'gepland'
  );

  const filteredProjects = projectsToSchedule.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowProjectSidebar(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleCustomerPlanningSubmit = async (formData: PlanningFormData) => {
    try {
      const planningData = {
        title: formData.title,
        description: formData.description,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        start_time: formData.start_time + ':00',
        end_time: formData.end_time + ':00',
        location: formData.location,
        user_id: user?.id || '',
        assigned_user_id: formData.assigned_user_ids[0] || user?.id || '',
        status: 'Gepland',
        planning_type: formData.planning_type,
        customer_id: formData.customer_id,
        project_id: formData.project_id,
        expected_duration_minutes: formData.expected_duration_minutes,
        team_size: formData.team_size,
        special_instructions: formData.special_instructions,
        notify_customer: formData.notify_customer,
        notify_sms: formData.notify_sms,
      };

      // Use the new function if multiple participants
      if (formData.assigned_user_ids.length > 1) {
        await addPlanningWithParticipants(planningData, formData.assigned_user_ids);
      } else {
        await addPlanningItem(planningData);
      }

      toast({
        title: "✅ Planning toegevoegd!",
        description: `Planning voor ${formData.title} is succesvol aangemaakt.`,
      });

      setShowCustomerDialog(false);
    } catch (error) {
      console.error('Error adding customer planning:', error);
      toast({
        title: "❌ Fout bij toevoegen planning",
        description: "Er ging iets mis bij het aanmaken van de planning.",
        variant: "destructive",
      });
    }
  };

  const handlePlanningSubmit = async (planningData: any) => {
    try {
      // Ensure all required fields are present
      const completeData = {
        title: planningData.title || 'Planning',
        description: planningData.description || '',
        start_date: planningData.start_date,
        start_time: planningData.start_time + ':00', // Add seconds if not present
        end_time: planningData.end_time + ':00', // Add seconds if not present
        location: planningData.location || '',
        assigned_user_id: planningData.assigned_user_id || user?.id || '',
        user_id: user?.id || '',
        status: 'Gepland',
        project_id: planningData.project_id || null
      };

      console.log('Submitting planning data:', completeData);

      await addPlanningItem(completeData);

      toast({
        title: "✅ Planning toegevoegd!",
        description: `Planning is succesvol toegevoegd voor ${format(new Date(planningData.start_date), 'dd MMMM yyyy', { locale: nl })}.`,
      });
      
      setShowPlanningDialog(false);
      setShowProjectSidebar(false);
      setSelectedProject(null);
      setSelectedInstaller('');
      setSelectedLocation(null);
    } catch (error) {
      console.error('Error adding planning:', error);
      toast({
        title: "❌ Fout bij toevoegen planning",
        description: "Er ging iets mis bij het toevoegen van de planning.",
        variant: "destructive",
      });
    }
  };

  const getEventsForDate = (date: Date) => {
    return planningItems.filter(item => 
      isSameDay(new Date(item.start_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'te-plannen': return 'bg-red-100 text-red-800 border-red-200';
      case 'gepland': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calendar month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {allDays.map((date, index) => {
          const events = getEventsForDate(date);
          const isToday = isSameDay(date, new Date());
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          
          return (
            <div
              key={index}
              className="min-h-[120px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 bg-white"
              onClick={() => handleDateClick(date)}
            >
              <div className="text-sm font-medium mb-1 text-gray-900">
                {date.getDate()}
              </div>
              
              {/* Events for this day */}
              <div className="space-y-1">
                {events.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className="text-xs p-1 rounded text-white truncate cursor-pointer bg-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{events.length - 3} meer
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Planning</h1>
          <Button onClick={() => setShowPlanningDialog(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Planning Toevoegen
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">{format(currentDate, 'MMMM yyyy', { locale: nl })}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="flex-1 overflow-auto p-4">
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {renderMonthView()}
          </CardContent>
        </Card>
      </div>

      {/* Footer Controls - Simplified */}
      <div className="bg-white border-t p-3 flex items-center justify-center">
        <div className="text-sm text-gray-600">
          Planning Kalender - Klik op een datum om te plannen
        </div>
      </div>

      {/* Project Sidebar - shown when clicking empty date */}
      <Sheet open={showProjectSidebar} onOpenChange={setShowProjectSidebar}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Planning Toevoegen - {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: nl }) : ''}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">📅 Snel Toevoegen</h3>
              
              <Button
                onClick={() => {
                  setShowProjectSidebar(false);
                  setShowCustomerDialog(true);
                }}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Nieuwe Klant Afspraak
              </Button>
              
              <Button
                onClick={() => {
                  setShowProjectSidebar(false);
                  setShowPlanningDialog(true);
                }}
                className="w-full justify-start"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Snelle Planning (Monteur)
              </Button>
            </div>

            <Separator />

            {/* Te Plannen Projecten */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">📋 Te Plannen Projecten</h3>
              
              <Input
                placeholder="🔍 Zoek project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-3"
              />

              {filteredProjects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Geen projecten gevonden om te plannen
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedProject(project);
                        setSelectedDate(new Date(project.date || new Date()));
                        setLocationKey(prev => prev + 1);
                        setShowProjectSidebar(false);
                        setShowPlanningDialog(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{project.title}</h4>
                          <p className="text-xs text-gray-600">{project.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            {project.date ? format(new Date(project.date), 'dd MMM yyyy', { locale: nl }) : 'Geen datum'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Planning Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Titel</Label>
                <p className="text-sm text-gray-600">{selectedEvent.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Beschrijving</Label>
                <p className="text-sm text-gray-600">{selectedEvent.description || 'Geen beschrijving'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Tijd</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.start_time}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Eind Tijd</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.end_time}</p>
                </div>
              </div>
              {selectedEvent.location && (
                <div>
                  <Label className="text-sm font-medium">Locatie</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant="outline">{selectedEvent.status}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Planning Dialog */}
      <Dialog open={showPlanningDialog} onOpenChange={(open) => {
        setShowPlanningDialog(open);
        if (!open) {
          setSelectedProject(null);
          setSelectedInstaller('');
          setSelectedLocation(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Planning Toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input 
                id="title" 
                placeholder="Planning titel" 
                defaultValue={selectedProject ? `Project: ${selectedProject.title}` : ''}
                key={selectedProject?.id || 'no-project'}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea 
                id="description" 
                placeholder="Beschrijving van de planning" 
                defaultValue={selectedProject?.description || ''}
                key={`desc-${selectedProject?.id || 'no-project'}`}
              />
            </div>
            
            <div>
              <Label htmlFor="installer">Monteur</Label>
              <Select 
                onValueChange={setSelectedInstaller}
                defaultValue={selectedProject?.assigned_user_id || ''}
                key={`installer-${selectedProject?.id || 'no-project'}`}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer monteur" />
                </SelectTrigger>
                <SelectContent>
                  {installers.map((installer) => (
                    <SelectItem key={installer.id} value={installer.id}>
                      {installer.full_name || installer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Tijd</Label>
                <Input id="startTime" type="time" defaultValue="08:00" />
              </div>
              <div>
                <Label htmlFor="endTime">Eind Tijd</Label>
                <Input id="endTime" type="time" defaultValue="17:00" />
              </div>
            </div>
            
            <div>
              <LocationSearch
                key={locationKey}
                initialValue={selectedProject && selectedProject.customer_id ? 
                  customers.find(c => c.id === selectedProject.customer_id)?.address || '' : ''
                }
                onLocationSelect={(location) => {
                  setSelectedLocation(location);
                }}
                placeholder="Zoek locatie..."
                label="Locatie"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => setShowPlanningDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button 
                onClick={() => {
                  const formData = {
                    title: (document.getElementById('title') as HTMLInputElement)?.value || 'Planning',
                    description: (document.getElementById('description') as HTMLInputElement)?.value || '',
                    start_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                    start_time: (document.getElementById('startTime') as HTMLInputElement)?.value || '08:00',
                    end_time: (document.getElementById('endTime') as HTMLInputElement)?.value || '17:00',
                    location: selectedLocation?.display_name || (document.getElementById('location') as HTMLInputElement)?.value || '',
                    assigned_user_id: selectedInstaller || selectedProject?.assigned_user_id,
                    project_id: selectedProject?.id || null
                  };
                  handlePlanningSubmit(formData);
                }}
                className="flex-1"
              >
                Toevoegen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Planning Dialog - NEW */}
      <CustomerPlanningDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onSubmit={handleCustomerPlanningSubmit}
        initialDate={selectedDate}
      />
    </div>
  );
}

