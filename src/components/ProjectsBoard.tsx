
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define project status types
type ProjectStatus = "te-plannen" | "gepland" | "herkeuring" | "afgerond";

// Define project interface
interface Project {
  id: string;
  title: string;
  customer: string;
  date: string;
  value: string;
  status: ProjectStatus;
}

// Props for ProjectsBoard component
interface ProjectsBoardProps {
  initialProjects: Project[];
}

const statusColumns = [
  {
    id: "te-plannen",
    title: "Te plannen installaties",
  },
  {
    id: "gepland",
    title: "Geplande installaties",
  },
  {
    id: "herkeuring",
    title: "Herkeuringen",
  },
  {
    id: "afgerond",
    title: "Afgeronde installaties",
  },
];

// Map status to display text
const statusDisplayMap: Record<ProjectStatus, string> = {
  "te-plannen": "Te plannen",
  "gepland": "Gepland",
  "herkeuring": "Herkeuring",
  "afgerond": "Afgerond",
};

// Project card component
const ProjectCard = ({ project, index }: { project: Project, index: number }) => (
  <Draggable draggableId={project.id} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="mb-3"
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">{project.title}</h4>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Klant: {project.customer}</p>
              <div className="flex justify-between text-xs">
                <span>€{project.value}</span>
                <span>{project.date}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </Draggable>
);

export const ProjectsBoard: React.FC<ProjectsBoardProps> = ({ initialProjects }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const { toast } = useToast();

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Return if dropped outside of a droppable area or in the same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find the project that was dragged
    const projectIndex = projects.findIndex(p => p.id === draggableId);
    if (projectIndex === -1) return;
    
    // Create a new array with the updated projects
    const newProjects = [...projects];
    const [movedProject] = newProjects.splice(projectIndex, 1);
    
    // Update the status of the moved project
    const newStatus = destination.droppableId as ProjectStatus;
    const updatedProject = { ...movedProject, status: newStatus };
    
    // Insert the project at the destination
    newProjects.splice(destination.index, 0, updatedProject);
    
    // Update state
    setProjects(newProjects);
    
    // Show toast notification
    toast({
      title: "Project status bijgewerkt",
      description: `${movedProject.title} verplaatst naar ${statusDisplayMap[newStatus]}`,
    });
  };

  // Group projects by status
  const projectsByStatus = statusColumns.reduce<Record<string, Project[]>>((acc, column) => {
    acc[column.id] = projects.filter(project => project.status === column.id);
    return acc;
  }, {});

  return (
    <div className="mt-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusColumns.map(column => (
            <div key={column.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-sm">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                  {projectsByStatus[column.id]?.length || 0}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
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
              
              <Button size="sm" variant="ghost" className="w-full mt-3 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Project toevoegen
              </Button>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
