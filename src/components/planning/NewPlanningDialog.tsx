import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationMapInput from "../LocationMapInput";
interface User {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string;
}
import { ProjectWithCustomerName } from "@/hooks/useCrmStore";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { generateTimeOptions } from "./utils";

const timeOptions = generateTimeOptions();

interface NewPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  installers: User[];
  projects: ProjectWithCustomerName[];
  selectedDate: Date | undefined;
  location: string;
  onLocationChange: (location: string) => void;
}

export const NewPlanningDialog = ({
  open,
  onOpenChange,
  onSubmit,
  installers,
  projects,
  selectedDate,
  location,
  onLocationChange,
}: NewPlanningDialogProps) => {

  const formatSelectedDate = () => {
    if (!selectedDate) return "Geen datum geselecteerd";
    return format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };
  
  const handleClose = () => {
    onOpenChange(false);
    onLocationChange("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Nieuwe planning voor {formatSelectedDate()}</DialogTitle>
          <DialogDescription>
            Plan werk in voor een monteur op {formatSelectedDate()}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Datum</label>
              <Input 
                type="text" 
                value={formatSelectedDate()}
                disabled 
                className="mt-1 bg-gray-50" 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Starttijd</label>
              <Select name="time" required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer starttijd" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Monteur</label>
            <Select name="employee" required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Kies monteur" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                  {installers.map((installer) => (
                    <SelectItem key={installer.id} value={installer.id}>
                      {installer.full_name || installer.email}
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
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Annuleren
            </Button>
            <Button type="submit" className="bg-smans-primary hover:bg-smans-primary/90 text-white w-full sm:w-auto">Planning Aanmaken</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
