import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, CheckCircle, MapPin, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { MobileProjectView } from './MobileProjectView';

export const MobileDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const { projects, customers } = useCrmStore();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
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

  // Get project IDs from planning items
  const plannedProjectIds = new Set(planningItems.map(p => p.project_id).filter(Boolean));

  // Filter projects: show ALL assigned projects (not just those with planning)
  // Projects that are already assigned to the monteur should be visible
  const myProjects = projects
    .filter(project => 
      // Show if: assigned to me AND not completed
      project.assigned_user_id === user?.id && 
      project.status !== 'afgerond'
    )
    .sort((a, b) => {
      // Sort by planning date if available, otherwise by project date
      const planningA = planningItems.find(pi => pi.project_id === a.id);
      const planningB = planningItems.find(pi => pi.project_id === b.id);
      
      // Both have planning - sort by planning date
      if (planningA && planningB) {
        return new Date(planningA.start_date).getTime() - new Date(planningB.start_date).getTime();
      }
      
      // Only A has planning - it comes first
      if (planningA) return -1;
      // Only B has planning - it comes first
      if (planningB) return 1;
      
      // Neither has planning - sort by project date
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Newest first
    });

  if (selectedProject) {
    return (
      <div>
        <div className="p-4 border-b bg-background">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedProject(null)}
            className="mb-2"
          >
            ← Terug naar overzicht
          </Button>
        </div>
        <MobileProjectView projectId={selectedProject} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <h1 className="text-xl font-bold">Mijn Projecten</h1>
        <p className="text-sm text-muted-foreground">
          Welkom {profile?.full_name || 'Monteur'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{myProjects.length}</div>
              <div className="text-xs text-muted-foreground">Actieve projecten</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {myProjects.filter(p => p.status === 'in-uitvoering').length}
              </div>
              <div className="text-xs text-muted-foreground">In uitvoering</div>
            </CardContent>
          </Card>
        </div>

        {/* Project List */}
        {myProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">Geen actieve projecten</h3>
              <p className="text-sm text-muted-foreground">
                Er zijn momenteel geen projecten aan u toegewezen
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myProjects.map((project) => {
              const planning = planningItems.find(pi => pi.project_id === project.id);
              return (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  onClick={() => setSelectedProject(project.id)}
                  planningDate={planning?.start_date}
                  planningTime={planning?.start_time}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface ProjectCardProps {
  project: any;
  onClick: () => void;
  planningDate?: string;
  planningTime?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, planningDate, planningTime }) => {
  const { customers } = useCrmStore();
  const { completionPercentage } = useProjectTasks(project.id);
  
  const customer = customers.find(c => c.id === project.customer_id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'te-plannen': return 'bg-red-100 text-red-800 border-red-200';
      case 'gepland': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in-uitvoering': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'herkeuring': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'te-plannen': return 'Te plannen';
      case 'gepland': return 'Gepland';
      case 'in-uitvoering': return 'In uitvoering';
      case 'herkeuring': return 'Herkeuring';
      default: return 'Onbekend';
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-sm leading-tight">{project.title}</h3>
            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </Badge>
          </div>

          {/* Planning Date - Highlighted */}
          {planningDate && (
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 p-2 rounded-md">
              <Calendar className="h-4 w-4" />
              <span>Ingepland: {new Date(planningDate).toLocaleDateString('nl-NL', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
              })}</span>
              {planningTime && (
                <span className="text-xs opacity-75">om {planningTime.slice(0, 5)}</span>
              )}
            </div>
          )}

          {customer && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{customer.name}</span>
              </div>
              
              {customer.address && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{customer.address}, {customer.city}</span>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <a href={`tel:${customer.phone}`} className="text-primary">
                    {customer.phone}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Voortgang</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};