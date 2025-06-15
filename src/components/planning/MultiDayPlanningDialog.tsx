import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationMapInput from "../LocationMapInput";
import { User } from "@/hooks/useUserStore";
import { ProjectWithCustomerName } from "@/hooks/useCrmStore";
import { dayOptions, generateTimeOptions } from "./utils";

const timeOptions = generateTimeOptions();

interface MultiDayPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  installers: User[];
  projects: ProjectWithCustomerName[];
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  location: string;
  onLocationChange: (location: string) => void;
}

export const MultiDayPlanningDialog = ({
  open,
  onOpenChange,
  onSubmit,
  installers,
  projects,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  location,
  onLocationChange,
}: MultiDayPlanningDialogProps) => {
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
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Meerdaagse planning aanmaken</DialogTitle>
          <DialogDescription>
            Maak planning aan voor meerdere dagen met specifieke tijden en dagen van de week.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Startdatum</label>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                className="rounded-md border mt-1 pointer-events-auto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Einddatum</label>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                className="rounded-md border mt-1 pointer-events-auto"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tijd</label>
              <Select name="time" required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer tijd" />
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
            <div>
              <label className="text-sm font-medium">Monteur</label>
              <Select name="employee" required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Kies monteur" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {installers.map((installer) => (
                    <SelectItem key={installer.id} value={installer.id.toString()}>
                      {installer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <label className="text-sm font-medium">Dagen van de week</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              {dayOptions.map((day) => (
                <label key={day.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="days"
                    value={day.value}
                    className="rounded"
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
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
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Annuleren
            </Button>
            <Button type="submit" className="w-full sm:w-auto">Meerdaagse Planning Aanmaken</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
