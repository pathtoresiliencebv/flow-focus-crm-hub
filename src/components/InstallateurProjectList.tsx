import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, User, Calendar, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useUsers } from "@/hooks/useUsers";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useAuth } from "@/hooks/useAuth";
import { useProjectDelivery } from "@/hooks/useProjectDelivery";
import { ProjectDeliveryDialog } from "./dashboard/ProjectDeliveryDialog";

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
  const { monteurs } = useUsers();
  const { user } = useAuth();
  const { startProject, completeProject, isStarting, isCompleting } = useProjectDelivery();
  const [showDelivery, setShowDelivery] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Filter projects for current installateur
  const installateurProjects = projects.filter(p => p.assigned_user_id === user?.id);

  // Group projects by status
  const projectsByStatus = {
    "gepland": installateurProjects.filter(p => p.status === "gepland"),
    "in-uitvoering": installateurProjects.filter(p => p.status === "in-uitvoering"),
    "afgerond": installateurProjects.filter(p => p.status === "afgerond"),
    "herkeuring": installateurProjects.filter(p => p.status === "herkeuring"),
    "te-plannen": installateurProjects.filter(p => p.status === "te-plannen"),
  };

  const handleViewDetails = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleStartProject = async (projectId: string) => {
    await startProject(projectId);
  };

  const handleCompleteProject = (project: any) => {
    setSelectedProject(project);
    setShowDelivery(true);
  };

  const ProjectCard = ({ project }: { project: any }) => {
    const assignedMonteur = monteurs.find(m => m.id === project.assigned_user_id);
    const { completionPercentage, tasks } = useProjectTasks(project.id);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{project.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Klant: {project.customer}</p>
            </div>
            <Badge className={`${statusColorMap[project.status as ProjectStatus]} border`}>
              {statusDisplayMap[project.status as ProjectStatus]}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{project.date || 'Geen datum'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">€{project.value || 0}</span>
            </div>
          </div>

          {assignedMonteur && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">
                {assignedMonteur.full_name || assignedMonteur.email}
              </span>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Voortgang</span>
                <Badge variant="outline" className="text-xs">
                  {completionPercentage}%
                </Badge>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          )}

          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => handleViewDetails(project.id)} 
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              Details
            </Button>
            
            {project.status === 'gepland' && (
              <Button 
                onClick={() => handleStartProject(project.id)}
                disabled={isStarting}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isStarting ? 'Starten...' : 'Start Project'}
              </Button>
            )}
            
            {project.status === 'in-uitvoering' && (
              <Button 
                onClick={() => handleCompleteProject(project)}
                disabled={isCompleting}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Opleveren
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Project Delivery Dialog */}
      {showDelivery && selectedProject && (
        <ProjectDeliveryDialog
          project={selectedProject}
          isOpen={showDelivery}
          onClose={() => {
            setShowDelivery(false);
            setSelectedProject(null);
          }}
          onComplete={() => {
            setShowDelivery(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
};