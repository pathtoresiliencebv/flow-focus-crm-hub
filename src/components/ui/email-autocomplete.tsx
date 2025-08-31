import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface EmailAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EmailAutocomplete({ 
  value, 
  onChange, 
  placeholder = "ontvanger@voorbeeld.nl",
  className 
}: EmailAutocompleteProps) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchContacts = useCallback(async (query: string) => {
    if (!user || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search in contacts table
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, company')
        .eq('user_id', user.id)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      // Search in customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, email')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      const allSuggestions: Contact[] = [];
      
      // Add contacts
      if (contacts) {
        allSuggestions.push(...contacts.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company
        })));
      }

      // Add customers if they exist and have emails
      if (customers) {
        allSuggestions.push(...customers
          .filter(c => c.email) // Only include customers with email
          .map(c => ({
            id: `customer-${c.id}`,
            name: c.name,
            email: c.email!,
            company: undefined
          })));
      }

      // Remove duplicates based on email
      const uniqueSuggestions = allSuggestions.filter((contact, index, self) =>
        index === self.findIndex(c => c.email === contact.email)
      );

      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error('Error searching contacts:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const currentValue = value.split(',').pop()?.trim() || '';
    if (currentValue.length >= 2) {
      searchContacts(currentValue);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, searchContacts]);

  const handleSuggestionClick = (contact: Contact) => {
    const emailParts = value.split(',');
    emailParts[emailParts.length - 1] = ` ${contact.email}`;
    onChange(emailParts.join(','));
    setShowSuggestions(false);

    // Add to contacts if it doesn't exist
    addToContacts(contact);
  };

  const addToContacts = async (contact: Contact) => {
    if (!user || contact.id.startsWith('customer-')) return;

    try {
      await supabase
        .from('contacts')
        .upsert({
          user_id: user.id,
          name: contact.name,
          email: contact.email,
          company: contact.company
        }, {
          onConflict: 'user_id,email'
        });
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onFocus={() => {
          const currentValue = value.split(',').pop()?.trim() || '';
          if (currentValue.length >= 2) {
            setShowSuggestions(true);
          }
        }}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <div className="p-1">
            {suggestions.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted rounded-sm"
                onClick={() => handleSuggestionClick(contact)}
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{contact.name}</div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </div>
                  {contact.company && (
                    <div className="text-xs text-muted-foreground truncate">
                      {contact.company}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {isLoading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="p-2 text-center text-sm text-muted-foreground">
            Zoeken...
          </Card>
        </div>
      )}
    </div>
  );
}