
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/hooks/useUserStore";
import { useCrmStore } from "@/hooks/useCrmStore";
import { CalendarIcon, Clock, MapPin, User, Plus, Filter } from "lucide-react";
import LocationMapInput from "./LocationMapInput";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface PlanningItem {
  id: string;
  date: string;
  time: string;
  employee: string;
  employeeId: number;
  project: string;
  projectId: string;
  location: string;
  description: string;
  status: "Gepland" | "Bevestigd" | "Afgerond" | "Geannuleerd";
  createdAt: string;
}

export const PlanningManagement = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedInstallers, setSelectedInstallers] = useState<number[]>([]);
  const [newPlanningDialogOpen, setNewPlanningDialogOpen] = useState(false);
  const [locationValue, setLocationValue] = useState("");
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([
    {
      id: "1",
      date: "2025-05-26",
      time: "09:00",
      employee: "Peter Bakker",
      employeeId: 3,
      project: "Kozijnen vervangen",
      projectId: "1",
      location: "Hoofdstraat 123, Amsterdam, Nederland",
      description: "Installatie nieuwe kozijnen woonkamer",
      status: "Gepland",
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      date: "2025-05-27",
      time: "13:30",
      employee: "Peter Bakker",
      employeeId: 3,
      project: "Nieuwe ramen installeren",
      projectId: "2",
      location: "Kerkstraat 45, Utrecht, Nederland",
      description: "Opmeting en adviesgesprek",
      status: "Bevestigd",
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      date: "2025-05-28",
      time: "10:00",
      employee: "Peter Bakker",
      employeeId: 3,
      project: "Kozijnen vervangen",
      projectId: "1",
      location: "Marktplein 12, Rotterdam, Nederland",
      description: "Eindcontrole en oplevering",
      status: "Gepland",
      createdAt: new Date().toISOString()
    }
  ]);

  const { toast } = useToast();
  const { users } = useUserStore();
  const { projects } = useCrmStore();

  // Filter users with "Installateur" role
  const installers = users.filter(user => user.role === "Installateur");

  const handleInstallerToggle = (installerId: number) => {
    setSelectedInstallers(prev => 
      prev.includes(installerId) 
        ? prev.filter(id => id !== installerId)
        : [...prev, installerId]
    );
  };

  const handleCreatePlanning = (formData: FormData) => {
    const selectedDateFormatted = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];
    const newPlanning: PlanningItem = {
      id: Date.now().toString(),
      date: selectedDateFormatted,
      time: formData.get('time') as string,
      employee: users.find(u => u.id === parseInt(formData.get('employee') as string))?.name || '',
      employeeId: parseInt(formData.get('employee') as string),
      project: projects.find(p => p.id === formData.get('project') as string)?.title || '',
      projectId: formData.get('project') as string,
      location: locationValue,
      description: formData.get('description') as string,
      status: "Gepland",
      createdAt: new Date().toISOString()
    };

    setPlanningItems([...planningItems, newPlanning]);
    setNewPlanningDialogOpen(false);
    setLocationValue("");
    
    toast({
      title: "Planning aangemaakt",
      description: `Planning voor ${newPlanning.employee} op ${format(selectedDate || new Date(), 'dd MMMM yyyy', { locale: nl })} is succesvol aangemaakt.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Gepland": return "bg-blue-100 text-blue-800";
      case "Bevestigd": return "bg-green-100 text-green-800";
      case "Afgerond": return "bg-gray-100 text-gray-800";
      case "Geannuleerd": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get filtered plannings for selected date and installers
  const getFilteredPlannings = () => {
    if (!selectedDate) return [];
    
    const selectedDateFormatted = format(selectedDate, 'yyyy-MM-dd');
    let filtered = planningItems.filter(item => item.date === selectedDateFormatted);
    
    if (selectedInstallers.length > 0) {
      filtered = filtered.filter(item => selectedInstallers.includes(item.employeeId));
    }
    
    return filtered.sort((a, b) => a.time.localeCompare(b.time));
  };

  // Get dates that have plannings for calendar highlighting
  const planningDates = planningItems.map(item => new Date(item.date));

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "Geen datum geselecteerd";
    return format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl });
  };

  // Group plannings by time slot for better visualization
  const groupPlanningsByTime = (plannings: PlanningItem[]) => {
    const grouped: { [time: string]: PlanningItem[] } = {};
    plannings.forEach(planning => {
      if (!grouped[planning.time]) {
        grouped[planning.time] = [];
      }
      grouped[planning.time].push(planning);
    });
    return grouped;
  };

  const filteredPlannings = getFilteredPlannings();
  const groupedPlannings = groupPlanningsByTime(filteredPlannings);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planning Beheer</h2>
        <Dialog open={newPlanningDialogOpen} onOpenChange={setNewPlanningDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedDate}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Planning voor {selectedDate ? format(selectedDate, 'dd/MM', { locale: nl }) : 'Selecteer datum'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nieuwe planning voor {formatSelectedDate()}</DialogTitle>
              <DialogDescription>
                Plan werk in voor een monteur op {formatSelectedDate()}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreatePlanning(formData);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-sm font-medium">Tijd</label>
                  <Input type="time" name="time" required className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Monteur</label>
                <Select name="employee" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kies monteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {installers.map((installer) => (
                      <SelectItem key={installer.id} value={installer.id.toString()}>
                        {installer.name}
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
                  <SelectContent>
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
                    value={locationValue}
                    onChange={setLocationValue}
                    placeholder="Zoek adres of locatie..."
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Beschrijving</label>
                <Input name="description" className="mt-1" placeholder="Omschrijving van het werk" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setNewPlanningDialogOpen(false);
                  setLocationValue("");
                }}>
                  Annuleren
                </Button>
                <Button type="submit">Planning Aanmaken</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Kalender
            </CardTitle>
            <CardDescription>
              Klik op een datum om planningen te bekijken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={{
                hasPlanning: planningDates
              }}
              modifiersStyles={{
                hasPlanning: {
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
              className="rounded-md border pointer-events-auto"
            />
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Dagen met planning</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installer Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Monteurs Filter
            </CardTitle>
            <CardDescription>
              Selecteer monteurs om hun planning te bekijken
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedInstallers(installers.map(i => i.id))}
              >
                Alles selecteren
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedInstallers([])}
              >
                Niets selecteren
              </Button>
            </div>
            {installers.map((installer) => (
              <div key={installer.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`installer-${installer.id}`}
                  checked={selectedInstallers.includes(installer.id)}
                  onCheckedChange={() => handleInstallerToggle(installer.id)}
                />
                <label 
                  htmlFor={`installer-${installer.id}`} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {installer.name}
                </label>
              </div>
            ))}
            {selectedInstallers.length > 0 && (
              <div className="mt-4 p-2 bg-blue-50 rounded text-sm">
                <strong>{selectedInstallers.length}</strong> monteur(s) geselecteerd
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactive Daily Planning */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Planning voor {formatSelectedDate()}
            </CardTitle>
            <CardDescription>
              {selectedInstallers.length > 0 && filteredPlannings.length > 0 
                ? `${filteredPlannings.length} activiteit(en) voor geselecteerde monteurs`
                : selectedInstallers.length > 0 
                  ? "Geen activiteiten voor geselecteerde monteurs"
                  : filteredPlannings.length > 0
                    ? `${filteredPlannings.length} activiteit(en) gepland`
                    : "Geen activiteiten gepland voor deze dag"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPlannings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {selectedInstallers.length > 0 
                    ? "Geen planning voor geselecteerde monteurs op deze dag"
                    : "Geen planning voor deze dag"
                  }
                </p>
                {selectedDate && (
                  <Button 
                    onClick={() => setNewPlanningDialogOpen(true)}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Planning Toevoegen
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedPlannings).map(([time, plannings]) => (
                  <div key={time} className="border rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-lg font-bold text-blue-600 min-w-[60px]">{time}</div>
                      <div className="h-px bg-gray-200 flex-1"></div>
                      <div className="text-sm text-gray-500">{plannings.length} activiteit(en)</div>
                    </div>
                    <div className="space-y-3">
                      {plannings.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-1">
                              <div className="font-medium">{item.project}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {item.employee}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="max-w-xs truncate">{item.location}</span>
                                </div>
                              </div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Planning Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Planningen</CardTitle>
          <CardDescription>Overzicht van alle geplande activiteiten</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Tijd</TableHead>
                <TableHead>Monteur</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Locatie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planningItems
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{format(new Date(item.date), 'dd MMM yyyy', { locale: nl })}</TableCell>
                  <TableCell>{item.time}</TableCell>
                  <TableCell>{item.employee}</TableCell>
                  <TableCell>{item.project}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.location}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Bewerken
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanningManagement;
