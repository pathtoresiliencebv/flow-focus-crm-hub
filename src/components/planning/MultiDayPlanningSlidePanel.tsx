import React from 'react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationMapInput } from '@/components/LocationMapInput';

interface MultiDayPlanningSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  installers: Array<{ id: string; full_name: string }>;
  projects: Array<{ id: string; title: string }>;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateSelect: (date: Date | undefined) => void;
  onEndDateSelect: (date: Date | undefined) => void;
  location: string;
  onLocationChange: (location: string) => void;
}

export const MultiDayPlanningSlidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  installers,
  projects,
  startDate,
  endDate,
  onStartDateSelect,
  onEndDateSelect,
  location,
  onLocationChange,
}: MultiDayPlanningSlidePanelProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit(formData);
  };

  const handleClose = () => {
    onLocationChange('');
    onClose();
  };

  // Generate time options
  const timeOptions = [];
  for (let hour = 7; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  const daysOfWeek = [
    { value: 'monday', label: 'Maandag' },
    { value: 'tuesday', label: 'Dinsdag' },
    { value: 'wednesday', label: 'Woensdag' },
    { value: 'thursday', label: 'Donderdag' },
    { value: 'friday', label: 'Vrijdag' },
    { value: 'saturday', label: 'Zaterdag' },
    { value: 'sunday', label: 'Zondag' },
  ];

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={handleClose}
      title="Meerdaagse Planning"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Startdatum</Label>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateSelect}
              className="rounded-md border"
            />
          </div>
          <div>
            <Label>Einddatum</Label>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateSelect}
              className="rounded-md border"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="time">Tijd</Label>
          <Select name="time">
            <SelectTrigger>
              <SelectValue placeholder="Selecteer tijd" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="installer">Installateur</Label>
          <Select name="installer">
            <SelectTrigger>
              <SelectValue placeholder="Selecteer installateur" />
            </SelectTrigger>
            <SelectContent>
              {installers.map((installer) => (
                <SelectItem key={installer.id} value={installer.id}>
                  {installer.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="project">Project</Label>
          <Select name="project">
            <SelectTrigger>
              <SelectValue placeholder="Selecteer project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Dagen van de week</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {daysOfWeek.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox id={day.value} name="daysOfWeek" value={day.value} />
                <Label htmlFor={day.value}>{day.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="location">Locatie</Label>
          <LocationMapInput
            value={location}
            onChange={onLocationChange}
            placeholder="Voer adres in..."
          />
        </div>

        <div>
          <Label htmlFor="description">Beschrijving</Label>
          <Input
            name="description"
            placeholder="Beschrijving van de planning..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit">
            Meerdaagse Planning Aanmaken
          </Button>
        </div>
      </form>
    </SlidePanel>
  );
};