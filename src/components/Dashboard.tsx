import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Users, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, Edit, Trash2 } from "lucide-react";
import { WeekCalendar } from "./WeekCalendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'meditation' | 'appointment' | 'meeting' | 'other';
  description?: string;
}

interface Task {
  id: number;
  title: string;
  dueDate: string;
  priority: 'Hoog' | 'Gemiddeld' | 'Laag';
  status: 'pending' | 'completed';
}

export const Dashboard = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<DashboardEvent[]>([
    {
      id: "1",
      title: "Team vergadering",
      startTime: "09:00",
      endTime: "10:00",
      date: "2025-06-12",
      type: "meeting",
      description: "Wekelijkse team sync"
    },
    {
      id: "2", 
      title: "Klant gesprek",
      startTime: "14:00",
      endTime: "15:30",
      date: "2025-06-13",
      type: "appointment",
      description: "Overleg nieuwe kozijnen"
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Offerte opstellen - Nieuwe kozijnen",
      dueDate: "Vandaag",
      priority: "Hoog",
      status: "pending"
    },
    {
      id: 2,
      title: "Materiaal bestellen - Project Amsterdam",
      dueDate: "Morgen",
      priority: "Gemiddeld",
      status: "pending"
    },
    {
      id: 3,
      title: "Klant terugbellen - Reparatie",
      dueDate: "Vandaag",
      priority: "Hoog",
      status: "completed"
    }
  ]);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleEventClick = (event: DashboardEvent) => {
    toast({
      title: "Planning Details",
      description: `${event.title} - ${event.startTime} tot ${event.endTime}`,
    });
  };

  const handlePlanningAdded = (planning: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => {
    const newEvent: DashboardEvent = {
      id: Date.now().toString(),
      title: planning.title,
      startTime: planning.startTime,
      endTime: planning.endTime,
      date: planning.date,
      type: 'appointment',
      description: planning.description
    };

    setEvents(prev => [...prev, newEvent]);

    toast({
      title: "Planning toegevoegd",
      description: `${planning.title} is toegevoegd voor ${planning.date}`,
    });
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const dueDate = formData.get('dueDate') as string;
    const priority = formData.get('priority') as 'Hoog' | 'Gemiddeld' | 'Laag';

    if (editingTask) {
      // Update existing task
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id 
          ? { ...task, title, dueDate, priority }
          : task
      ));
      toast({
        title: "Taak bijgewerkt",
        description: `${title} is bijgewerkt`,
      });
    } else {
      // Add new task
      const newTask: Task = {
        id: Date.now(),
        title,
        dueDate,
        priority,
        status: 'pending'
      };
      setTasks(prev => [...prev, newTask]);
      toast({
        title: "Taak toegevoegd",
        description: `${title} is toegevoegd`,
      });
    }

    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleTaskToggle = (taskId: number) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const handleTaskDelete = (taskId: number) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "Taak verwijderd",
      description: "De taak is verwijderd",
    });
  };

  const stats = [
    {
      title: "Actieve Projecten",
      value: "12",
      description: "3 nieuwe deze week",
      icon: FileText,
      color: "bg-blue-500"
    },
    {
      title: "Team Leden",
      value: "8",
      description: "2 installateurs beschikbaar",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Deze Week",
      value: "€15.420",
      description: "+12% t.o.v. vorige week",
      icon: TrendingUp,
      color: "bg-purple-500"
    },
    {
      title: "Vandaag",
      value: "6",
      description: "4 voltooid, 2 gepland",
      icon: CalendarDays,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-none space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Welkom terug! Hier is je overzicht voor vandaag.</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow flex-1 sm:flex-none text-xs sm:text-sm">
              <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Rapport
            </Button>
            <Button className="bg-smans-primary hover:bg-smans-primary/90 text-white shadow-sm hover:shadow-md transition-all flex-1 sm:flex-none text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Nieuw Project
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{stat.description}</p>
                  </div>
                  <div className={`${stat.color} p-2 sm:p-3 rounded-full flex-shrink-0`}>
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Width Calendar */}
        <div className="w-full">
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Deze Week Planning
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Klik op een tijdslot of sleep om een nieuwe planning toe te voegen
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 lg:p-6 w-full overflow-x-auto">
              <div className="w-full min-w-[800px]">
                <WeekCalendar 
                  events={events}
                  onEventClick={handleEventClick}
                  onPlanningAdded={handlePlanningAdded}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Sidebar for Mobile, Fixed for Desktop */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto">
            {/* Quick Actions */}
            <div className="space-y-3 mb-6">
              <h3 className="text-base font-semibold">Snelle Acties</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs">
                  <Plus className="mr-2 h-3 w-3" />
                  Nieuwe Offerte
                </Button>
                <Button className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-xs">
                  <Users className="mr-2 h-3 w-3" />
                  Klant Toevoegen
                </Button>
                <Button className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs">
                  <Clock className="mr-2 h-3 w-3" />
                  Tijd Registreren
                </Button>
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Aankomende Taken</h3>
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
                    <div className="mt-1" onClick={() => handleTaskToggle(task.id)}>
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className={`h-3 w-3 ${task.priority === 'Hoog' ? 'text-red-500' : 'text-orange-500'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => handleTaskClick(task)}>
                      <p className={`text-xs font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{task.dueDate}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          task.priority === 'Hoog' ? 'bg-red-100 text-red-700' :
                          task.priority === 'Gemiddeld' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskDelete(task.id);
                        }}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Snelle Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe Offerte
                </Button>
                <Button className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-sm">
                  <Users className="mr-2 h-4 w-4" />
                  Klant Toevoegen
                </Button>
                <Button className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-sm">
                  <Clock className="mr-2 h-4 w-4" />
                  Tijd Registreren
                </Button>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Aankomende Taken</CardTitle>
                    <CardDescription className="text-sm">Belangrijke deadlines en to-dos</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddTask}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
                      <div className="mt-1" onClick={() => handleTaskToggle(task.id)}>
                        {task.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className={`h-4 w-4 ${task.priority === 'Hoog' ? 'text-red-500' : 'text-orange-500'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => handleTaskClick(task)}>
                        <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{task.dueDate}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'Hoog' ? 'bg-red-100 text-red-700' :
                            task.priority === 'Gemiddeld' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskDelete(task.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Task Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Taak bewerken' : 'Nieuwe taak toevoegen'}
              </DialogTitle>
              <DialogDescription>
                {editingTask ? 'Bewerk de taakdetails' : 'Voeg een nieuwe taak toe aan je lijst'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titel</label>
                <Input 
                  name="title" 
                  className="mt-1" 
                  placeholder="Taak beschrijving..." 
                  defaultValue={editingTask?.title || ''}
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Vervaldatum</label>
                <Input 
                  name="dueDate" 
                  className="mt-1" 
                  placeholder="Bijv. Vandaag, Morgen, 15 juni..."
                  defaultValue={editingTask?.dueDate || ''}
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prioriteit</label>
                <Select name="priority" defaultValue={editingTask?.priority || 'Gemiddeld'}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hoog">Hoog</SelectItem>
                    <SelectItem value="Gemiddeld">Gemiddeld</SelectItem>
                    <SelectItem value="Laag">Laag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  {editingTask ? 'Bijwerken' : 'Toevoegen'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
