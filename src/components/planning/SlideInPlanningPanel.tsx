import React, { useState, useEffect } from 'react';
import { X, User, CalendarIcon, Clock, Search, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Project {
  id: string;
  title: string;
  customer_name?: string;
  status: string;
  date?: string;
  assigned_user_id?: string;
}

interface Installer {
  id: string;
  full_name: string | null;
  email?: string;
}

interface SlideInPlanningPanelProps {
  projects: Project[];
  installers: Installer[];
  selectedDate?: Date;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    project_id: string;
    assigned_user_id: string;
    start_date: string;
    start_time: string;
    end_time: string;
    title: string;
    description: string;
  }) => Promise<void>;
}

export const SlideInPlanningPanel: React.FC<SlideInPlanningPanelProps> = ({
  projects,
  installers,
  selectedDate: initialDate,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedInstaller, setSelectedInstaller] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const projectsToSchedule = projects.filter(p => 
    p.status === 'te-plannen' || p.status === 'gepland'
  );

  const filteredProjects = projectsToSchedule.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedProject || !selectedInstaller || !selectedDate) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        project_id: selectedProject.id,
        assigned_user_id: selectedInstaller,
        start_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        title: `Project: ${selectedProject.title}`,
        description: `Planning voor ${selectedProject.customer_name || 'klant'}`
      });

      setSelectedProject(null);
      setSelectedInstaller('');
      setSearchTerm('');
      setStartTime('08:00');
      setEndTime('17:00');
      
      onClose();
    } catch (error) {
      console.error('Error scheduling project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'te-plannen': return 'bg-red-100 text-red-800 border-red-200';
      case 'gepland': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-in Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-[600px] bg-white shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        overflow-y-auto
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 shadow-lg z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Project Inplannen
              </h2>
              <p className="text-blue-100 mt-1 text-sm">
                Selecteer project, monteur en datum
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Selection */}
          <div>
            <Label className="text-base font-semibold">1. Selecteer Project</Label>
            <div className="mt-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoek project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-[250px] rounded-md border p-2">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Geen projecten gevonden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedProject?.id === project.id 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {project.title}
                        </div>
                        {project.customer_name && (
                          <div className="text-xs text-gray-600 mt-0.5 truncate">
                            {project.customer_name}
                          </div>
                        )}
                        {project.date && (
                          <div className="text-xs text-gray-500 mt-1">
                            📅 {project.date}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                          {project.status === 'te-plannen' ? 'Te plannen' : 'Gepland'}
                        </Badge>
                        {selectedProject?.id === project.id && (
                          <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Installer Selection */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              2. Selecteer Monteur
            </Label>
            <Select 
              value={selectedInstaller} 
              onValueChange={setSelectedInstaller}
              disabled={!selectedProject}
            >
              <SelectTrigger className="mt-2 h-11">
                <SelectValue placeholder="Kies een monteur..." />
              </SelectTrigger>
              <SelectContent>
                {installers.map((installer) => (
                  <SelectItem key={installer.id} value={installer.id}>
                    {installer.full_name || installer.email || 'Onbekend'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Date Selection */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              3. Selecteer Datum
            </Label>
            <div className="mt-2 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={!selectedProject || !selectedInstaller}
                locale={nl}
                className="rounded-md border shadow-sm"
              />
            </div>
          </div>

          <Separator />

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Start tijd
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!selectedProject || !selectedInstaller || !selectedDate}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Eind tijd
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!selectedProject || !selectedInstaller || !selectedDate}
                className="mt-1"
              />
            </div>
          </div>

          {/* Summary */}
          {selectedProject && selectedInstaller && selectedDate && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">📋 Samenvatting</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Project:</span>
                  <p className="font-medium">{selectedProject.title}</p>
                </div>
                <div>
                  <span className="text-gray-600">Monteur:</span>
                  <p className="font-medium">
                    {installers.find(i => i.id === selectedInstaller)?.full_name || 'Onbekend'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Datum & Tijd:</span>
                  <p className="font-medium">
                    {format(selectedDate, 'dd MMM yyyy', { locale: nl })} ({startTime} - {endTime})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white border-t p-6 shadow-lg">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedProject || !selectedInstaller || !selectedDate || isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Inplannen...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Inplannen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

