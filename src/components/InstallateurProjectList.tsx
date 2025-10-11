import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useAuth } from "@/contexts/AuthContext";
import { InstallateurProjectCard } from "./dashboard/InstallateurProjectCard";

type ProjectStatus = "te-plannen" | "gepland" | "in-uitvoering" | "herkeuring" | "afgerond";

const statusDisplayMap: Record<ProjectStatus, string> = {
  "te-plannen": "Te plannen",
  "gepland": "Gepland",
  "in-uitvoering": "In uitvoering",
  "herkeuring": "Herkeuring",
  "afgerond": "Afgerond",
};

const statusColorMap: Record<ProjectStatus, string> = {
  "te-plannen": "bg-red-100 text-red-800 border-red-200",
  "gepland": "bg-orange-100 text-orange-800 border-orange-200",
  "in-uitvoering": "bg-blue-100 text-blue-800 border-blue-200",
  "herkeuring": "bg-gray-100 text-gray-800 border-gray-200",
  "afgerond": "bg-green-100 text-green-800 border-green-200",
};

export const InstallateurProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { projects } = useCrmStore();
  const { user } = useAuth();
  const [planningItems, setPlanningItems] = useState<any[]>([]);

  // Fetch planning items for current user
  useEffect(() => {
    const fetchPlanning = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('planning_items')
        .select('*')
        .eq('assigned_user_id', user.id)
        .order('start_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching planning:', error);
        return;
      }
      
      setPlanningItems(data || []);
    };
    
    fetchPlanning();
  }, [user?.id]);

  // 🔥 CRITICAL FIX: Memoize to prevent infinite re-render loop!
  // Without useMemo, these arrays/objects are recreated EVERY render,
  // causing new references and triggering re-renders → INFINITE LOOP!
  
  // Get project IDs from planning items
  const plannedProjectIds = useMemo(() => 
    new Set(planningItems.map(p => p.project_id).filter(Boolean)), 
    [planningItems]
  );

  // Filter projects: only show projects that are in planning_items for this user
  const installateurProjects = useMemo(() => 
    projects
      .filter(p => plannedProjectIds.has(p.id))
      .sort((a, b) => {
        // Sort by planning date
        const planningA = planningItems.find(pi => pi.project_id === a.id);
        const planningB = planningItems.find(pi => pi.project_id === b.id);
        if (!planningA || !planningB) return 0;
        return new Date(planningA.start_date).getTime() - new Date(planningB.start_date).getTime();
      }),
    [projects, plannedProjectIds, planningItems]
  );

  // Group projects by status
  const projectsByStatus = useMemo(() => ({
    "gepland": installateurProjects.filter(p => p.status === "gepland"),
    "in-uitvoering": installateurProjects.filter(p => p.status === "in-uitvoering"),
    "afgerond": installateurProjects.filter(p => p.status === "afgerond"),
    "herkeuring": installateurProjects.filter(p => p.status === "herkeuring"),
    "te-plannen": installateurProjects.filter(p => p.status === "te-plannen"),
  }), [installateurProjects]);

  // 🔥 FIXED: Use same InstallateurProjectCard as Dashboard for consistency!

  if (installateurProjects.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Geen projecten toegewezen</h3>
          <p className="text-muted-foreground">Er zijn momenteel geen projecten aan u toegewezen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* 🔒 Monteurs kunnen GEEN nieuwe projecten toevoegen */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mijn Projecten</h2>
        <Badge variant="outline" className="text-sm">
          {installateurProjects.length} project{installateurProjects.length !== 1 ? 'en' : ''}
        </Badge>
      </div>

      {/* Status sections */}
      {Object.entries(projectsByStatus).map(([status, statusProjects]) => {
        if (statusProjects.length === 0) return null;
        
        return (
          <div key={status} className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">
                {statusDisplayMap[status as ProjectStatus]}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {statusProjects.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statusProjects.map((project) => (
                <InstallateurProjectCard 
                  key={project.id} 
                  project={project}
                  onProjectClick={(projectId) => navigate(`/projects/${projectId}`)}
                />
              ))}
            </div>
          </div>
        );
      })}

    </div>
  );
};