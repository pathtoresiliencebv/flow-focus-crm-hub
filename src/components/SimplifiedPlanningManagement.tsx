import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Users, CheckCircle2, Calendar as CalendarIcon, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { LocationSearch } from './LocationSearch';
import { CustomerPlanningDialog, type PlanningFormData } from './CustomerPlanningDialog';
import { MonteurAgendaCalendar } from './planning/MonteurAgendaCalendar';
import { EnhancedMonthPlanningView } from './planning/EnhancedMonthPlanningView';
import { DurationSelector } from './planning/DurationSelector';
import { ConflictOverrideDialog } from './planning/ConflictOverrideDialog';
import { usePlanningStore } from '@/hooks/usePlanningStore';
import { useRealUserStore } from '@/hooks/useRealUserStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  checkTimeConflict,
  addMinutesToTime,
  type DayAvailability,
  type TimeConflict,
} from '@/utils/monteurAvailabilityService';

export interface SimplifiedPlanningManagementProps {
  viewMode?: 'month' | 'availability';
  showCustomerDialog?: boolean;
  onCloseCustomerDialog?: () => void;
}

export function SimplifiedPlanningManagement({
  viewMode = 'month',
  showCustomerDialog = false,
  onCloseCustomerDialog,
}: SimplifiedPlanningManagementProps = {}) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedMonteur, setSelectedMonteur] = useState<string>(''); // Primary monteur
  const [additionalMonteurs, setAdditionalMonteurs] = useState<string[]>([]); // Extra monteurs
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(240); // Default 4 hours
  const [calculatedTimes, setCalculatedTimes] = useState<{
    startTime: string;
    endTime: string;
  }>({ startTime: '08:00:00', endTime: '12:00:00' });
  const [detectedConflicts, setDetectedConflicts] = useState<TimeConflict[]>([]);
  const [pendingPlanningData, setPendingPlanningData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationKey, setLocationKey] = useState(0);
  const [dayAvailability, setDayAvailability] = useState<DayAvailability | null>(null);
  const [selectedPlanning, setSelectedPlanning] = useState<any>(null);

  const { 
    planningItems, 
    loading, 
    addPlanningItem,
    addPlanningWithParticipants,
  } = usePlanningStore();

  const { installers } = useRealUserStore();
  const { projects, customers } = useCrmStore();

  // Optimize: Memoize filtered projects to reduce re-renders
  const projectsToSchedule = React.useMemo(() => 
    projects.filter(p => p.status === 'te-plannen'),
    [projects]
  );
  
  const filteredProjects = React.useMemo(() => 
    projectsToSchedule.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [projectsToSchedule, searchTerm]
  );


  // Get monteur IDs for calendar
  const monteurIds = installers.map(m => m.id);

  // Handle day click from calendar
  const handleDayClick = (monteurId: string, date: Date, availability: DayAvailability) => {
    console.log('Day clicked:', { monteurId, date, availability });
    setSelectedMonteur(monteurId);
    setSelectedDate(date);
    setDayAvailability(availability);
    setShowProjectSidebar(true);
  };

  // Handle duration change
  const handleDurationChange = (durationMinutes: number, meta?: any) => {
    setSelectedDuration(durationMinutes);
    
    // Auto-calculate times based on duration
    if (meta?.startTime && meta?.endTime) {
      // Day part selected (monteur) - use provided times
      setCalculatedTimes({
        startTime: meta.startTime,
        endTime: meta.endTime,
      });
    } else {
      // Admin hour selection - calculate end time from default start
      const startTime = dayAvailability?.workHours?.start || '08:00:00';
      const endTime = addMinutesToTime(startTime, durationMinutes);
      setCalculatedTimes({
        startTime,
        endTime,
      });
    }
  };

  // Handle customer planning submission
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

      if (formData.assigned_user_ids.length > 1) {
        await addPlanningWithParticipants(planningData, formData.assigned_user_ids);
      } else {
        await addPlanningItem(planningData);
      }

      toast({
        title: "✅ Planning toegevoegd!",
        description: `Planning voor ${formData.title} is succesvol aangemaakt.`,
      });

      onCloseCustomerDialog?.();
    } catch (error) {
      console.error('Error adding customer planning:', error);
      toast({
        title: "❌ Fout bij toevoegen planning",
        description: "Er ging iets mis bij het aanmaken van de planning.",
        variant: "destructive",
      });
    }
  };

  // Handle planning submission with conflict detection
  const handlePlanningSubmit = async () => {
    console.log('🚀 handlePlanningSubmit called!');
    console.log('📋 Current state:', {
      selectedDate,
      selectedMonteur,
      selectedDuration,
      selectedLocation,
      calculatedTimes
    });
    
    if (!selectedDate || !selectedMonteur) {
      console.error('❌ Missing required fields:', { selectedDate, selectedMonteur });
      toast({
        title: "Ontbrekende gegevens",
        description: "Selecteer een datum en monteur.",
        variant: "destructive",
      });
      return;
    }

    const titleInput = document.getElementById('title') as HTMLInputElement;
    const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
    
    console.log('📝 Form elements:', {
      titleInput,
      titleValue: titleInput?.value,
      descriptionInput,
      descriptionValue: descriptionInput?.value,
      selectedLocation
    });

    const title = titleInput?.value || 'Planning';
    const description = descriptionInput?.value || '';
    const location = selectedLocation?.display_name || '';

    const planningData = {
      title,
      description,
      start_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: calculatedTimes.startTime,
      end_time: calculatedTimes.endTime,
      location,
      assigned_user_id: selectedMonteur,
      user_id: user?.id || '',
      status: 'Gepland',
      project_id: selectedProject?.id || null,
      expected_duration_minutes: selectedDuration,
    };

    console.log('📦 Planning data created:', planningData);

    // Check for conflicts
    const existingBookings = planningItems.filter(
      (item) =>
        item.assigned_user_id === selectedMonteur &&
        item.start_date === planningData.start_date
    );

    console.log('📅 Checking conflicts. Existing bookings:', existingBookings.length);

    const conflicts = checkTimeConflict(
      existingBookings,
      calculatedTimes.startTime,
      calculatedTimes.endTime
    );

    console.log('⚠️ Conflicts detected:', conflicts.length);

    if (conflicts.length > 0) {
      console.log('🚨 Showing conflict dialog for:', conflicts);
      // Show conflict dialog
      setDetectedConflicts(conflicts);
      setPendingPlanningData(planningData);
      setShowConflictDialog(true);
      return;
    }

    console.log('✅ No conflicts - proceeding to save');
    // No conflicts - save directly
    await savePlanning(planningData);
  };

  // Save planning (after conflict resolution or directly)
  const savePlanning = async (planningData: any) => {
    try {
      console.log('💾 Saving planning with data:', planningData);
      console.log('👥 Additional monteurs:', additionalMonteurs);
      
      // Step 1: Save main planning item
      const { data: savedPlanning, error: planningError } = await supabase
        .from('planning_items')
        .insert(planningData)
        .select()
        .single();

      if (planningError) {
        console.error('❌ Database error when saving planning:', {
          message: planningError.message,
          details: planningError.details,
          hint: planningError.hint,
          code: planningError.code,
          planningData
        });
        throw planningError;
      }
      
      console.log('✅ Planning saved successfully! ID:', savedPlanning.id);

      // Step 2: Save additional monteurs to planning_participants
      if (additionalMonteurs.length > 0) {
        console.log(`👥 Saving ${additionalMonteurs.length} additional monteurs...`);
        
        const participants = additionalMonteurs.map(userId => ({
          planning_id: savedPlanning.id,
          user_id: userId,
          role: 'monteur'
        }));

        const { error: participantsError } = await supabase
          .from('planning_participants')
          .insert(participants);

        if (participantsError) {
          console.error('⚠️ Error saving participants:', participantsError);
          // Don't fail completely, just log
        } else {
          console.log(`✅ Saved ${additionalMonteurs.length} additional monteurs`);
        }
      }

      toast({
        title: "✅ Planning toegevoegd!",
        description: additionalMonteurs.length > 0
          ? `Planning toegevoegd voor ${format(new Date(planningData.start_date), 'dd MMMM yyyy', { locale: nl })} met ${additionalMonteurs.length + 1} monteur(s).`
          : `Planning is succesvol toegevoegd voor ${format(new Date(planningData.start_date), 'dd MMMM yyyy', { locale: nl })}.`,
      });
      
      // Reset state
      setShowPlanningDialog(false);
      setShowProjectSidebar(false);
      setSelectedProject(null);
      setSelectedMonteur('');
      setAdditionalMonteurs([]); // ✅ Reset additional monteurs
      setSelectedLocation(null);
      setShowConflictDialog(false);
      setPendingPlanningData(null);
      setDetectedConflicts([]);
    } catch (error: any) {
      console.error('❌ Error in savePlanning:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack,
        planningData,
        additionalMonteurs
      });
      toast({
        title: "❌ Fout bij toevoegen planning",
        description: error?.message || "Er ging iets mis bij het toevoegen van de planning.",
        variant: "destructive",
      });
    }
  };

  // Handle conflict override
  const handleConflictOverride = async () => {
    if (pendingPlanningData) {
      await savePlanning(pendingPlanningData);
    }
  };

  const getMonteurName = (monteurId: string): string => {
    const monteur = installers.find((m) => m.id === monteurId);
    return monteur?.full_name || monteur?.email || 'Onbekend';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'te-plannen': return 'bg-red-100 text-red-800 border-red-200';
      case 'gepland': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' ? (
          <EnhancedMonthPlanningView
            planningItems={planningItems}
            users={installers}
            onDateClick={(date) => {
              setSelectedDate(date);
              setShowProjectSidebar(true);
            }}
            onPlanningClick={(planning) => {
              console.log('Planning item clicked:', planning);
              setSelectedPlanning(planning);
              
              // Check if project_id exists
              if (!planning.project_id) {
                console.warn('No project_id found in planning item');
                toast({
                  title: "Geen project gekoppeld",
                  description: "Deze planning heeft geen project gekoppeld.",
                });
                return;
              }
              
              // Verify project exists
              const projectExists = projects.find(p => p.id === planning.project_id);
              console.log('Project exists check:', projectExists ? 'Yes' : 'No');
              
              if (!projectExists) {
                toast({
                  title: "Project niet gevonden",
                  description: "Het gekoppelde project bestaat niet meer.",
                  variant: "destructive",
                });
                return;
              }
              
              // Navigate to project
              console.log('Navigating to project:', planning.project_id);
              try {
                navigate(`/projects/${planning.project_id}`);
              } catch (error) {
                console.error('Navigation error:', error);
                toast({
                  title: "Navigatie fout",
                  description: "Kon niet naar project navigeren.",
                  variant: "destructive",
                });
              }
            }}
            loading={loading}
          />
        ) : (
          <MonteurAgendaCalendar
            monteurIds={monteurIds}
            monteurs={installers}
            onDayClick={handleDayClick}
            loading={loading}
          />
        )}
      </div>

      {/* Project Sidebar - shown when clicking on a day */}
      <Sheet open={showProjectSidebar} onOpenChange={setShowProjectSidebar}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Planning Toevoegen - {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: nl }) : ''}
            </SheetTitle>
            <SheetDescription>
              Monteur: {getMonteurName(selectedMonteur)}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">📋 Te Plannen Projecten</h3>
              
              <Input
                placeholder="🔍 Zoek project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {filteredProjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">
                    Geen projecten gevonden om te plannen
                  </p>
                  <Button
                    onClick={() => {
                      setShowProjectSidebar(false);
                      setShowPlanningDialog(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Snelle Planning (Geen Project)
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedProject(project);
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

      {/* Planning Sheet - Add planning details */}
      <Sheet open={showPlanningDialog} onOpenChange={(open) => {
        setShowPlanningDialog(open);
        if (!open) {
          setSelectedProject(null);
          setSelectedLocation(null);
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Planning Details</SheetTitle>
            <SheetDescription>
              {selectedDate ? format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl }) : ''} - {getMonteurName(selectedMonteur)}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
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
                rows={3}
              />
            </div>

            {/* Date Picker */}
            <div>
              <Label>Datum *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl }) : 'Selecteer een datum'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      console.log('📅 Datum geselecteerd:', date);
                      setSelectedDate(date);
                    }}
                    locale={nl}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Monteur Selector - Multi-select */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="monteur">Hoofd Monteur *</Label>
                <Select 
                  value={selectedMonteur || 'none'} 
                  onValueChange={(value) => {
                    console.log('🔧 Hoofd monteur geselecteerd:', value);
                    if (value === 'none') {
                      setSelectedMonteur('');
                    } else {
                      setSelectedMonteur(value);
                      // Remove from additional monteurs if was selected there
                      setAdditionalMonteurs(prev => prev.filter(id => id !== value));
                    }
                  }}
                >
                  <SelectTrigger className={!selectedMonteur ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Selecteer hoofd monteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Selecteer hoofd monteur</SelectItem>
                    {installers.map((installer) => (
                      <SelectItem key={installer.id} value={installer.id}>
                        {installer.full_name || installer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedMonteur && (
                  <p className="text-xs text-red-500 mt-1">Selecteer een hoofd monteur</p>
                )}
              </div>

              {/* Additional Monteurs (Optional) */}
              {selectedMonteur && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Label className="text-sm font-medium text-blue-900 mb-2 block">
                    Extra Monteurs (Optioneel)
                  </Label>
                  <p className="text-xs text-blue-600 mb-2">
                    Selecteer extra monteurs die mee gaan. Deze planning verschijnt ook in hun agenda.
                  </p>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto">
                    {installers
                      .filter(installer => installer.id !== selectedMonteur)
                      .map((installer) => (
                        <label
                          key={installer.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={additionalMonteurs.includes(installer.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdditionalMonteurs(prev => [...prev, installer.id]);
                                console.log('➕ Extra monteur toegevoegd:', installer.full_name);
                              } else {
                                setAdditionalMonteurs(prev => prev.filter(id => id !== installer.id));
                                console.log('➖ Extra monteur verwijderd:', installer.full_name);
                              }
                            }}
                            className="rounded border-blue-300"
                          />
                          <span className="text-sm text-gray-700">
                            {installer.full_name || installer.email}
                          </span>
                        </label>
                      ))}
                  </div>
                  {additionalMonteurs.length > 0 && (
                    <p className="text-xs text-blue-700 mt-2 font-medium">
                      ✓ {additionalMonteurs.length} extra monteur{additionalMonteurs.length !== 1 ? 's' : ''} geselecteerd
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Duration Selector */}
            <DurationSelector
              userRole={profile?.role === 'Administrator' ? 'admin' : 'monteur'}
              value={selectedDuration}
              onChange={handleDurationChange}
              monteurWorkHours={dayAvailability?.workHours}
            />

            {/* Calculated Times (readonly display) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-blue-900">Geplande Tijden</Label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-blue-600">Start</p>
                  <p className="font-semibold text-blue-900">{calculatedTimes.startTime.slice(0, 5)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Eind</p>
                  <p className="font-semibold text-blue-900">{calculatedTimes.endTime.slice(0, 5)}</p>
                </div>
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
          </div>
          
          <SheetFooter className="mt-6">
            <Button 
              onClick={() => {
                console.log('🔴 Annuleren button clicked');
                setShowPlanningDialog(false);
              }}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Annuleren
            </Button>
            <Button 
              onClick={() => {
                console.log('🟢 Plannen button clicked!');
                handlePlanningSubmit();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Plannen
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Conflict Override Dialog */}
      <ConflictOverrideDialog
        open={showConflictDialog}
        conflicts={detectedConflicts}
        monteurName={getMonteurName(selectedMonteur)}
        date={selectedDate || new Date()}
        newPlanning={{
          startTime: calculatedTimes.startTime,
          endTime: calculatedTimes.endTime,
          title: pendingPlanningData?.title,
        }}
        onOverride={handleConflictOverride}
        onCancel={() => {
          setShowConflictDialog(false);
          setPendingPlanningData(null);
          setDetectedConflicts([]);
        }}
        onAdjustTime={() => {
          setShowConflictDialog(false);
          // Keep planning dialog open for adjustment
        }}
      />

      {/* Customer Planning Dialog */}
      <CustomerPlanningDialog
        open={showCustomerDialog}
        onOpenChange={(open) => !open && onCloseCustomerDialog?.()}
        onSubmit={handleCustomerPlanningSubmit}
        initialDate={selectedDate}
      />
    </div>
  );
}
