import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLogger } from './useAuditLogger';

interface RetentionPolicy {
  id: string;
  policy_name: string;
  data_type: string;
  retention_period_days: number;
  description?: string;
  legal_basis?: string;
  automatic_deletion: boolean;
  archive_before_deletion: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DataCleanupJob {
  id: string;
  policy_id: string;
  data_type: string;
  records_identified: number;
  records_processed: number;
  records_deleted: number;
  records_archived: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export const useDataRetention = () => {
  const { toast } = useToast();
  const { logComplianceEvent, logSystemEvent } = useAuditLogger();
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [cleanupJobs, setCleanupJobs] = useState<DataCleanupJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load retention policies
  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .order('policy_name');

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error loading retention policies:', error);
      toast({
        title: "Error",
        description: "Failed to load retention policies",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create retention policy
  const createPolicy = useCallback(async (policy: Omit<RetentionPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .insert([policy])
        .select()
        .single();

      if (error) throw error;

      await loadPolicies();
      await logComplianceEvent('retention_policy_created', 'data_retention_policy', data.id, {
        policy_name: policy.policy_name,
        data_type: policy.data_type,
        retention_days: policy.retention_period_days
      });

      toast({
        title: "Success",
        description: "Retention policy created successfully"
      });

      return data;
    } catch (error) {
      console.error('Error creating retention policy:', error);
      toast({
        title: "Error",
        description: "Failed to create retention policy",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadPolicies, logComplianceEvent, toast]);

  // Update retention policy
  const updatePolicy = useCallback(async (id: string, updates: Partial<RetentionPolicy>) => {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadPolicies();
      await logComplianceEvent('retention_policy_updated', 'data_retention_policy', id, updates);

      toast({
        title: "Success",
        description: "Retention policy updated successfully"
      });

      return data;
    } catch (error) {
      console.error('Error updating retention policy:', error);
      toast({
        title: "Error",
        description: "Failed to update retention policy",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadPolicies, logComplianceEvent, toast]);

  // Delete retention policy
  const deletePolicy = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('data_retention_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadPolicies();
      await logComplianceEvent('retention_policy_deleted', 'data_retention_policy', id);

      toast({
        title: "Success",
        description: "Retention policy deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting retention policy:', error);
      toast({
        title: "Error",
        description: "Failed to delete retention policy",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadPolicies, logComplianceEvent, toast]);

  // Identify expired data
  const identifyExpiredData = useCallback(async (policyId: string) => {
    try {
      const policy = policies.find(p => p.id === policyId);
      if (!policy) throw new Error('Policy not found');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_period_days);

      let expiredCount = 0;
      const expiredRecords: any[] = [];

      // Check different data types based on policy
      switch (policy.data_type) {
        case 'audit_logs':
          const { data: auditLogs, error: auditError } = await supabase
            .from('audit_logs')
            .select('id, timestamp')
            .lt('timestamp', cutoffDate.toISOString());

          if (auditError) throw auditError;
          expiredCount = auditLogs?.length || 0;
          expiredRecords.push(...(auditLogs || []));
          break;

        case 'direct_messages':
          const { data: directMessages, error: directError } = await supabase
            .from('direct_messages')
            .select('id, created_at')
            .lt('created_at', cutoffDate.toISOString());

          if (directError) throw directError;
          expiredCount = directMessages?.length || 0;
          expiredRecords.push(...(directMessages || []));
          break;

        case 'compliance_events':
          const { data: complianceEvents, error: complianceError } = await supabase
            .from('compliance_events')
            .select('id, detected_at')
            .lt('detected_at', cutoffDate.toISOString())
            .eq('remediation_status', 'resolved');

          if (complianceError) throw complianceError;
          expiredCount = complianceEvents?.length || 0;
          expiredRecords.push(...(complianceEvents || []));
          break;

        default:
          throw new Error(`Unsupported data type: ${policy.data_type}`);
      }

      await logSystemEvent('data_retention_scan', {
        policy_id: policyId,
        data_type: policy.data_type,
        expired_count: expiredCount,
        cutoff_date: cutoffDate.toISOString()
      });

      return {
        policy,
        expiredCount,
        expiredRecords,
        cutoffDate
      };
    } catch (error) {
      console.error('Error identifying expired data:', error);
      throw error;
    }
  }, [policies, logSystemEvent]);

  // Process data cleanup
  const processCleanup = useCallback(async (policyId: string, dryRun = false) => {
    try {
      setIsLoading(true);
      const result = await identifyExpiredData(policyId);
      const { policy, expiredRecords } = result;

      if (dryRun) {
        toast({
          title: "Dry Run Complete",
          description: `Found ${expiredRecords.length} expired records for ${policy.data_type}`
        });
        return result;
      }

      if (expiredRecords.length === 0) {
        toast({
          title: "No Data to Clean",
          description: `No expired records found for ${policy.data_type}`
        });
        return result;
      }

      let deletedCount = 0;
      let archivedCount = 0;

      if (policy.archive_before_deletion) {
        // Archive data (simplified - in production, you'd move to archive storage)
        await logSystemEvent('data_archived', {
          policy_id: policyId,
          data_type: policy.data_type,
          record_count: expiredRecords.length
        });
        archivedCount = expiredRecords.length;
      }

      if (policy.automatic_deletion) {
        // Delete expired records
        const recordIds = expiredRecords.map(r => r.id);
        
        // Delete expired records based on data type
        let deleteError = null;
        
        switch (policy.data_type) {
          case 'audit_logs':
            const { error: auditError } = await supabase
              .from('audit_logs')
              .delete()
              .in('id', recordIds);
            deleteError = auditError;
            break;
            
          case 'direct_messages':
            const { error: directError } = await supabase
              .from('direct_messages')
              .delete()
              .in('id', recordIds);
            deleteError = directError;
            break;
            
          case 'compliance_events':
            const { error: complianceError } = await supabase
              .from('compliance_events')
              .delete()
              .in('id', recordIds);
            deleteError = complianceError;
            break;
            
          default:
            throw new Error(`Deletion not supported for data type: ${policy.data_type}`);
        }

        if (deleteError) throw deleteError;
        deletedCount = expiredRecords.length;

        await logComplianceEvent('data_retention_cleanup', policy.data_type, undefined, {
          policy_id: policyId,
          deleted_count: deletedCount,
          archived_count: archivedCount
        });
      }

      toast({
        title: "Cleanup Complete",
        description: `Processed ${expiredRecords.length} records: ${deletedCount} deleted, ${archivedCount} archived`
      });

      return {
        ...result,
        deletedCount,
        archivedCount
      };
    } catch (error) {
      console.error('Error processing cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to process data cleanup",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [identifyExpiredData, logSystemEvent, logComplianceEvent, toast]);

  // Run automatic cleanup for all active policies
  const runAutomaticCleanup = useCallback(async () => {
    try {
      const activePolicies = policies.filter(p => p.is_active && p.automatic_deletion);
      
      for (const policy of activePolicies) {
        await processCleanup(policy.id);
      }

      await logSystemEvent('automatic_cleanup_completed', {
        policies_processed: activePolicies.length
      });

      toast({
        title: "Success",
        description: `Automatic cleanup completed for ${activePolicies.length} policies`
      });
    } catch (error) {
      console.error('Error running automatic cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to run automatic cleanup",
        variant: "destructive"
      });
    }
  }, [policies, processCleanup, logSystemEvent, toast]);

  // Get retention status
  const getRetentionStatus = useCallback(async () => {
    try {
      const status = {
        total_policies: policies.length,
        active_policies: policies.filter(p => p.is_active).length,
        automatic_policies: policies.filter(p => p.automatic_deletion).length,
        data_types_covered: [...new Set(policies.map(p => p.data_type))].length
      };

      // Calculate estimated data volumes
      const dataVolumes: any = {};
      for (const policy of policies) {
        if (policy.is_active) {
          const result = await identifyExpiredData(policy.id);
          dataVolumes[policy.data_type] = result.expiredCount;
        }
      }

      return {
        ...status,
        pending_cleanup: dataVolumes
      };
    } catch (error) {
      console.error('Error getting retention status:', error);
      return null;
    }
  }, [policies, identifyExpiredData]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  return {
    policies,
    cleanupJobs,
    isLoading,
    loadPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    identifyExpiredData,
    processCleanup,
    runAutomaticCleanup,
    getRetentionStatus
  };
};