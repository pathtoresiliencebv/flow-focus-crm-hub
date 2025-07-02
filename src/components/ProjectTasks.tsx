import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Info } from "lucide-react";
import { useProjectTasks } from "@/hooks/useProjectTasks";

interface ProjectTasksProps {
  projectId: string;
}

export const ProjectTasks: React.FC<ProjectTasksProps> = ({ projectId }) => {
  const { tasksByBlock, completionPercentage, updateTask, isLoading } = useProjectTasks(projectId);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    await updateTask({ id: taskId, is_completed: completed });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Taken laden...</div>
        </CardContent>
      </Card>
    );
  }

  const blockEntries = Object.entries(tasksByBlock);

  if (blockEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Project Taken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Nog geen taken beschikbaar voor dit project.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Project Taken
            </span>
            <Badge variant="outline" className="ml-2">
              {completionPercentage}% voltooid
            </Badge>
          </CardTitle>
          <Progress value={completionPercentage} className="w-full" />
        </CardHeader>
      </Card>

      {blockEntries.map(([blockTitle, tasks]) => (
        <Card key={blockTitle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{blockTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                {task.is_info_block ? (
                  <div className="flex items-start gap-3 w-full">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {task.info_text || task.task_description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Checkbox
                      checked={task.is_completed || false}
                      onCheckedChange={(checked) => 
                        handleTaskToggle(task.id, checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${
                        task.is_completed 
                          ? 'line-through text-muted-foreground' 
                          : 'text-foreground'
                      }`}>
                        {task.task_description}
                      </p>
                      {task.is_completed && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Voltooid</span>
                        </div>
                      )}
                    </div>
                    {!task.is_completed && (
                      <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
                    )}
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};