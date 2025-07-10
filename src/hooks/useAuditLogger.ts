import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AuditLog {
  id: string;
  user_id?: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: string;
  severity: string;
  compliance_relevant: boolean;
}

interface AuditFilters {
  action_type?: string;
  resource_type?: string;
  user_id?: string;
  severity?: string;
  date_from?: string;
  date_to?: string;
  compliance_relevant?: boolean;
}

export const useAuditLogger = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get client info
  const getClientInfo = useCallback(() => {
    return {
      ip_address: null, // Will be filled by server-side logging if needed
      user_agent: navigator.userAgent,
      session_id: user?.id || 'anonymous'
    };
  }, [user]);

  // Log action
  const logAction = useCallback(async (
    action_type: string,
    resource_type: string,
    resource_id?: string,
    details: any = {},
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    compliance_relevant = false
  ) => {
    try {
      const clientInfo = getClientInfo();
      
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: user?.id,
          action_type,
          resource_type,
          resource_id,
          details,
          severity,
          compliance_relevant,
          ...clientInfo,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging audit action:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }, [user, getClientInfo]);

  // Load audit logs
  const loadLogs = useCallback(async (filters?: AuditFilters, limit = 100) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (filters?.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.compliance_relevant !== undefined) {
        query = query.eq('compliance_relevant', filters.compliance_relevant);
      }
      if (filters?.date_from) {
        query = query.gte('timestamp', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('timestamp', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs((data || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string || undefined
      })));
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pre-defined logging methods for common actions
  const logUserAction = useCallback((action: string, details?: any) => {
    return logAction('user_action', 'user', user?.id, details, 'info', false);
  }, [logAction, user]);

  const logDataAccess = useCallback((resource_type: string, resource_id: string, operation: string, details?: any) => {
    return logAction(
      `data_${operation}`,
      resource_type,
      resource_id,
      details,
      'info',
      true // Data access is compliance relevant
    );
  }, [logAction]);

  const logSecurityEvent = useCallback((event_type: string, details?: any, severity: 'warning' | 'error' | 'critical' = 'warning') => {
    return logAction(
      `security_${event_type}`,
      'security',
      undefined,
      details,
      severity,
      true // Security events are compliance relevant
    );
  }, [logAction]);

  const logSystemEvent = useCallback((event_type: string, details?: any) => {
    return logAction('system_event', 'system', undefined, { event_type, ...details }, 'info', false);
  }, [logAction]);

  const logComplianceEvent = useCallback((event_type: string, resource_type: string, resource_id?: string, details?: any) => {
    return logAction(
      `compliance_${event_type}`,
      resource_type,
      resource_id,
      details,
      'warning',
      true // All compliance events are compliance relevant
    );
  }, [logAction]);

  // Export audit logs
  const exportLogs = useCallback(async (filters?: AuditFilters, format: 'json' | 'csv' = 'json') => {
    try {
      setIsLoading(true);
      
      // Load all matching logs for export
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters) {
        if (filters.action_type) query = query.eq('action_type', filters.action_type);
        if (filters.resource_type) query = query.eq('resource_type', filters.resource_type);
        if (filters.user_id) query = query.eq('user_id', filters.user_id);
        if (filters.severity) query = query.eq('severity', filters.severity);
        if (filters.compliance_relevant !== undefined) query = query.eq('compliance_relevant', filters.compliance_relevant);
        if (filters.date_from) query = query.gte('timestamp', filters.date_from);
        if (filters.date_to) query = query.lte('timestamp', filters.date_to);
      }

      const { data: exportLogs, error } = await query;
      if (error) throw error;

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportLogs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const csvContent = [
          'timestamp,user_id,action_type,resource_type,resource_id,severity,compliance_relevant,details',
          ...(exportLogs || []).map(log => 
            `${log.timestamp},${log.user_id || ''},${log.action_type},${log.resource_type},${log.resource_id || ''},${log.severity},${log.compliance_relevant},${JSON.stringify(log.details)}`
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get audit statistics
  const getAuditStats = useCallback(async (timeframe: 'day' | 'week' | 'month' = 'week') => {
    try {
      const startDate = new Date();
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action_type, severity, compliance_relevant')
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        by_severity: {
          info: data?.filter(log => log.severity === 'info').length || 0,
          warning: data?.filter(log => log.severity === 'warning').length || 0,
          error: data?.filter(log => log.severity === 'error').length || 0,
          critical: data?.filter(log => log.severity === 'critical').length || 0
        },
        compliance_relevant: data?.filter(log => log.compliance_relevant).length || 0,
        by_action: data?.reduce((acc: any, log) => {
          acc[log.action_type] = (acc[log.action_type] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      return stats;
    } catch (error) {
      console.error('Error getting audit stats:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    logs,
    isLoading,
    loadLogs,
    logAction,
    logUserAction,
    logDataAccess,
    logSecurityEvent,
    logSystemEvent,
    logComplianceEvent,
    exportLogs,
    getAuditStats
  };
};