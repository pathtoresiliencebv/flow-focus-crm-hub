import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Eye, Edit, Trash2, User, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjectForm } from './ProjectForm';
import { useCrmStore, ProjectWithCustomerName as Project, UpdateProject } from "@/hooks/useCrmStore";
import { useUsers } from "@/hooks/useUsers";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InstallateurProjectList } from './InstallateurProjectList';

type ProjectStatus = "te-plannen" | "gepland" | "in-uitvoering" | "herkeuring" | "afgerond";

const statusColumns = [
  {
    id: "te-plannen",
    title: "Te plannen installaties",
    bgColor: "bg-red-50 border-red-200",
  },
  {
    id: "gepland",
    title: "Geplande installaties",
    bgColor: "bg-orange-50 border-orange-200",
  },
  {
    id: "in-uitvoering",
    title: "In uitvoering",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    id: "herkeuring",
    title: "Herkeuringen",
    bgColor: "bg-gray-50 border-gray-200",
  },
  {
    id: "afgerond",
    title: "Afgeronde installaties",
    bgColor: "bg-green-50 border-green-200",
  },
];

const statusDisplayMap: Record<ProjectStatus, string> = {
  "te-plannen": "Te plannen",
  "gepland": "Gepland",
  "in-uitvoering": "In uitvoering",
  "herkeuring": "Herkeuring",
  "afgerond": "Afgerond",
};

const ProjectCard = ({ project, index }: { project: Project, index: number }) => {
  const navigate = useNavigate();
  const { deleteProject } = useCrmStore();
  const { monteurs } = useUsers();
  const { completionPercentage, tasks } = useProjectTasks(project.id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const assignedMonteur = monteurs.find(m => m.id === project.assigned_user_id);
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projects/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Weet je zeker dat je project "${project.title}" wilt verwijderen?`)) {
      deleteProject(project.id);
    }
  };

  return (
    <>
      <Draggable draggableId={project.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-3"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm">{project.title}</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Acties</span>
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleViewDetails}>
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">Klant: {project.customer}</p>
                  
                  <div className="flex justify-between text-xs">
                    <span>€{project.value}</span>
                    <span>{project.date}</span>
                  </div>

                  {assignedMonteur && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600 truncate">
                        {assignedMonteur.full_name || assignedMonteur.email}
                      </span>
                    </div>
                  )}

                  {tasks.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Voortgang</span>
                        <Badge variant="outline" className="text-xs">
                          {completionPercentage}%
                        </Badge>
                      </div>
                      <Progress value={completionPercentage} className="h-1" />
                    </div>
                  )}

                  {project.description && (
                    <p className="text-xs text-gray-600 truncate">{project.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project bewerken</DialogTitle>
            <DialogDescription>
              Pas de projectgegevens aan.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm 
            onClose={() => setEditDialogOpen(false)} 
            existingProject={project}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ProjectsBoard: React.FC = () => {
  const { projects, updateProject } = useCrmStore();
  const { hasPermission, profile } = useAuth();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>("te-plannen");

  // If user is Installateur, show simplified view
  if (profile?.role === 'Installateur') {
    return <InstallateurProjectList />;
  }

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const newStatus = destination.droppableId as ProjectStatus;
    updateProject(draggableId, { status: newStatus });
  };

  const handleAddProjectClick = (status: ProjectStatus) => {
    setSelectedStatus(status);
    setNewProjectDialogOpen(true);
  };

  const handleProjectCreated = () => {
    setNewProjectDialogOpen(false);
    // Projects will automatically update through the useCrmStore hook
  };

  const projectsByStatus = statusColumns.reduce<Record<string, Project[]>>((acc, column) => {
    acc[column.id] = projects.filter(project => project.status === column.id);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projecten</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Beheer je projecten en installaties</p>
        </div>
        {hasPermission('projects_create') && (
          <Button 
            onClick={() => handleAddProjectClick("te-plannen")}
            className="bg-smans-primary hover:bg-smans-primary/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nieuw Project
          </Button>
        )}
      </div>

      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw project aanmaken</DialogTitle>
            <DialogDescription>
              Vul de projectgegevens in om een nieuw project aan te maken in {statusDisplayMap[selectedStatus]}.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm 
            onClose={handleProjectCreated} 
            initialStatus={selectedStatus}
          />
        </DialogContent>
      </Dialog>
    
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {statusColumns.map(column => (
            <div 
              key={column.id} 
              className={`rounded-lg p-4 border ${column.bgColor}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-sm">{column.title}</h3>
                <span className={`bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-full border ${
                  column.id === "te-plannen" ? "border-red-200" :
                  column.id === "gepland" ? "border-orange-200" :
                  column.id === "in-uitvoering" ? "border-blue-200" :
                  column.id === "herkeuring" ? "border-gray-200" :
                  "border-green-200"
                }`}>
                  {projectsByStatus[column.id]?.length || 0}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] transition-colors rounded-md ${
                      snapshot.isDraggingOver ? 
                      (column.id === "te-plannen" ? "bg-red-100" :
                       column.id === "gepland" ? "bg-orange-100" :
                       column.id === "in-uitvoering" ? "bg-blue-100" :
                       column.id === "herkeuring" ? "bg-gray-100" :
                       "bg-green-100") : 
                      (column.id === "te-plannen" ? "bg-white/50" :
                       column.id === "gepland" ? "bg-white/50" :
                       column.id === "in-uitvoering" ? "bg-white/50" :
                       column.id === "herkeuring" ? "bg-white/50" :
                       "bg-white/50")
                    }`}
                  >
                    {projectsByStatus[column.id]?.length ? (
                      projectsByStatus[column.id].map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        Geen projecten
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              {hasPermission("projects_create") && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`w-full mt-3 text-xs ${
                    column.id === "te-plannen" ? "hover:bg-red-100" :
                    column.id === "gepland" ? "hover:bg-orange-100" :
                    column.id === "in-uitvoering" ? "hover:bg-blue-100" :
                    column.id === "herkeuring" ? "hover:bg-gray-100" :
                    "hover:bg-green-100"
                  }`}
                  onClick={() => handleAddProjectClick(column.id as ProjectStatus)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Project toevoegen
                </Button>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
