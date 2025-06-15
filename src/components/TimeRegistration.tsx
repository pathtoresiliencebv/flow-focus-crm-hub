
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeekCalendar } from "./WeekCalendar";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export const TimeRegistration = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStartHour, setSelectedStartHour] = useState<number>(9);
  const [selectedEndHour, setSelectedEndHour] = useState<number>(10);
  const { toast } = useToast();
  
  const handleSubmitTime = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    toast({
      title: "Tijd geregistreerd",
      description: "De tijdsregistratie is succesvol opgeslagen.",
    });
    
    setTimeDialogOpen(false);
    setSelectedDate(null);
  };

  const handleEventClick = (event: any) => {
    console.log("Event clicked:", event);
    toast({
      title: "Event details",
      description: `${event.title} - ${event.startTime} tot ${event.endTime}`,
    });
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    console.log("Time slot clicked:", date, hour);
    setSelectedDate(date);
    setSelectedStartHour(hour);
    setSelectedEndHour(hour + 1);
    setActiveTab("register");
  };

  const handleEventCreate = (date: Date, startHour: number, endHour: number) => {
    console.log("Creating event:", date, startHour, endHour);
    setSelectedDate(date);
    setSelectedStartHour(startHour);
    setSelectedEndHour(endHour);
    setTimeDialogOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tijdsregistratie</h2>
        <Button onClick={() => setActiveTab("register")}>Nieuwe registratie</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="calendar">Weekkalender</TabsTrigger>
          <TabsTrigger value="register">Registreren</TabsTrigger>
          <TabsTrigger value="reports">Rapporten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tijdsregistraties deze week</CardTitle>
              <CardDescription>Overzicht van geregistreerde uren per project</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Activiteit</TableHead>
                    <TableHead>Uren</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTimeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.project}</TableCell>
                      <TableCell>{entry.activity}</TableCell>
                      <TableCell>{entry.hours}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.status === "Gefiatteerd" ? "bg-green-100 text-green-800" :
                          entry.status === "In behandeling" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {entry.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekkalender</CardTitle>
              <CardDescription>
                Bekijk en beheer je tijdsregistraties in weekoverzicht. 
                <br />
                <span className="text-sm text-muted-foreground">
                  💡 Tip: Sleep over tijdslots om snel een nieuwe registratie aan te maken
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeekCalendar 
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeSlotClick}
                onEventCreate={handleEventCreate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nieuwe tijdsregistratie</CardTitle>
              <CardDescription>
                {selectedDate ? 
                  `Registreer je gewerkte uren voor ${format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl })}` :
                  "Registreer je gewerkte uren"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTime} className="space-y-4">
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
                          setSelectedStartHour(hour);
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
                          setSelectedEndHour(hour);
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
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tijdsrapportage</CardTitle>
              <CardDescription>Analyseer gewerkte uren per project en medewerker</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Totaal deze week</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">36.5 uren</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Gemiddeld per dag</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">7.3 uren</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Totaal factureerbaar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">32.0 uren</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Time Registration Dialog */}
      <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snelle tijdsregistratie</DialogTitle>
            <DialogDescription>
              {selectedDate && 
                `Registreer tijd voor ${format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl })} van ${selectedStartHour}:00 tot ${selectedEndHour}:00`
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTime} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={() => setTimeDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit">
                Registreren
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const mockTimeEntries = [
  { id: 1, date: "15-05-2025", project: "Renovatie woonkamer", activity: "Opmeten", hours: 2.5, status: "Gefiatteerd" },
  { id: 2, date: "15-05-2025", project: "Nieuwe kozijnen achtergevel", activity: "Installatie", hours: 6, status: "Gefiatteerd" },
  { id: 3, date: "16-05-2025", project: "Vervangen voordeur", activity: "Adviesgesprek", hours: 1, status: "In behandeling" },
  { id: 4, date: "16-05-2025", project: "Isolatieglas installatie", activity: "Installatie", hours: 4, status: "Concept" },
  { id: 5, date: "17-05-2025", project: "Kunststof kozijnen", activity: "Administratie", hours: 1.5, status: "Gefiatteerd" },
];

export default TimeRegistration;
