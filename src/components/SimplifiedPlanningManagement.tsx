import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, Search, Filter } from "lucide-react";
import { usePlanningStore } from '@/hooks/usePlanningStore';
import { useRealUserStore } from '@/hooks/useRealUserStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function SimplifiedPlanningManagement() {
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [showProjectOverview, setShowProjectOverview] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstaller, setSelectedInstaller] = useState<string>('');

  const { 
    planningItems, 
    loading, 
    addPlanningItem,
  } = usePlanningStore();

  const { installers } = useRealUserStore();
  const { projects } = useCrmStore();

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
    setShowPlanningDialog(true);
  };

  const handlePlanningSubmit = async (planningData: any) => {
    try {
      await addPlanningItem({
        ...planningData,
        user_id: user?.id || '',
        status: 'Gepland'
      });

      toast({
        title: "✅ Planning toegevoegd!",
        description: `Planning is succesvol toegevoegd voor ${format(planningData.start_date, 'dd MMMM yyyy', { locale: nl })}.`,
      });
      
      setShowPlanningDialog(false);
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

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planning</h1>
          <p className="text-gray-600">Beheer projecten en planning</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showProjectOverview ? "default" : "outline"}
            onClick={() => setShowProjectOverview(!showProjectOverview)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Projecten
          </Button>
          <Button onClick={() => setShowPlanningDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Planning Toevoegen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Overview */}
        {showProjectOverview && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Te Plannen Projecten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Zoek projecten..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedDate(new Date(project.date || new Date()));
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calendar */}
        <div className={cn("lg:col-span-2", !showProjectOverview && "lg:col-span-3")}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Planning Kalender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                onDayClick={handleDateClick}
                className="rounded-md border"
                locale={nl}
                modifiers={{
                  hasEvents: (date) => getEventsForDate(date).length > 0
                }}
                modifiersStyles={{
                  hasEvents: {
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    borderRadius: '4px'
                  }
                }}
              />
              
              {/* Events for selected date */}
              {selectedDate && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">
                    Planning voor {format(selectedDate, 'dd MMMM yyyy', { locale: nl })}
                  </h4>
                  <div className="space-y-2">
                    {getEventsForDate(selectedDate).map((item) => (
                      <div key={item.id} className="p-2 bg-blue-50 rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-gray-600">
                              {item.start_time} - {item.end_time}
                            </p>
                          </div>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Planning Dialog */}
      <Sheet open={showPlanningDialog} onOpenChange={setShowPlanningDialog}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Planning Toevoegen</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input id="title" placeholder="Planning titel" />
            </div>
            
            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea id="description" placeholder="Beschrijving van de planning" />
            </div>
            
            <div>
              <Label htmlFor="installer">Monteur</Label>
              <Select onValueChange={setSelectedInstaller}>
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
              <Label htmlFor="location">Locatie</Label>
              <Input id="location" placeholder="Locatie" />
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
                    location: (document.getElementById('location') as HTMLInputElement)?.value || '',
                    assigned_user_id: selectedInstaller
                  };
                  handlePlanningSubmit(formData);
                }}
                className="flex-1"
              >
                Toevoegen
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

