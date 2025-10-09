import React, { useState, useMemo, useEffect } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  
  // Reset error when customers change
  useEffect(() => {
    setError(null);
  }, [customers]);

  // Ensure customers is always an array
  const safeCustomers = useMemo(() => {
    try {
      console.log('🔍 SearchableCustomerSelect: Raw customers prop:', customers);
      console.log('🔍 SearchableCustomerSelect: Is array?', Array.isArray(customers));
      console.log('🔍 SearchableCustomerSelect: Count:', customers?.length);
      
      if (!customers) {
        console.warn('⚠️ SearchableCustomerSelect: Customers prop is null/undefined!');
        return [];
      }
      
      const safe = Array.isArray(customers) ? customers : [];
      console.log('🔍 SearchableCustomerSelect: Safe customers:', safe);
      return safe;
    } catch (err) {
      console.error('❌ SearchableCustomerSelect: Error in safeCustomers:', err);
      setError('Fout bij laden van klanten');
      return [];
    }
  }, [customers]);

  // Find selected customer
  const selectedCustomer = useMemo(() => {
    return safeCustomers.find(c => c.id === value);
  }, [safeCustomers, value]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    console.log('🔍 SearchableCustomerSelect: Starting filter. SafeCustomers:', safeCustomers);
    
    if (!safeCustomers || safeCustomers.length === 0) {
      console.warn('⚠️ SearchableCustomerSelect: No customers available!');
      return [];
    }
    
    // ✅ CRITICAL FIX: Filter out any customers without a valid ID first
    // Radix UI Command component crashes if CommandItem has empty/undefined value
    const validCustomers = safeCustomers.filter(customer => {
      const isValid = customer && customer.id && customer.id.trim() !== '';
      if (!isValid) {
        console.error('❌ Invalid customer found:', customer);
      }
      return isValid;
    });
    
    console.log('✅ SearchableCustomerSelect: Valid customers count:', validCustomers.length);
    
    if (!searchQuery) return validCustomers;
    
    const query = searchQuery.toLowerCase();
    return validCustomers.filter(customer => {
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

  // Show error state if there's an error
  if (error) {
    return (
      <div className="w-full p-3 border border-red-300 bg-red-50 rounded-md">
        <p className="text-sm text-red-800">❌ {error}</p>
        <p className="text-xs text-red-600 mt-1">Probeer de pagina te vernieuwen</p>
      </div>
    );
  }

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
              <>
                {filteredCustomers
                  .filter((customer) => {
                    // ✅ CRITICAL FIX: Filter out invalid customers BEFORE mapping
                    // Radix UI Command crashes if we return null in map
                    const isValid = customer && 
                                   customer.id && 
                                   typeof customer.id === 'string' && 
                                   customer.id.trim() !== '';
                    
                    if (!isValid) {
                      console.error('❌ SearchableCustomerSelect: Invalid customer filtered out:', customer);
                    }
                    
                    return isValid;
                  })
                  .map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => handleSelect(customer.id)}
                      className="flex items-center gap-2 py-2"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === customer.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{customer.name || 'Onbekend'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {customer.email && (
                            <span className="truncate">{customer.email}</span>
                          )}
                          {customer.phone && (
                            <span className="shrink-0">• {customer.phone}</span>
                          )}
                        </div>
                        {customer.company_name && (
                          <div className="text-xs text-muted-foreground truncate">
                            {customer.company_name}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))
                }
              </>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {safeCustomers.length === 0 ? (
                  <>
                    <p>Geen klanten beschikbaar</p>
                    <p className="text-xs mt-2">Voeg eerst een klant toe via de + knop</p>
                  </>
                ) : (
                  <p>Geen klanten gevonden voor "{searchQuery}"</p>
                )}
              </div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

