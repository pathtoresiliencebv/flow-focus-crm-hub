import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ProjectTask = Database['public']['Tables']['project_tasks']['Row'];
type NewProjectTask = Database['public']['Tables']['project_tasks']['Insert'];
type UpdateProjectTask = Database['public']['Tables']['project_tasks']['Update'];

const fetchProjectTasks = async (projectId: string): Promise<ProjectTask[]> => {
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });
    
  if (error) throw error;
  return data;
};

export const useProjectTasks = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<ProjectTask[]>({
    queryKey: ['project_tasks', projectId],
    queryFn: () => fetchProjectTasks(projectId),
    enabled: !!projectId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...taskData }: UpdateProjectTask & { id: string }) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .update(taskData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
      toast({
        title: "Taak bijgewerkt",
        description: "De taak is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken taak",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (taskData: NewProjectTask) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert(taskData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
      toast({
        title: "Taak toegevoegd",
        description: "De nieuwe taak is succesvol toegevoegd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen taak",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group tasks by block_title
  const tasksByBlock = tasks.reduce((acc, task) => {
    const blockTitle = task.block_title;
    if (!acc[blockTitle]) {
      acc[blockTitle] = [];
    }
    acc[blockTitle].push(task);
    return acc;
  }, {} as Record<string, ProjectTask[]>);

  // Calculate completion percentage
  const completionPercentage = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100)
    : 0;

  return {
    tasks,
    tasksByBlock,
    completionPercentage,
    isLoading,
    updateTask: updateTaskMutation.mutateAsync,
    addTask: addTaskMutation.mutateAsync,
  };
};