import React, { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { User, Search } from 'lucide-react';
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
    onValueChange(customerId);
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

  // ✅ NIEUWE OPLOSSING: Gebruik gewone Select in plaats van Command
  // Command component heeft interne problemen met children rendering
  return (
    <div className="w-full space-y-2">
      {/* Search input - ALTIJD zichtbaar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Zoek op naam, email of telefoon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Select dropdown */}
      <Select value={value} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger className={cn("w-full", className)}>
          <div className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 opacity-50" />
            <SelectValue placeholder={placeholder}>
              {selectedCustomer ? (
                <span className="truncate">
                  <span className="font-medium">{selectedCustomer.name}</span>
                  {selectedCustomer.email && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({selectedCustomer.email})
                    </span>
                  )}
                </span>
              ) : (
                placeholder
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {filteredCustomers.length === 0 ? (
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
          ) : (
            filteredCustomers.map((customer) => {
              // Skip invalid customers
              if (!customer || !customer.id || typeof customer.id !== 'string') {
                console.error('❌ Invalid customer skipped:', customer);
                return null;
              }
              
              return (
                <SelectItem key={customer.id} value={customer.id}>
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
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

