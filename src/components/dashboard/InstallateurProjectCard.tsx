import React, { useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, MapPin, Phone, Calendar, Play, CheckCircle } from "lucide-react";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useProjectDelivery } from "@/hooks/useProjectDelivery";
import { useCrmStore } from "@/hooks/useCrmStore";
import { ProjectCompletionPanel } from './ProjectCompletionPanel';

interface InstallateurProjectCardProps {
  project: any;
  onProjectClick: (projectId: string) => void;
}

export const InstallateurProjectCard = ({ project, onProjectClick }: InstallateurProjectCardProps) => {
  const queryClient = useQueryClient();
  const { customers } = useCrmStore();
  const { completionPercentage } = useProjectTasks(project.id);
  const { startProject, isStarting } = useProjectDelivery();
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);

  const customer = customers.find(c => c.id === project.customer_id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'te-plannen': return 'bg-red-100 text-red-800 border-red-200';
      case 'gepland': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in-uitvoering': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'herkeuring': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'afgerond': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'te-plannen': return 'Te plannen';
      case 'gepland': return 'Gepland';
      case 'in-uitvoering': return 'In uitvoering';
      case 'herkeuring': return 'Herkeuring';
      case 'afgerond': return 'Afgerond';
      default: return 'Onbekend';
    }
  };

  const handleStartProject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await startProject(project.id);
  };

  const handleCompleteProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeliveryDialog(true);
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onProjectClick(project.id)}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {customer && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{customer.name}</span>
              </div>
              
              {customer.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{customer.address}, {customer.city}</span>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                    {customer.phone}
                  </a>
                </div>
              )}
            </div>
          )}

          {project.date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(project.date).toLocaleDateString('nl-NL')}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Voortgang</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>


          {/* Action Buttons */}
          <div className="pt-2 border-t space-y-2">
            {project.status === 'gepland' && (
              <Button 
                onClick={handleStartProject}
                disabled={isStarting}
                className="w-full"
                size="sm"
              >
                <Play className="mr-2 h-4 w-4" />
                {isStarting ? 'Project starten...' : 'Project Starten'}
              </Button>
            )}
            
            {project.status === 'in-uitvoering' && (
              <Button 
                onClick={handleCompleteProject}
                className="w-full"
                size="sm"
                variant="outline"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Project Opleveren
              </Button>
            )}
            
            {project.status === 'afgerond' && (
              <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                <p className="text-green-700 text-sm font-medium">✅ Project Afgerond</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {project && (
        <ProjectCompletionPanel
          project={project}
          isOpen={showDeliveryDialog}
          onClose={() => setShowDeliveryDialog(false)}
          onComplete={() => {
            setShowDeliveryDialog(false);
            // Optioneel: refresh de data
          }}
        />
      )}
    </>
  );
};