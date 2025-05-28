import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UsersIcon, Calendar as CalendarIcon, Folder, Database, Inbox, Eye, Edit, Trash2, Menu } from "lucide-react";
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
import Receipts from '@/components/Receipts';
import { useCrmStore } from '@/hooks/useCrmStore';
import PlanningManagement from '@/components/PlanningManagement';
import { useIsMobile } from '@/hooks/use-mobile';

// Import mock data from the central location
import { mockAppointments, mockInventory } from '@/data/mockData';

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const {
    customers,
    deleteCustomer
  } = useCrmStore();
  const navigate = useNavigate();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.phone.includes(searchTerm)
  );

  const handleCustomerClick = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setEditCustomerDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: number, customerName: string) => {
    if (window.confirm(`Weet je zeker dat je klant "${customerName}" wilt verwijderen?`)) {
      deleteCustomer(customerId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      {!isMobile && <CrmSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <CrmSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
            )}
            <h1 className={`font-bold text-smans-primary ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              SMANS CRM
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Input 
              className={`${isMobile ? 'w-32' : 'max-w-xs'}`} 
              placeholder="Zoeken..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
            <NotificationsMenu />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-3 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard" className="mt-0">
              <Dashboard />
            </TabsContent>
            
            <TabsContent value="customers" className="mt-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold">Klanten</h2>
                <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-smans-primary hover:bg-smans-primary text-white w-full md:w-auto">
                      Nieuwe Klant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nieuwe klant toevoegen</DialogTitle>
                      <DialogDescription>
                        Vul de klantgegevens in om een nieuwe klant toe te voegen aan het systeem.
                      </DialogDescription>
                    </DialogHeader>
                    <CustomerForm onClose={() => setNewCustomerDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Naam</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead className="min-w-[100px]">Telefoon</TableHead>
                          <TableHead className="hidden lg:table-cell">Plaats</TableHead>
                          <TableHead className="hidden sm:table-cell">Status</TableHead>
                          <TableHead>Acties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map(customer => (
                          <TableRow 
                            key={customer.id} 
                            className="cursor-pointer hover:bg-gray-50" 
                            onClick={() => handleCustomerClick(customer.id)}
                          >
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell className="hidden md:table-cell">{customer.email}</TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell className="hidden lg:table-cell">{customer.city}</TableCell>
                            <TableCell className="hidden sm:table-cell">
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
                                  <Button variant="ghost" size="sm" onClick={e => e.stopPropagation()}>
                                    {isMobile ? '•••' : 'Acties'}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleCustomerClick(customer.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Bewerken
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteCustomer(customer.id, customer.name)} 
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Verwijderen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="projects" className="mt-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold">Projecten</h2>
                <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-smans-primary hover:bg-smans-primary text-white w-full md:w-auto">
                      Nieuw Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md">
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
              
              <ProjectsBoard />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <PlanningManagement />
            </TabsContent>

            <TabsContent value="time" className="mt-0">
              <TimeRegistration />
            </TabsContent>

            <TabsContent value="receipts" className="mt-0">
              <Receipts />
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

      {/* Edit Customer Dialog */}
      <Dialog open={editCustomerDialogOpen} onOpenChange={setEditCustomerDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Klant bewerken</DialogTitle>
            <DialogDescription>
              Pas de klantgegevens aan.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm 
            onClose={() => {
              setEditCustomerDialogOpen(false);
              setEditingCustomer(null);
            }} 
            existingCustomer={editingCustomer} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
