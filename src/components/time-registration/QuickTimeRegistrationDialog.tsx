
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface QuickTimeRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedDate: Date | null;
  selectedStartHour: number;
  selectedEndHour: number;
}

export const QuickTimeRegistrationDialog = ({
  open,
  onOpenChange,
  onSubmit,
  selectedDate,
  selectedStartHour,
  selectedEndHour,
}: QuickTimeRegistrationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Snelle tijdsregistratie</DialogTitle>
          <DialogDescription>
            {selectedDate &&
              `Registreer tijd voor ${format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl })} van ${selectedStartHour}:00 tot ${selectedEndHour}:00`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project</label>
            <Select name="project" required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Kies project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project1">Renovatie woonkamer</SelectItem>
                <SelectItem value="project2">Nieuwe kozijnen achtergevel</SelectItem>
                <SelectItem value="project3">Vervangen voordeur</SelectItem>
                <SelectItem value="project4">Isolatieglas installatie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Activiteit</label>
            <Select name="activity" required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Kies activiteit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity1">Opmeten</SelectItem>
                <SelectItem value="activity2">Installatie</SelectItem>
                <SelectItem value="activity3">Adviesgesprek</SelectItem>
                <SelectItem value="activity4">Administratie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Opmerkingen</label>
            <Input name="comments" className="mt-1" placeholder="Optionele opmerkingen" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit">
              Registreren
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
