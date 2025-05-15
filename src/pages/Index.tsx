import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Users, Calendar as CalendarIcon, Folder, Database, Inbox } from "lucide-react";

import { CustomerForm } from '@/components/CustomerForm';
import { Dashboard } from '@/components/Dashboard';
import { CrmSidebar } from '@/components/CrmSidebar';
import { ProjectsBoard } from '@/components/ProjectsBoard';
import { Invoicing, mockInvoices } from '@/components/Invoicing';
import { NotificationsMenu } from '@/components/NotificationsMenu';

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  // Convert mockProjects to the right format for ProjectsBoard
  const formattedProjects = mockProjects.map(project => ({
    ...project,
    id: project.id.toString(),
    status: getProjectStatus(project.status)
  }));

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
                        <TableRow key={customer.id}>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">Acties</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white">
                                <DropdownMenuItem>Bekijken</DropdownMenuItem>
                                <DropdownMenuItem>Bewerken</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Verwijderen</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                <Button>Nieuw Project</Button>
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

// Mock data
const mockCustomers = [
  { id: 1, name: "Jan de Vries", email: "jan@example.com", phone: "06-12345678", status: "Actief" },
  { id: 2, name: "Marie Jansen", email: "marie@example.com", phone: "06-23456789", status: "In behandeling" },
  { id: 3, name: "Peter Bakker", email: "peter@example.com", phone: "06-34567890", status: "Actief" },
  { id: 4, name: "Sara Visser", email: "sara@example.com", phone: "06-45678901", status: "Inactief" },
  { id: 5, name: "Thomas Mulder", email: "thomas@example.com", phone: "06-56789012", status: "Actief" },
];

const mockProjects = [
  { id: 1, title: "Renovatie woonkamer", customer: "Jan de Vries", status: "In uitvoering", date: "15-05-2025", value: "4,500" },
  { id: 2, title: "Nieuwe kozijnen achtergevel", customer: "Marie Jansen", status: "Gepland", date: "20-05-2025", value: "2,800" },
  { id: 3, title: "Vervangen voordeur", customer: "Peter Bakker", status: "Afgerond", date: "10-05-2025", value: "1,250" },
  { id: 4, title: "Isolatieglas installatie", customer: "Sara Visser", status: "In uitvoering", date: "17-05-2025", value: "3,600" },
  { id: 5, title: "Kunststof kozijnen", customer: "Thomas Mulder", status: "Gepland", date: "25-05-2025", value: "5,200" },
];

const mockAppointments = [
  { id: 1, date: "15-05-2025", time: "09:00", customer: "Jan de Vries", type: "Meting" },
  { id: 2, date: "15-05-2025", time: "13:30", customer: "Marie Jansen", type: "Adviesgesprek" },
  { id: 3, date: "17-05-2025", time: "10:00", customer: "Peter Bakker", type: "Installatie" },
  { id: 4, date: "18-05-2025", time: "14:00", customer: "Sara Visser", type: "Meting" },
  { id: 5, date: "20-05-2025", time: "11:30", customer: "Thomas Mulder", type: "Installatie" },
];

const mockInventory = [
  { id: 1, name: "Kunststof kozijn", type: "Vast", material: "PVC", stock: 15, price: "350" },
  { id: 2, name: "Aluminium kozijn", type: "Draai-kiep", material: "Aluminium", stock: 8, price: "480" },
  { id: 3, name: "Houten kozijn", type: "Schuif", material: "Hardhout", stock: 12, price: "420" },
  { id: 4, name: "Triple glas", type: "HR+++", material: "Glas", stock: 20, price: "180" },
  { id: 5, name: "Dubbel glas", type: "HR++", material: "Glas", stock: 25, price: "120" },
  { id: 6, name: "Vensterbank", type: "Standaard", material: "Composiet", stock: 30, price: "85" },
  { id: 7, name: "Afstandhouders", type: "Warm-edge", material: "Kunststof", stock: 4, price: "35" },
];

export default Index;
