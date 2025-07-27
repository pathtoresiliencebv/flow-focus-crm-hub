
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTimeRegistrations } from "@/hooks/useTimeRegistrations";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface TimeRegistrationFormProps {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  selectedStartHour: number;
  setSelectedStartHour: (hour: number) => void;
  selectedEndHour: number;
  setSelectedEndHour: (hour: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TimeRegistrationForm = ({
  selectedDate,
  setSelectedDate,
  selectedStartHour,
  setSelectedStartHour,
  selectedEndHour,
  setSelectedEndHour,
  onSubmit,
}: TimeRegistrationFormProps) => {
  const { projects, createTimeRegistration, isCreating } = useTimeRegistrations();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [hoursType, setHoursType] = useState<string>('billable');
  const [description, setDescription] = useState<string>('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedProject) {
      return;
    }

    const startTime = new Date(selectedDate);
    startTime.setHours(selectedStartHour, 0, 0, 0);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(selectedEndHour, 0, 0, 0);

    createTimeRegistration({
      project_id: selectedProject,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      hours_type: hoursType,
      description: description || undefined,
    });

    // Reset form
    setSelectedProject('');
    setHoursType('billable');
    setDescription('');
    onSubmit(e);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieuwe tijdsregistratie</CardTitle>
        <CardDescription>
          {selectedDate
            ? `Registreer je gewerkte uren voor ${format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl })}`
            : "Registreer je gewerkte uren"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Datum</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Starttijd</label>
                <Input
                  type="time"
                  className="mt-1"
                  value={`${selectedStartHour.toString().padStart(2, '0')}:00`}
                  onChange={(e) => {
                    const hour = parseInt(e.target.value.split(':')[0]);
                    if (!isNaN(hour)) setSelectedStartHour(hour);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Eindtijd</label>
                <Input
                  type="time"
                  className="mt-1"
                  value={`${selectedEndHour.toString().padStart(2, '0')}:00`}
                  onChange={(e) => {
                    const hour = parseInt(e.target.value.split(':')[0]);
                    if (!isNaN(hour)) setSelectedEndHour(hour);
                  }}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kies project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Type uren</label>
                <Select value={hoursType} onValueChange={setHoursType} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kies type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="billable">Factureerbaar</SelectItem>
                    <SelectItem value="non_billable">Intern</SelectItem>
                    <SelectItem value="overtime">Overwerk</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Beschrijving</label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1" 
                  placeholder="Beschrijf wat je hebt gedaan..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="mt-4" disabled={isCreating || !selectedProject}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? 'Bezig met registreren...' : 'Registreren'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
