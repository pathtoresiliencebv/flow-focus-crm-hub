import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCrmStore } from "@/hooks/useCrmStore";
import { CustomerForm } from './CustomerForm';

export const Customers = () => {
  const navigate = useNavigate();
  const { customers, deleteCustomer } = useCrmStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewCustomer = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setEditCustomerDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: number, customerName: string) => {
    if (window.confirm(`Weet je zeker dat je klant "${customerName}" wilt verwijderen?`)) {
      deleteCustomer(customerId);
    }
  };

  const handleCustomerCreated = () => {
    setNewCustomerDialogOpen(false);
  };

  const handleCustomerUpdated = () => {
    setEditCustomerDialogOpen(false);
    setSelectedCustomer(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actief':
        return 'bg-green-100 text-green-800';
      case 'In behandeling':
        return 'bg-orange-100 text-orange-800';
      case 'Inactief':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Klanten</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Beheer je klanten en hun gegevens</p>
        </div>
        <Button 
          onClick={() => setNewCustomerDialogOpen(true)}
          className="bg-smans-primary hover:bg-smans-primary/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Klant
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoek klanten op naam, email of stad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Klantoverzicht ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefoon</TableHead>
                  <TableHead>Stad</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'Geen klanten gevonden die voldoen aan je zoekopdracht.' : 'Nog geen klanten toegevoegd.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.city}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(customer.status)}
                        >
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(customer.createdAt).toLocaleDateString('nl-NL')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Bekijken
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Customer Dialog */}
      <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuwe klant toevoegen</DialogTitle>
            <DialogDescription>
              Vul de klantgegevens in om een nieuwe klant toe te voegen.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm onClose={handleCustomerCreated} />
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editCustomerDialogOpen} onOpenChange={setEditCustomerDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Klant bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de klantgegevens.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm 
            onClose={handleCustomerUpdated} 
            existingCustomer={selectedCustomer}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
