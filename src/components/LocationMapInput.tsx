
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationMapInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const LocationMapInput = ({ value, onChange, placeholder = "Voer adres in..." }: LocationMapInputProps) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  // Mock geocoding function - in real app you'd use Mapbox Geocoding API
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call with mock Dutch addresses
    setTimeout(() => {
      const mockSuggestions = [
        `${query}, Amsterdam, Nederland`,
        `${query}, Utrecht, Nederland`,
        `${query}, Rotterdam, Nederland`,
        `${query}, Den Haag, Nederland`,
        `${query}, Eindhoven, Nederland`
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);
      
      setSuggestions(mockSuggestions);
      setIsSearching(false);
    }, 300);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== value) {
        searchAddress(searchQuery);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, value]);

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    onChange(suggestion);
    setSuggestions([]);
    
    toast({
      title: "Locatie geselecteerd",
      description: `Adres: ${suggestion}`,
    });
  };

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {searchQuery && (
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Geselecteerde locatie: {searchQuery}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMapInput;
