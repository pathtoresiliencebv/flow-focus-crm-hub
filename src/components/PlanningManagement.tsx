
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Users, Clock, MapPin } from "lucide-react";
import { SimplePlanningForm } from './SimplePlanningForm';
import { PlanningCalendarView } from './planning/PlanningCalendarView';
import { PlanningListView } from './planning/PlanningListView';
import { NewPlanningDialog } from './planning/NewPlanningDialog';
import { QuickPlanningDialog } from './planning/QuickPlanningDialog';
import { MultiDayPlanningDialog } from './planning/MultiDayPlanningDialog';
import { usePlanningStore } from '@/hooks/usePlanningStore';
import { useUserStore } from '@/hooks/useUserStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';

export function PlanningManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showNewPlanning, setShowNewPlanning] = useState(false);
  const [showQuickPlanning, setShowQuickPlanning] = useState(false);
  const [showMultiDayPlanning, setShowMultiDayPlanning] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [location, setLocation] = useState('');
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

  const { users } = useUserStore();
  const { projects } = useCrmStore();

  // Get installers (users with installer role)
  const installers = users.filter(user => 
    user.role === 'Installateur' || user.role === 'Administrator'
  );

  const handleQuickPlanning = async (formData: FormData) => {
    try {
      const data = {
        assigned_user_id: formData.get('employee') as string,
        project_id: formData.get('project') as string,
        title: formData.get('description') as string,
        description: formData.get('description') as string,
        start_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_time: selectedHour ? `${selectedHour}:00` : '09:00',
        end_time: selectedHour ? `${selectedHour + 1}:00` : '10:00',
        location: location,
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
      setLocation('');
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
      const data = {
        assigned_user_id: formData.get('employee') as string,
        project_id: formData.get('project') as string,
        title: formData.get('description') as string,
        description: formData.get('description') as string,
        start_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_time: formData.get('time') as string || '09:00',
        end_time: formData.get('time') as string || '10:00',
        location: location,
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
      setLocation('');
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
      const data = {
        assigned_user_id: formData.get('employee') as string,
        project_id: formData.get('project') as string,
        title: formData.get('description') as string,
        description: formData.get('description') as string,
        start_date: startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_time: formData.get('time') as string || '09:00',
        end_time: formData.get('time') as string || '10:00',
        location: location,
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
      setLocation('');
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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Planning Beheer</h2>
          <p className="text-muted-foreground">Beheer afspraken en werkplanning</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setShowQuickPlanning(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Snelle Planning
          </Button>
          
          <Button 
            onClick={() => setShowNewPlanning(true)}
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Nieuwe Planning
          </Button>
          
          <Button 
            onClick={() => setShowMultiDayPlanning(true)}
            size="sm"
            variant="outline"
          >
            <Clock className="h-4 w-4 mr-2" />
            Meerdaagse Planning
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Zoek planning..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(null)}
          >
            Alle
          </Button>
          <Button
            variant={filterStatus === "Gepland" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("Gepland")}
          >
            Gepland
          </Button>
          <Button
            variant={filterStatus === "In uitvoering" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("In uitvoering")}
          >
            Actief
          </Button>
          <Button
            variant={filterStatus === "Afgerond" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("Afgerond")}
          >
            Afgerond
          </Button>
        </div>
      </div>

      {/* View Toggle and Content */}
      <Tabs value={view} onValueChange={(value) => setView(value as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
          <TabsTrigger value="list">Lijst</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-4">
          <PlanningCalendarView
            calendarView="week"
            onCalendarViewChange={() => {}}
            events={calendarEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onEventCreate={handleEventCreate}
          />
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <PlanningListView
            planningItems={convertedPlanningItems}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <QuickPlanningDialog
        open={showQuickPlanning}
        onOpenChange={setShowQuickPlanning}
        onSubmit={handleQuickPlanning}
        installers={installers}
        projects={projects}
        quickPlanningData={quickPlanningData}
        location={location}
        onLocationChange={setLocation}
        onClose={() => {
          setShowQuickPlanning(false);
          setLocation('');
        }}
      />
      
      <NewPlanningDialog
        open={showNewPlanning}
        onOpenChange={setShowNewPlanning}
        onSubmit={handleNewPlanning}
        installers={installers}
        projects={projects}
        selectedDate={selectedDate}
        location={location}
        onLocationChange={setLocation}
      />
      
      <MultiDayPlanningDialog
        open={showMultiDayPlanning}
        onOpenChange={setShowMultiDayPlanning}
        onSubmit={handleMultiDayPlanning}
        installers={installers}
        projects={projects}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        location={location}
        onLocationChange={setLocation}
      />
    </div>
  );
}
