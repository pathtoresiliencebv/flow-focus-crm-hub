import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type ProjectMaterial = Database['public']['Tables']['project_materials']['Row'];
type NewProjectMaterial = Database['public']['Tables']['project_materials']['Insert'];
type UpdateProjectMaterial = Database['public']['Tables']['project_materials']['Update'];

type ProjectReceipt = Database['public']['Tables']['project_receipts']['Row'];
type NewProjectReceipt = Database['public']['Tables']['project_receipts']['Insert'];

const fetchProjectMaterials = async (projectId: string): Promise<ProjectMaterial[]> => {
  const { data, error } = await supabase
    .from('project_materials')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data;
};

const fetchProjectReceipts = async (projectId: string): Promise<ProjectReceipt[]> => {
  const { data, error } = await supabase
    .from('project_receipts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data;
};

export const useProjectMaterials = (projectId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery<ProjectMaterial[]>({
    queryKey: ['project_materials', projectId],
    queryFn: () => fetchProjectMaterials(projectId),
    enabled: !!projectId,
  });

  const { data: receipts = [], isLoading: isLoadingReceipts } = useQuery<ProjectReceipt[]>({
    queryKey: ['project_receipts', projectId],
    queryFn: () => fetchProjectReceipts(projectId),
    enabled: !!projectId,
  });

  const addMaterialMutation = useMutation({
    mutationFn: async (materialData: Omit<NewProjectMaterial, 'added_by' | 'project_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('project_materials')
        .insert({
          ...materialData,
          project_id: projectId,
          added_by: user.id
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_materials', projectId] });
      toast({
        title: "Materiaal toegevoegd",
        description: "Het materiaal is succesvol toegevoegd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen materiaal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, ...materialData }: UpdateProjectMaterial & { id: string }) => {
      const { data, error } = await supabase
        .from('project_materials')
        .update(materialData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_materials', projectId] });
      toast({
        title: "Materiaal bijgewerkt",
        description: "Het materiaal is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken materiaal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_materials')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_materials', projectId] });
      toast({
        title: "Materiaal verwijderd",
        description: "Het materiaal is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen materiaal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addReceiptMutation = useMutation({
    mutationFn: async (receiptData: Omit<NewProjectReceipt, 'added_by' | 'project_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('project_receipts')
        .insert({
          ...receiptData,
          project_id: projectId,
          added_by: user.id
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_receipts', projectId] });
      toast({
        title: "Bonnetje toegevoegd",
        description: "Het bonnetje is succesvol toegevoegd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen bonnetje",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const totalMaterialCost = materials.reduce((sum, material) => sum + (material.total_cost || 0), 0);
  const totalReceiptCost = receipts.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);

  return {
    materials,
    receipts,
    isLoading: isLoadingMaterials || isLoadingReceipts,
    totalMaterialCost,
    totalReceiptCost,
    totalCost: totalMaterialCost + totalReceiptCost,
    addMaterial: addMaterialMutation.mutateAsync,
    updateMaterial: updateMaterialMutation.mutateAsync,
    deleteMaterial: deleteMaterialMutation.mutateAsync,
    addReceipt: addReceiptMutation.mutateAsync,
  };
};