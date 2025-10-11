import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, profile } = useAuth();

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
      
      // ✅ Check if project status needs to be updated
      if (projectId && taskData.is_completed !== undefined) {
        // Get all tasks for this project
        const { data: allTasks, error: tasksError } = await supabase
          .from('project_tasks')
          .select('is_completed, is_info_block')
          .eq('project_id', projectId);
        
        if (!tasksError && allTasks) {
          // Filter out info blocks
          const completableTasks = allTasks.filter(t => !t.is_info_block);
          const incompleteTasks = completableTasks.filter(t => !t.is_completed);
          
          // Get current project status
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('status')
            .eq('id', projectId)
            .single();
          
          if (!projectError && project) {
            // If there are incomplete tasks and project is "afgerond", reset status
            if (incompleteTasks.length > 0 && project.status === 'afgerond') {
              console.log('📝 Found incomplete tasks, resetting project from afgerond to in-uitvoering...');
              await supabase
                .from('projects')
                .update({ 
                  status: 'in-uitvoering',
                  completion_date: null,
                  completion_id: null
                })
                .eq('id', projectId);
              
              // Invalidate projects query to reflect status change
              queryClient.invalidateQueries({ queryKey: ['projects'] });
              // Only invalidate monteur-projects if current user is a monteur
              if (profile?.role === 'Installateur') {
                queryClient.invalidateQueries({ queryKey: ['monteur-projects', user?.id] });
              }
            }
          }
        }
      }
      
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
      // Insert the task
      const { data, error } = await supabase
        .from('project_tasks')
        .insert(taskData)
        .select()
        .single();
      if (error) throw error;
      
      // ✅ Check if project is "afgerond" - if so, reset to "in_uitvoering"
      if (projectId) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('status')
          .eq('id', projectId)
          .single();
        
        if (!projectError && project?.status === 'afgerond') {
          console.log('📝 Project is afgerond, resetting status to in_uitvoering...');
          await supabase
            .from('projects')
            .update({ 
              status: 'in-uitvoering',
              completion_date: null, // Reset completion date
              completion_id: null // Remove completion reference
            })
            .eq('id', projectId);
          
          // Invalidate projects query to reflect status change
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          // Only invalidate monteur-projects if current user is a monteur
          if (profile?.role === 'Installateur') {
            queryClient.invalidateQueries({ queryKey: ['monteur-projects', user?.id] });
          }
        }
      }
      
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