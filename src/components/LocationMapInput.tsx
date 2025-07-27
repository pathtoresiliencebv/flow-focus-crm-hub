
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationMapInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const LocationMapInput = ({ value, onChange, placeholder = "Voer adres in..." }: LocationMapInputProps) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { toast } = useToast();

  // Set Mapbox access token from environment variables
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '';
  mapboxgl.accessToken = MAPBOX_TOKEN;

  // Real geocoding function using Mapbox Geocoding API
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    
    try {
      if (!MAPBOX_TOKEN) {
        console.warn('Mapbox token not configured, using fallback suggestions');
        const mockSuggestions = [
          `${query} - Voorbeeld adres 1`,
          `${query} - Voorbeeld adres 2`,
          `${query} - Voorbeeld adres 3`
        ];
        setSuggestions(mockSuggestions);
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=NL&types=address,poi`
      );
      const data = await response.json();
      
      const newSuggestions = data.features?.map((feature: any) => feature.place_name) || [];
      setSuggestions(newSuggestions.slice(0, 5));
    } catch (error) {
      console.error('Geocoding error:', error);
      // Fallback to mock suggestions
      const mockSuggestions = [
        `${query}, Amsterdam, Nederland`,
        `${query}, Utrecht, Nederland`,
        `${query}, Rotterdam, Nederland`
      ].slice(0, 3);
      setSuggestions(mockSuggestions);
    }
    
    setIsSearching(false);
  };

  // Initialize map
  useEffect(() => {
    if (showMap && mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [5.2913, 52.1326], // Netherlands center
        zoom: 7
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMap]);

  // Update map when location is selected
  const updateMapLocation = async (address: string) => {
    if (!map.current) return;

    try {
      if (!MAPBOX_TOKEN) {
        console.warn('Mapbox token not configured, map location update skipped');
        return;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        // Remove existing marker
        if (marker.current) {
          marker.current.remove();
        }
        
        // Add new marker
        marker.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(map.current);
          
        // Fly to location
        map.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error updating map location:', error);
    }
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
    setShowMap(true);
    
    // Update map location after a brief delay to ensure map is initialized
    setTimeout(() => {
      updateMapLocation(suggestion);
    }, 100);
    
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
          {!showMap && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setShowMap(true);
                setTimeout(() => updateMapLocation(searchQuery), 100);
              }}
            >
              Toon op kaart
            </Button>
          )}
        </div>
      )}

      {showMap && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Kaart locatie</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMap(false)}
            >
              Verberg kaart
            </Button>
          </div>
          <div 
            ref={mapContainer} 
            className="w-full h-64 rounded-md border border-gray-200"
          />
        </div>
      )}
    </div>
  );
};

export default LocationMapInput;
