
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCrmStore, Customer } from "@/hooks/useCrmStore";
import { CustomerForm } from './CustomerForm';
import { useAuth } from '@/contexts/AuthContext';
import { MobileCustomerCard } from './customers/MobileCustomerCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { SlidePanel } from '@/components/ui/slide-panel';

interface CustomersProps {
  showNewCustomerDialog?: boolean;
  onCloseNewCustomerDialog?: () => void;
  showSearchBar?: boolean;
  onSearchToggle?: (show: boolean) => void;
}

export const Customers: React.FC<CustomersProps> = ({ 
  showNewCustomerDialog = false, 
  onCloseNewCustomerDialog, 
  showSearchBar = false,
  onSearchToggle 
}) => {
  const navigate = useNavigate();
  const { customers, deleteCustomer } = useCrmStore();
  const { hasPermission } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(showSearchBar);
  const [newCustomerPanelOpen, setNewCustomerPanelOpen] = useState(showNewCustomerDialog);
  const [editCustomerPanelOpen, setEditCustomerPanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Sync with prop changes
  React.useEffect(() => {
    setNewCustomerPanelOpen(showNewCustomerDialog);
  }, [showNewCustomerDialog]);

  React.useEffect(() => {
    setShowSearch(showSearchBar);
  }, [showSearchBar]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditCustomerPanelOpen(true);
  };

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    if (window.confirm(`Weet je zeker dat je klant "${customerName}" wilt verwijderen?`)) {
      deleteCustomer(customerId);
    }
  };

  const handleCustomerCreated = () => {
    setNewCustomerPanelOpen(false);
    onCloseNewCustomerDialog?.();
  };

  const handleCustomerUpdated = () => {
    setEditCustomerPanelOpen(false);
    setSelectedCustomer(null);
  };

  const handlePanelClose = () => {
    setNewCustomerPanelOpen(false);
    onCloseNewCustomerDialog?.();
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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Search Bar */}
      {showSearch && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Zoek op naam, email of stad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setShowSearch(false);
              onSearchToggle?.(false);
            }}
          >
            Sluiten
          </Button>
        </div>
      )}
      
      {/* Customers List/Table */}
      <Card>
        <CardHeader>
          <CardTitle>Klantoverzicht ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? "p-4" : "p-0"}>
          {isMobile ? (
            <div className="space-y-4">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Geen klanten gevonden die voldoen aan je zoekopdracht.' : 'Nog geen klanten toegevoegd.'}
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <MobileCustomerCard
                    key={customer.id}
                    customer={customer}
                    onView={handleViewCustomer}
                    onEdit={handleEditCustomer}
                    onDelete={handleDeleteCustomer}
                    hasEditPermission={hasPermission('customers_edit')}
                    hasDeletePermission={hasPermission('customers_delete')}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bedrijf</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefoon</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>Status</TableHead>
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
                        <TableCell className="text-sm text-gray-600">
                          {(customer as any)?.company_name ? (
                            <div>
                              <div className="font-medium">{(customer as any).company_name}</div>
                              {(customer as any)?.contact_person && (
                                <div className="text-xs text-gray-500">t.a.v. {(customer as any).contact_person}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell className="text-sm">{(customer as any)?.address || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(customer.status ?? '')}
                          >
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border shadow-md">
                              <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Bekijken
                              </DropdownMenuItem>
                              {hasPermission('customers_edit') && (
                                <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Bewerken
                                </DropdownMenuItem>
                              )}
                              {hasPermission('customers_delete') && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Verwijderen
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Customer Panel */}
      <SlidePanel
        isOpen={newCustomerPanelOpen}
        onClose={handlePanelClose}
        title="Nieuwe klant toevoegen"
        size="lg"
      >
        <CustomerForm onClose={handleCustomerCreated} />
      </SlidePanel>

      {/* Edit Customer Panel */}
      <SlidePanel
        isOpen={editCustomerPanelOpen}
        onClose={() => setEditCustomerPanelOpen(false)}
        title="Klant bewerken"
        size="lg"
      >
        <CustomerForm 
          onClose={handleCustomerUpdated} 
          existingCustomer={selectedCustomer}
        />
      </SlidePanel>
    </div>
  );
};

export default Customers;
