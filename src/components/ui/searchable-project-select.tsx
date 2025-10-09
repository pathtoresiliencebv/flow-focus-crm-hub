import React, { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Briefcase, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  customer?: string;
  status?: string;
  date?: string;
}

interface SearchableProjectSelectProps {
  projects: Project[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableProjectSelect({
  projects,
  value,
  onValueChange,
  placeholder = "Selecteer project...",
  disabled = false,
  className
}: SearchableProjectSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Reset error when projects change
  useEffect(() => {
    setError(null);
  }, [projects]);

  // Ensure projects is always an array
  const safeProjects = useMemo(() => {
    try {
      console.log('🔍 SearchableProjectSelect: Raw projects prop:', projects);
      console.log('🔍 SearchableProjectSelect: Is array?', Array.isArray(projects));
      console.log('🔍 SearchableProjectSelect: Count:', projects?.length);
      
      if (!projects) {
        console.warn('⚠️ SearchableProjectSelect: Projects prop is null/undefined!');
        return [];
      }
      
      const safe = Array.isArray(projects) ? projects : [];
      console.log('🔍 SearchableProjectSelect: Safe projects:', safe);
      return safe;
    } catch (err) {
      console.error('❌ SearchableProjectSelect: Error in safeProjects:', err);
      setError('Fout bij laden van projecten');
      return [];
    }
  }, [projects]);

  // Find selected project
  const selectedProject = useMemo(() => {
    return safeProjects.find(p => p.id === value);
  }, [safeProjects, value]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    console.log('🔍 SearchableProjectSelect: Starting filter. SafeProjects:', safeProjects);
    
    if (!safeProjects || safeProjects.length === 0) {
      console.warn('⚠️ SearchableProjectSelect: No projects available!');
      return [];
    }
    
    // Filter out any projects without a valid ID first
    const validProjects = safeProjects.filter(project => {
      const isValid = project && project.id && typeof project.id === 'string' && project.id.trim() !== '';
      if (!isValid) {
        console.error('❌ Invalid project found:', project);
      }
      return isValid;
    });
    
    console.log('✅ SearchableProjectSelect: Valid projects count:', validProjects.length);
    
    if (!searchQuery) return validProjects;
    
    const query = searchQuery.toLowerCase();
    return validProjects.filter(project => {
      return (
        (project.title && project.title.toLowerCase().includes(query)) ||
        (project.customer && project.customer.toLowerCase().includes(query)) ||
        (project.status && project.status.toLowerCase().includes(query))
      );
    });
  }, [safeProjects, searchQuery]);

  const handleSelect = (projectId: string) => {
    onValueChange(projectId);
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
    <div className="w-full space-y-2">
      {/* Search input */}
      {safeProjects.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Zoek op projectnaam, klant of status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      
      {/* Select dropdown */}
      <Select value={value} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger className={cn("w-full", className)}>
          <div className="flex items-center gap-2 truncate">
            <Briefcase className="h-4 w-4 shrink-0 opacity-50" />
            <SelectValue placeholder={placeholder}>
              {selectedProject ? (
                <span className="truncate">
                  <span className="font-medium">{selectedProject.title}</span>
                  {selectedProject.customer && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({selectedProject.customer})
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
          {filteredProjects.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {safeProjects.length === 0 ? (
                <>
                  <p>Geen projecten beschikbaar</p>
                  <p className="text-xs mt-2">Voeg eerst een project toe via de + knop</p>
                </>
              ) : (
                <p>Geen projecten gevonden voor "{searchQuery}"</p>
              )}
            </div>
          ) : (
            filteredProjects.map((project) => {
              // Skip invalid projects
              if (!project || !project.id || typeof project.id !== 'string') {
                console.error('❌ Invalid project skipped:', project);
                return null;
              }
              
              return (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{project.title || 'Onbekend'}</div>
                    {project.customer && (
                      <div className="text-xs text-muted-foreground truncate">
                        Klant: {project.customer}
                      </div>
                    )}
                    {project.status && (
                      <div className="text-xs text-muted-foreground">
                        Status: {project.status}
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

