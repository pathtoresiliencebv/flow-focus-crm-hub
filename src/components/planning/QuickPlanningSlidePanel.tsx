import React from 'react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationMapInput } from '@/components/LocationMapInput';

interface QuickPlanningData {
  installer: string;
  project: string;
  description: string;
}

interface QuickPlanningSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  installers: Array<{ id: string; full_name: string }>;
  projects: Array<{ id: string; title: string }>;
  quickPlanningData: QuickPlanningData;
  location: string;
  onLocationChange: (location: string) => void;
}

export const QuickPlanningSlidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  installers,
  projects,
  quickPlanningData,
  location,
  onLocationChange,
}: QuickPlanningSlidePanelProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit(formData);
  };

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Snelle Planning"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="installer">Installateur</Label>
          <Select name="installer" defaultValue={quickPlanningData.installer}>
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
          <Select name="project" defaultValue={quickPlanningData.project}>
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
            defaultValue={quickPlanningData.description}
            placeholder="Beschrijving van de planning..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
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