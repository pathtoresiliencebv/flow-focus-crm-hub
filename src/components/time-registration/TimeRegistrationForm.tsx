
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import React from "react";

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
        <form onSubmit={onSubmit} className="space-y-4">
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
              <Button type="submit" className="mt-4">Registreren</Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
