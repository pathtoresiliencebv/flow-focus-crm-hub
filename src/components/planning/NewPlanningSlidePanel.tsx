import React from 'react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationMapInput } from '@/components/LocationMapInput';

interface NewPlanningSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  installers: Array<{ id: string; full_name: string }>;
  projects: Array<{ id: string; title: string }>;
  selectedDate: Date | null;
  location: string;
  onLocationChange: (location: string) => void;
}

export const NewPlanningSlidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  installers,
  projects,
  selectedDate,
  location,
  onLocationChange,
}: NewPlanningSlidePanelProps) => {
  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={handleClose}
      title="Nieuwe Planning"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="date">Datum</Label>
          <Input
            name="date"
            value={formatSelectedDate()}
            disabled
            className="bg-muted"
          />
        </div>

        <div>
          <Label htmlFor="startTime">Starttijd</Label>
          <Select name="startTime">
            <SelectTrigger>
              <SelectValue placeholder="Selecteer starttijd" />
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
            Planning Aanmaken
          </Button>
        </div>
      </form>
    </SlidePanel>
  );
};