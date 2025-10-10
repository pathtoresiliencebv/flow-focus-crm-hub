import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Info, Package, Plus, CheckCircle, Circle } from "lucide-react";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectTasksProps {
  projectId: string;
}

export const ProjectTasks: React.FC<ProjectTasksProps> = ({ projectId }) => {
  const { tasks, tasksByBlock, isLoading, updateTask, addTask } = useProjectTasks(projectId);
  const { profile, user } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskBlock, setNewTaskBlock] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await updateTask({ id: taskId, is_completed: completed });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      await addTask({
        project_id: projectId,
        block_title: newTaskBlock || 'Handmatige taken',
        task_description: newTaskTitle,
        is_completed: false,
        order_index: tasks.length + 1
      });
      
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskBlock('');
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Taken
            </CardTitle>
            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Taak toevoegen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe taak toevoegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Taak titel</label>
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Bijv. Installatie laadpaal"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beschrijving (optioneel)</label>
                    <Textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Extra details over de taak"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Blok (optioneel)</label>
                    <Input
                      value={newTaskBlock}
                      onChange={(e) => setNewTaskBlock(e.target.value)}
                      placeholder="Bijv. Hoofdwerkzaamheden"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                      Taak toevoegen
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Nog geen taken beschikbaar voor dit project.</p>
            <p className="text-xs mt-2">Voeg handmatig taken toe of koppel een offerte.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Taken
              <Badge variant="outline" className="ml-2">
                {blockEntries.reduce((total, [, tasks]) => total + tasks.length, 0)} taken
              </Badge>
            </CardTitle>
            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Taak toevoegen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe taak toevoegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Taak titel</label>
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Bijv. Installatie laadpaal"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beschrijving (optioneel)</label>
                    <Textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Extra details over de taak"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Blok (optioneel)</label>
                    <Input
                      value={newTaskBlock}
                      onChange={(e) => setNewTaskBlock(e.target.value)}
                      placeholder="Bijv. Hoofdwerkzaamheden"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                      Taak toevoegen
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {blockEntries.map(([blockTitle, tasks]) => (
            <div key={blockTitle} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{blockTitle}</h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    {task.is_info_block ? (
                      <div className="flex items-start gap-3 w-full">
                        <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {task.info_text}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {profile?.role === 'Installateur' ? (
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={(checked) => 
                              handleTaskToggle(task.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1">
                            {task.is_completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            task.is_completed ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {task.task_description}
                          </p>
                        </div>
                        <Badge variant={task.is_completed ? "default" : "secondary"}>
                          {task.is_completed ? "Voltooid" : "Niet gestart"}
                        </Badge>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};