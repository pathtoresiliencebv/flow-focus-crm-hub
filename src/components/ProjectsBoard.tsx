import React, { useState, memo, useMemo, useCallback, Suspense } from 'react';
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
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InstallateurProjectList } from './InstallateurProjectList';
import { SlidePanel } from '@/components/ui/slide-panel';

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

const ProjectCard = memo(({ project, index }: { project: Project, index: number }) => {
  const navigate = useNavigate();
  const { deleteProject } = useCrmStore();
  const { monteurs } = useUsers();
  const { completionPercentage, tasks } = useProjectTasks(project.id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const assignedMonteur = useMemo(() => 
    monteurs.find(m => m.id === project.assigned_user_id), 
    [monteurs, project.assigned_user_id]
  );
  
  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projects/${project.id}`);
  }, [navigate, project.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Weet je zeker dat je project "${project.title}" wilt verwijderen?`)) {
      deleteProject(project.id);
    }
  }, [deleteProject, project.id, project.title]);

  return (
    <>
      <Draggable draggableId={project.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-2"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-2.5">
                <div className="space-y-1.5 font-['Poppins']">
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-semibold text-xs leading-tight">{project.title}</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Acties</span>
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleViewDetails}>
                          <Eye className="mr-2 h-3 w-3" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                          <Edit className="mr-2 h-3 w-3" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                          <Trash2 className="mr-2 h-3 w-3" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground leading-tight">{project.customer}</p>
                  
                  <div className="flex justify-between text-[10px] items-center">
                    <span className="text-muted-foreground">{project.date}</span>
                    {project.value && <span className="font-medium">{project.value}</span>}
                  </div>

                  {assignedMonteur && (
                    <div className="flex items-center gap-1">
                      <User className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                      <span className="text-[10px] text-blue-600 truncate leading-tight">
                        {assignedMonteur.full_name || assignedMonteur.email}
                      </span>
                    </div>
                  )}

                  {tasks.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">Voortgang</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {completionPercentage}%
                        </Badge>
                      </div>
                      <Progress value={completionPercentage} className="h-0.5" />
                    </div>
                  )}

                  {project.description && (
                    <p className="text-[10px] text-gray-600 truncate leading-tight">{project.description}</p>
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
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.title === nextProps.project.title &&
    prevProps.project.assigned_user_id === nextProps.project.assigned_user_id &&
    prevProps.index === nextProps.index
  );
});

interface ProjectsBoardProps {
  showNewProjectDialog?: boolean;
  onCloseNewProjectDialog?: () => void;
}

export const ProjectsBoard: React.FC<ProjectsBoardProps> = memo(({ showNewProjectDialog = false, onCloseNewProjectDialog }) => {
  const { projects, updateProject, isLoading, debug } = useCrmStore();
  const { hasPermission, profile } = useAuth();
  const [newProjectPanelOpen, setNewProjectPanelOpen] = useState(showNewProjectDialog);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>("te-plannen");
  const { setTitle } = usePageHeader();

  // Add error boundary for users loading
  const { users, monteurs, isLoading: usersLoading, error: usersError } = useUsers();

  // Sync with prop changes
  React.useEffect(() => {
    console.log('🔄 ProjectsBoard: showNewProjectDialog changed to:', showNewProjectDialog);
    setNewProjectPanelOpen(showNewProjectDialog);
  }, [showNewProjectDialog]);

  React.useEffect(() => {
    setTitle("Projecten");
  }, [setTitle]);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 ProjectsBoard Debug:', {
      isLoading,
      projectsCount: projects.length,
      debug
    });
  }, [isLoading, projects.length, debug]);

  // Show loading state while data is being fetched
  if (isLoading || usersLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Projecten laden...</p>
          <p className="text-xs text-gray-400 mt-2">
            Debug: {debug?.isLoadingCustomers ? 'Customers loading' : ''} {debug?.isLoadingProjects ? 'Projects loading' : ''} {usersLoading ? 'Users loading' : ''}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if users failed to load
  if (usersError) {
    console.warn('Users loading error:', usersError);
    // Continue rendering but with empty users array
  }

  // If user is Installateur, show simplified view
  if (profile?.role === 'Installateur') {
    return <InstallateurProjectList />;
  }

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const newStatus = destination.droppableId as ProjectStatus;
    
    try {
      console.log(`🔄 Moving project ${draggableId} to status: ${newStatus}`);
      await updateProject(draggableId, { status: newStatus });
      console.log(`✅ Project moved successfully to ${newStatus}`);
    } catch (error) {
      console.error('❌ Error moving project:', error);
      // The error toast is already handled in the mutation
    }
  }, [updateProject]);

  const handleAddProjectClick = useCallback((status: ProjectStatus) => {
    console.log('🟢 Project toevoegen clicked in kanban column:', status);
    setSelectedStatus(status);
    setNewProjectPanelOpen(true);
  }, []);

  const handleProjectCreated = useCallback(() => {
    setNewProjectPanelOpen(false);
    onCloseNewProjectDialog?.();
    // Projects will automatically update through the useCrmStore hook
  }, [onCloseNewProjectDialog]);

  const handlePanelClose = useCallback(() => {
    setNewProjectPanelOpen(false);
    onCloseNewProjectDialog?.();
  }, [onCloseNewProjectDialog]);

  const projectsByStatus = useMemo(() => 
    statusColumns.reduce<Record<string, Project[]>>((acc, column) => {
      acc[column.id] = projects.filter(project => project.status === column.id);
      return acc;
    }, {}), 
    [projects]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {console.log('🎨 ProjectsBoard rendering, newProjectPanelOpen:', newProjectPanelOpen)}
      <SlidePanel
        isOpen={newProjectPanelOpen}
        onClose={handlePanelClose}
        title="Nieuw project aanmaken"
        size="lg"
      >
        <ProjectForm 
          onClose={handleProjectCreated} 
          initialStatus={selectedStatus}
        />
      </SlidePanel>
    
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {statusColumns.map(column => (
            <div 
              key={column.id} 
              className={`flex-shrink-0 w-64 rounded-lg p-3 border ${column.bgColor}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-xs">{column.title}</h3>
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
              
              {/* Maak kolom knoppen ALTIJD zichtbaar */}
              <Button 
                size="sm" 
                variant="ghost" 
                className={`w-full mt-3 text-xs font-medium border-2 border-dashed transition-all hover:border-solid ${
                  column.id === "te-plannen" ? "border-red-300 hover:bg-red-100 hover:border-red-400" :
                  column.id === "gepland" ? "border-orange-300 hover:bg-orange-100 hover:border-orange-400" :
                  column.id === "in-uitvoering" ? "border-blue-300 hover:bg-blue-100 hover:border-blue-400" :
                  column.id === "herkeuring" ? "border-gray-300 hover:bg-gray-100 hover:border-gray-400" :
                  "border-green-300 hover:bg-green-100 hover:border-green-400"
                }`}
                onClick={() => handleAddProjectClick(column.id as ProjectStatus)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Project toevoegen
              </Button>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
});
