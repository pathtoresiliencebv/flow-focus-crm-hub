import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { Camera, Clock, CheckCircle, FileText, User, MapPin, Phone, MessageCircle } from "lucide-react";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useAuth } from "@/hooks/useAuth";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { MobileTimeRegistration } from './MobileTimeRegistration';
import { MobilePhotoUpload } from './MobilePhotoUpload';
import { MobileWorkOrder } from './MobileWorkOrder';
import { MobileChatView } from './MobileChatView';

interface MobileProjectViewProps {
  projectId: string;
}

export const MobileProjectView: React.FC<MobileProjectViewProps> = ({ projectId }) => {
  const { profile } = useAuth();
  const { projects, customers } = useCrmStore();
  const { tasksByBlock, completionPercentage, updateTask, isLoading } = useProjectTasks(projectId);
  const { hapticFeedback, networkStatus } = useNativeCapabilities();
  const [activeTab, setActiveTab] = useState("tasks");

  const project = projects.find(p => p.id === projectId);
  const customer = customers.find(c => c.id === project?.customer_id);

  if (isLoading || !project) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    await hapticFeedback();
    await updateTask({ id: taskId, is_completed: completed });
  };

  const handleRefresh = async () => {
    // Refresh functionality will be implemented with proper data fetching
    window.location.reload();
  };

  const blockEntries = Object.entries(tasksByBlock);

  return (
    <div className="min-h-screen bg-background">
      {/* Project Header - Fixed */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold truncate">{project.title}</h1>
          <Badge variant="outline">
            {completionPercentage}% Voltooid
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-2" />
        
        {customer && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{customer.name}</span>
            {customer.phone && (
              <>
                <Phone className="h-4 w-4 ml-2" />
                <a href={`tel:${customer.phone}`} className="text-primary">
                  {customer.phone}
                </a>
              </>
            )}
          </div>
        )}
        
        {customer?.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{customer.address}, {customer.city}</span>
          </div>
        )}
      </div>

      {/* Mobile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 m-4">
          <TabsTrigger value="tasks" className="flex flex-col items-center gap-1 py-3">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">Taken</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="flex flex-col items-center gap-1 py-3">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Tijd</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex flex-col items-center gap-1 py-3">
            <Camera className="h-4 w-4" />
            <span className="text-xs">Foto's</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex flex-col items-center gap-1 py-3">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="workorder" className="flex flex-col items-center gap-1 py-3">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Werkbon</span>
          </TabsTrigger>
        </TabsList>

        <div className="px-4 pb-20">
          <TabsContent value="tasks" className="space-y-4 mt-0">
            <PullToRefresh onRefresh={handleRefresh} disabled={!networkStatus?.connected}>
            {blockEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Geen taken beschikbaar voor dit project.
              </div>
            ) : (
              blockEntries.map(([blockTitle, tasks]) => (
                <Card key={blockTitle}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{blockTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        {task.is_info_block ? (
                          <div className="flex items-start gap-3 w-full">
                            <div className="h-4 w-4 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {task.info_text || task.task_description}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div 
                              className={`h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                task.is_completed 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300'
                              }`}
                              onClick={() => handleTaskToggle(task.id, !task.is_completed)}
                            >
                              {task.is_completed && (
                                <CheckCircle className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${
                                task.is_completed 
                                  ? 'line-through text-muted-foreground' 
                                  : 'text-foreground'
                              }`}>
                                {task.task_description}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
            </PullToRefresh>
          </TabsContent>

          <TabsContent value="time" className="mt-0">
            <MobileTimeRegistration projectId={projectId} />
          </TabsContent>

          <TabsContent value="photos" className="mt-0">
            <MobilePhotoUpload projectId={projectId} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0 h-[calc(100vh-300px)]">
            <MobileChatView projectId={projectId} projectTitle={project.title} />
          </TabsContent>

          <TabsContent value="workorder" className="mt-0">
            <MobileWorkOrder projectId={projectId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};