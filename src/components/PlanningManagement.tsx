
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Users, Clock, MapPin } from "lucide-react";
import { PlanningCalendarView } from './planning/PlanningCalendarView';
import { TeamPlanningView } from './planning/TeamPlanningView';
import { PlanningListView } from './planning/PlanningListView';
import { QuickPlanningSlidePanel } from './planning/QuickPlanningSlidePanel';
import { NewPlanningSlidePanel } from './planning/NewPlanningSlidePanel';
import { MultiDayPlanningSlidePanel } from './planning/MultiDayPlanningSlidePanel';
import { usePlanningStore } from '@/hooks/usePlanningStore';
import { useRealUserStore } from '@/hooks/useRealUserStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';

export function PlanningManagement() {
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const [view, setView] = useState<'team' | 'calendar' | 'list'>('team');
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'day'>('week');
  const [showNewPlanning, setShowNewPlanning] = useState(false);
  const [showQuickPlanning, setShowQuickPlanning] = useState(false);
  const [showMultiDayPlanning, setShowMultiDayPlanning] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [quickPlanningLocation, setQuickPlanningLocation] = useState('');
  const [newPlanningLocation, setNewPlanningLocation] = useState('');
  const [multiDayLocation, setMultiDayLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { 
    planningItems, 
    loading, 
    addPlanningItem, 
    updatePlanningItem, 
    deletePlanningItem,
    fetchPlanningItems 
  } = usePlanningStore();

  const { installers } = useRealUserStore();
  const { projects } = useCrmStore();

  // Installers are now fetched from the hook

  const handleQuickPlanning = async (formData: FormData) => {
    try {
      const data = {
        assigned_user_id: formData.get('installer') as string,
        project_id: formData.get('project') as string,
        title: formData.get('description') as string || 'Snelle Planning',
        description: formData.get('description') as string,
        start_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_time: selectedHour ? `${selectedHour.toString().padStart(2, '0')}:00:00` : '09:00:00',
        end_time: selectedHour ? `${(selectedHour + 1).toString().padStart(2, '0')}:00:00` : '10:00:00',
        location: quickPlanningLocation,
        status: 'Gepland',
      };

      await addPlanningItem({
        ...data,
        user_id: user?.id || ''
      });

      toast({
        title: "Planning toegevoegd",
        description: "De planning is succesvol toegevoegd.",
      });
      setShowQuickPlanning(false);
      setQuickPlanningLocation('');
    } catch (error) {
      console.error('Error adding planning:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de planning.",
        variant: "destructive",
      });
    }
  };

  const handleNewPlanning = async (formData: FormData) => {
    try {
      const selectedTime = formData.get('startTime') as string || '09:00';
      const [hours, minutes] = selectedTime.split(':');
      const endHours = (parseInt(hours) + 1).toString().padStart(2, '0');
      
      const data = {
        assigned_user_id: formData.get('installer') as string,
        project_id: formData.get('project') as string,
        title: formData.get('description') as string || 'Nieuwe Planning',
        description: formData.get('description') as string,
        start_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_time: `${selectedTime}:00`,
        end_time: `${endHours}:${minutes}:00`,
        location: newPlanningLocation,
        status: 'Gepland',
      };

      await addPlanningItem({
        ...data,
        user_id: user?.id || ''
      });

      toast({
        title: "Planning toegevoegd",
        description: "De planning is succesvol toegevoegd.",
      });
      setShowNewPlanning(false);
      setNewPlanningLocation('');
    } catch (error) {
      console.error('Error adding planning:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de planning.",
        variant: "destructive",
      });
    }
  };

  const handleMultiDayPlanning = async (formData: FormData) => {
    try {
      const selectedTime = formData.get('time') as string || '09:00';
      const [hours, minutes] = selectedTime.split(':');
      const endHours = (parseInt(hours) + 1).toString().padStart(2, '0');
      
      const data = {
        assigned_user_id: formData.get('employee') as string,
        project_id: formData.get('project') as string,
        title: formData.get('description') as string,
        description: formData.get('description') as string,
        start_date: startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_time: `${selectedTime}:00`,
        end_time: `${endHours}:${minutes}:00`,
        location: multiDayLocation,
        status: 'Gepland',
      };

      await addPlanningItem({
        ...data,
        user_id: user?.id || ''
      });

      toast({
        title: "Meerdaagse planning toegevoegd",
        description: "De meerdaagse planning is succesvol toegevoegd.",
      });
      setShowMultiDayPlanning(false);
      setMultiDayLocation('');
    } catch (error) {
      console.error('Error adding multi-day planning:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de meerdaagse planning.",
        variant: "destructive",
      });
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedDate(date);
    setSelectedHour(hour);
    setShowQuickPlanning(true);
  };

  const handleEventClick = (event: any) => {
    // Implement logic to handle event click (e.g., open a modal to view/edit details)
    console.log('Event clicked:', event);
  };

  const handleEventCreate = (date: Date, startHour: number, endHour: number) => {
    // Implement logic to handle event creation (e.g., open a modal to create a new event)
    console.log('Event created:', date, startHour, endHour);
  };

  // Convert planning items to the format expected by list components (fix employeeId type)
  const convertedPlanningItems = planningItems.map(item => ({
    id: item.id,
    title: item.title,
    date: item.start_date,
    time: item.start_time,
    endTime: item.end_time,
    employee: item.assigned_user_id, // We'll need to map this to actual employee names
    employeeId: parseInt(item.assigned_user_id) || 0, // Convert string to number
    project: item.project_id || 'Geen project',
    projectId: item.project_id || '',
    status: item.status as "Gepland" | "Bevestigd" | "Afgerond" | "Geannuleerd",
    description: item.description || '',
    location: item.location || '',
    createdAt: item.created_at
  }));

  // Convert for calendar view
  const calendarEvents = planningItems.map(item => ({
    id: item.id,
    title: item.title,
    startTime: item.start_time,
    endTime: item.end_time,
    date: item.start_date,
    type: 'appointment' as const,
    description: item.description || ''
  }));

  // Create quick planning data for the dialog
  const quickPlanningData = selectedDate && selectedHour !== null ? {
    date: selectedDate,
    startHour: selectedHour,
    endHour: selectedHour + 1
  } : null;

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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Planning Beheer</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Beheer afspraken en werkplanning</p>
        </div>
        
        {hasPermission("planning_create") && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <Button 
              onClick={() => setShowQuickPlanning(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 touch-manipulation active:scale-95 transition-transform h-12 sm:h-auto"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Snelle Planning
            </Button>
            
            <Button 
              onClick={() => setShowNewPlanning(true)}
              size="sm"
              className="touch-manipulation active:scale-95 transition-transform h-12 sm:h-auto"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Nieuwe Planning
            </Button>
            
            <Button 
              onClick={() => setShowMultiDayPlanning(true)}
              size="sm"
              variant="outline"
              className="touch-manipulation active:scale-95 transition-transform h-12 sm:h-auto"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Clock className="h-4 w-4 mr-2" />
              Meerdaagse Planning
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Totaal Planning</p>
                <p className="text-xl font-bold">{planningItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Gepland</p>
                <p className="text-xl font-bold">
                  {planningItems.filter(item => item.status === 'Gepland').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">In Uitvoering</p>
                <p className="text-xl font-bold">
                  {planningItems.filter(item => item.status === 'In uitvoering').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Afgerond</p>
                <p className="text-xl font-bold">
                  {planningItems.filter(item => item.status === 'Afgerond').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters - Mobile optimized */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-4">
        <div className="flex-1">
          <Input
            placeholder="Zoek planning..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 sm:h-auto text-base sm:text-sm"
          />
        </div>
        
        <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(null)}
            className="text-xs sm:text-sm h-10 touch-manipulation active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Alle
          </Button>
          <Button
            variant={filterStatus === "Gepland" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("Gepland")}
            className="text-xs sm:text-sm h-10 touch-manipulation active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Gepland
          </Button>
          <Button
            variant={filterStatus === "In uitvoering" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("In uitvoering")}
            className="text-xs sm:text-sm h-10 touch-manipulation active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Actief
          </Button>
          <Button
            variant={filterStatus === "Afgerond" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("Afgerond")}
            className="text-xs sm:text-sm h-10 touch-manipulation active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Afgerond
          </Button>
        </div>
      </div>

      {/* View Toggle and Content */}
      <Tabs value={view} onValueChange={(value) => setView(value as 'team' | 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="team">Team Agenda</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
          <TabsTrigger value="list">Lijst</TabsTrigger>
        </TabsList>
        
        <TabsContent value="team" className="mt-4">
          <TeamPlanningView
            installers={installers.map(installer => ({
              id: installer.id!,
              name: installer.full_name || installer.email || 'Onbekend',
              color: `hsl(${Math.random() * 360}, 70%, 50%)`
            }))}
            events={calendarEvents.map(event => ({
              id: event.id,
              title: event.title,
              startTime: event.startTime,
              endTime: event.endTime,
              date: event.date,
              installerId: event.type === 'appointment' ? 'default-installer' : event.id,
              location: event.description || '',
              color: event.type === 'appointment' ? 'bg-blue-500' : 'bg-green-500'
            }))}
            onEventClick={handleEventClick}
            onTimeSlotClick={(date, hour, installerId) => {
              setSelectedDate(date);
              setSelectedHour(hour);
              setShowQuickPlanning(true);
            }}
          />
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-4">
          <PlanningCalendarView
            calendarView={calendarView}
            onCalendarViewChange={(newView) => {
              console.log('Calendar view changed to:', newView);
              setCalendarView(newView);
            }}
            events={calendarEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onEventCreate={(date, startHour, endHour) => {
              setSelectedDate(date);
              setSelectedHour(startHour);
              setShowQuickPlanning(true);
            }}
          />
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <PlanningListView
            planningItems={convertedPlanningItems}
          />
        </TabsContent>
      </Tabs>

      {/* Slide Panels */}
      <QuickPlanningSlidePanel
        isOpen={showQuickPlanning}
        onClose={() => {
          setShowQuickPlanning(false);
          setQuickPlanningLocation('');
        }}
        onSubmit={handleQuickPlanning}
        installers={installers}
        projects={projects}
        quickPlanningData={{
          installer: '',
          project: '',
          description: ''
        }}
        location={quickPlanningLocation}
        onLocationChange={setQuickPlanningLocation}
      />
      
      <NewPlanningSlidePanel
        isOpen={showNewPlanning}
        onClose={() => {
          setShowNewPlanning(false);
          setNewPlanningLocation('');
        }}
        onSubmit={handleNewPlanning}
        installers={installers}
        projects={projects}
        selectedDate={selectedDate}
        location={newPlanningLocation}
        onLocationChange={setNewPlanningLocation}
      />
      
      <MultiDayPlanningSlidePanel
        isOpen={showMultiDayPlanning}
        onClose={() => {
          setShowMultiDayPlanning(false);
          setMultiDayLocation('');
        }}
        onSubmit={handleMultiDayPlanning}
        installers={installers}
        projects={projects}
        startDate={startDate}
        endDate={endDate}
        onStartDateSelect={setStartDate}
        onEndDateSelect={setEndDate}
        location={multiDayLocation}
        onLocationChange={setMultiDayLocation}
      />
    </div>
  );
}
