import { useProjectTasks } from './useProjectTasks';
import { useOfflineSync } from './useOfflineSync';
import { useToast } from './use-toast';

export const useOfflineProjectTasks = (projectId: string) => {
  const projectTasks = useProjectTasks(projectId);
  const { syncStatus, updateOffline } = useOfflineSync();
  const { toast } = useToast();

  const updateTaskOffline = async (taskUpdate: { id: string; is_completed?: boolean; notes?: string }) => {
    try {
      // Optimistic update for immediate UI feedback
      if (projectTasks.updateTask) {
        await projectTasks.updateTask(taskUpdate);
      }

      // If offline, add to sync queue
      if (!syncStatus.isOnline) {
        await updateOffline('project_tasks', taskUpdate.id, taskUpdate);
        
        toast({
          title: "Offline opgeslagen",
          description: "Taak wijziging wordt gesynchroniseerd wanneer je online bent.",
        });
      }
    } catch (error: any) {
      console.error('Error updating task offline:', error);
      
      toast({
        title: "Fout bij opslaan taak",
        description: error.message || "Er is een onbekende fout opgetreden.",
        variant: "destructive",
      });
    }
  };

  return {
    ...projectTasks,
    updateTask: updateTaskOffline,
    isOffline: !syncStatus.isOnline,
    pendingSync: syncStatus.pendingActions > 0,
  };
};