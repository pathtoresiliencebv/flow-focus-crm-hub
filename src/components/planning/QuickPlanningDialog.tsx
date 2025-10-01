import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationMapInput from "../LocationMapInput";
import { RealUser } from "@/hooks/useRealUserStore";
import { ProjectWithCustomerName } from "@/hooks/useCrmStore";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface QuickPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  installers: RealUser[];
  projects: ProjectWithCustomerName[];
  quickPlanningData: {
    date: Date;
    startHour: number;
    endHour: number;
  } | null;
  location: string;
  onLocationChange: (location: string) => void;
  onClose: () => void;
}

export const QuickPlanningDialog = ({
  open,
  onOpenChange,
  onSubmit,
  installers,
  projects,
  quickPlanningData,
  location,
  onLocationChange,
  onClose,
}: QuickPlanningDialogProps) => {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Snelle planning aanmaken</DialogTitle>
          <DialogDescription>
            {quickPlanningData && 
              `Planning voor ${format(quickPlanningData.date, 'EEEE dd MMMM yyyy', { locale: nl })} van ${quickPlanningData.startHour}:00 tot ${quickPlanningData.endHour}:00`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Monteur</label>
              <Select name="employee" required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Kies monteur" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {installers.map((installer) => (
                    <SelectItem key={installer.id} value={installer.id}>
                      {installer.full_name || installer.email || 'Naamloze Gebruiker'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Project</label>
              <Select name="project" required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Kies project" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title} - {project.customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Locatie</label>
            <div className="mt-1">
              <LocationMapInput
                value={location}
                onChange={onLocationChange}
                placeholder="Zoek adres of locatie..."
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Beschrijving</label>
            <Input name="description" className="mt-1" placeholder="Omschrijving van het werk" />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Annuleren
            </Button>
            <Button type="submit" className="bg-smans-primary hover:bg-smans-primary/90 text-white w-full sm:w-auto">Planning Aanmaken</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
