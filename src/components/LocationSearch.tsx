import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Loader2 } from "lucide-react";

interface LocationResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationResult) => void;
  placeholder?: string;
  label?: string;
  initialValue?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Zoek locatie...",
  label = "Locatie",
  initialValue = ""
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

  // Update search term when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setSearchTerm(initialValue);
      // Automatically search for the initial value
      searchLocations(initialValue);
    }
  }, [initialValue]);

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=nl`
      );
      const data = await response.json();
      setResults(data);
      
      // If there's an exact match or only one result, auto-select it
      if (data.length === 1) {
        handleLocationSelect(data[0]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() && searchTerm !== selectedLocation?.display_name) {
        searchLocations(searchTerm);
      } else if (!searchTerm.trim()) {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location);
    setSearchTerm(location.display_name);
    setShowResults(false);
    onLocationSelect(location);
  };

  return (
    <div className="relative">
      <Label htmlFor="location">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          id="location"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((result) => (
              <div
                key={result.place_id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleLocationSelect(result)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.display_name}
                    </p>
                    {result.address && (
                      <p className="text-xs text-gray-500">
                        {[
                          result.address.house_number,
                          result.address.road,
                          result.address.city,
                          result.address.postcode
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
