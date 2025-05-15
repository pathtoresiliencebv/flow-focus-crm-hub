
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UsersIcon, Calendar as CalendarIcon, Folder, Database, Inbox, Eye } from "lucide-react";

import { CustomerForm } from '@/components/CustomerForm';
import { ProjectForm } from '@/components/ProjectForm';
import { Dashboard } from '@/components/Dashboard';
import { CrmSidebar } from '@/components/CrmSidebar';
import { ProjectsBoard } from '@/components/ProjectsBoard';
import { Invoicing } from '@/components/Invoicing';
import { NotificationsMenu } from '@/components/NotificationsMenu';
import TimeRegistration from '@/components/TimeRegistration';
import Personnel from '@/components/Personnel';
import Reports from '@/components/Reports';

// Import mock data from the central location
import { mockCustomers, mockProjects, mockAppointments, mockInventory } from '@/data/mockData';

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  // Convert mockProjects to the right format for ProjectsBoard
  const formattedProjects = mockProjects.map(project => ({
    ...project,
    id: project.id.toString(),
    status: getProjectStatus(project.status)
  }));

  // Function to navigate to customer details
  const handleCustomerClick = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <CrmSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Kozijnen CRM</h1>
          
          <div className="flex items-center gap-4">
            <Input 
              className="max-w-xs" 
              placeholder="Zoeken..." 
            />
            
            <NotificationsMenu />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard" className="mt-0">
              <Dashboard />
            </TabsContent>
            
            <TabsContent value="customers" className="mt-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Klanten</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Nieuwe Klant</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nieuwe klant toevoegen</DialogTitle>
                      <DialogDescription>
                        Vul de klantgegevens in om een nieuwe klant toe te voegen aan het systeem.
                      </DialogDescription>
                    </DialogHeader>
                    <CustomerForm onClose={() => {}} />
                  </DialogContent>
                </Dialog>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefoon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockCustomers.map((customer) => (
                        <TableRow key={customer.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleCustomerClick(customer.id)}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              customer.status === "Actief" ? "bg-green-100 text-green-800" :
                              customer.status === "In behandeling" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {customer.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomerClick(customer.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="projects" className="mt-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Projecten</h2>
                <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Nieuw Project</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nieuw project aanmaken</DialogTitle>
                      <DialogDescription>
                        Vul de projectgegevens in om een nieuw project aan te maken.
                      </DialogDescription>
                    </DialogHeader>
                    <ProjectForm onClose={() => setNewProjectDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
              
              <ProjectsBoard initialProjects={formattedProjects} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Planning</h2>
                <Button>Nieuwe Afspraak</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Kalender</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar className="pointer-events-auto" />
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle>Komende Afspraken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Tijd</TableHead>
                          <TableHead>Klant</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{appointment.date}</TableCell>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>{appointment.customer}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                appointment.type === "Meting" ? "bg-blue-100 text-blue-800" :
                                appointment.type === "Installatie" ? "bg-green-100 text-green-800" :
                                "bg-purple-100 text-purple-800"
                              }`}>
                                {appointment.type}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="time" className="mt-0">
              <TimeRegistration />
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Voorraad</h2>
                <Button>Product Toevoegen</Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Materiaal</TableHead>
                        <TableHead>In voorraad</TableHead>
                        <TableHead>Prijs</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.material}</TableCell>
                          <TableCell>
                            <span className={`${
                              item.stock > 10 ? "text-green-600" : 
                              item.stock > 5 ? "text-yellow-600" : 
                              "text-red-600"
                            } font-medium`}>
                              {item.stock}
                            </span>
                          </TableCell>
                          <TableCell>€{item.price}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Bewerken</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="invoicing" className="mt-0">
              <Invoicing />
            </TabsContent>

            <TabsContent value="personnel" className="mt-0">
              <Personnel />
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <Personnel />
            </TabsContent>

            <TabsContent value="salary" className="mt-0">
              <Personnel />
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              <Reports />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Helper function to map project status to board status
function getProjectStatus(status: string): "te-plannen" | "gepland" | "herkeuring" | "afgerond" {
  switch (status) {
    case "Gepland": return "gepland";
    case "In uitvoering": return "te-plannen";
    case "Afgerond": return "afgerond";
    default: return "te-plannen";
  }
}

export default Index;
