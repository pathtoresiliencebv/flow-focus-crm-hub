import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, MoreHorizontal, Mail, Phone, MapPin } from "lucide-react";
import { Customer } from "@/hooks/useCrmStore";

interface MobileCustomerCardProps {
  customer: Customer;
  onView: (customerId: string) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string, customerName: string) => void;
  hasEditPermission: boolean;
  hasDeletePermission: boolean;
}

export const MobileCustomerCard: React.FC<MobileCustomerCardProps> = ({
  customer,
  onView,
  onEdit,
  onDelete,
  hasEditPermission,
  hasDeletePermission,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actief':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In behandeling':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Inactief':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg truncate">{customer.name}</h3>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getStatusColor(customer.status ?? '')}`}>
              {customer.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border shadow-md">
                <DropdownMenuItem onClick={() => onView(customer.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Bekijken
                </DropdownMenuItem>
                {hasEditPermission && (
                  <DropdownMenuItem onClick={() => onEdit(customer)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Bewerken
                  </DropdownMenuItem>
                )}
                {hasDeletePermission && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(customer.id, customer.name)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Verwijderen
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="space-y-2">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a href={`tel:${customer.phone}`} className="text-primary">
                {customer.phone}
              </a>
            </div>
          )}
          
          {customer.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{customer.city}</span>
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-muted-foreground">
            Aangemaakt: {new Date(customer.created_at).toLocaleDateString('nl-NL')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};