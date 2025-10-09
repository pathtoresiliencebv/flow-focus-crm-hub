import React, { useState, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
}

interface SearchableCustomerSelectProps {
  customers: Customer[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableCustomerSelect({
  customers,
  value,
  onValueChange,
  placeholder = "Selecteer klant...",
  disabled = false,
  className
}: SearchableCustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure customers is always an array
  const safeCustomers = useMemo(() => {
    return Array.isArray(customers) ? customers : [];
  }, [customers]);

  // Find selected customer
  const selectedCustomer = useMemo(() => {
    return safeCustomers.find(c => c.id === value);
  }, [safeCustomers, value]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!safeCustomers || safeCustomers.length === 0) return [];
    if (!searchQuery) return safeCustomers;
    
    const query = searchQuery.toLowerCase();
    return safeCustomers.filter(customer => {
      if (!customer) return false;
      return (
        (customer.name && customer.name.toLowerCase().includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.company_name && customer.company_name.toLowerCase().includes(query))
      );
    });
  }, [safeCustomers, searchQuery]);

  const handleSelect = (customerId: string) => {
    onValueChange(customerId === value ? '' : customerId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">
              {selectedCustomer ? (
                <span>
                  <span className="font-medium">{selectedCustomer.name}</span>
                  {selectedCustomer.email && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {selectedCustomer.email}
                    </span>
                  )}
                </span>
              ) : (
                placeholder
              )}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Zoek op naam, email of telefoon..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Geen klanten gevonden</p>
              <p className="text-xs text-muted-foreground mt-1">
                Probeer een andere zoekterm
              </p>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {Array.isArray(filteredCustomers) && filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer?.id || Math.random()}
                  value={customer?.id || ''}
                  onSelect={() => customer?.id && handleSelect(customer.id)}
                  className="flex items-center gap-2 py-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer?.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{customer?.name || 'Onbekend'}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {customer?.email && (
                        <span className="truncate">{customer.email}</span>
                      )}
                      {customer?.phone && (
                        <span className="shrink-0">• {customer.phone}</span>
                      )}
                    </div>
                    {customer?.company_name && (
                      <div className="text-xs text-muted-foreground truncate">
                        {customer.company_name}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Geen klanten beschikbaar
              </div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

