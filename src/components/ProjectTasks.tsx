import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Info, Package } from "lucide-react";
import { useProjectTasks } from "@/hooks/useProjectTasks";

interface ProjectTasksProps {
  projectId: string;
}

export const ProjectTasks: React.FC<ProjectTasksProps> = ({ projectId }) => {
  const { tasksByBlock, isLoading } = useProjectTasks(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Offerte items laden...</div>
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
            <FileText className="h-5 w-5" />
            Offerte Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Nog geen offerte items beschikbaar voor dit project.</p>
            <p className="text-xs mt-2">Items worden automatisch overgenomen uit de gekoppelde offerte.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Offerte Items
            <Badge variant="outline" className="ml-2">
              {blockEntries.reduce((total, [, tasks]) => total + tasks.length, 0)} items
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Overzicht van alle werkzaamheden en materialen uit de offerte
          </p>
        </CardHeader>
      </Card>

      {blockEntries.map(([blockTitle, tasks]) => (
        <Card key={blockTitle}>
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base font-semibold">{blockTitle}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors"
                >
                  {task.is_info_block ? (
                    <>
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {task.info_text || task.task_description}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {task.task_description}
                        </p>
                        {task.quote_item_type && (
                          <div className="flex items-center gap-2 mt-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground capitalize">
                              {task.quote_item_type === 'product' ? 'Product' : 'Tekstblok'}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};