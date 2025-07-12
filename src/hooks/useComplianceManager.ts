import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComplianceEvent {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  user_id?: string;
  resource_affected?: string;
  compliance_standard?: string;
  remediation_required: boolean;
  remediation_status: string;
  detected_at: string;
  resolved_at?: string;
  metadata: any;
}

interface ComplianceStatus {
  gdpr_compliance: number;
  audit_coverage: number;
  privacy_controls: number;
  data_retention: number;
  overall_score: number;
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  standard: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  check_function: string;
  remediation_steps: string[];
}

export const useComplianceManager = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load compliance events
  const loadEvents = useCallback(async (filters?: {
    severity?: string;
    event_type?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('compliance_events')
        .select('*')
        .order('detected_at', { ascending: false });

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.date_from) {
        query = query.gte('detected_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('detected_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading compliance events:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance events",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Log compliance event
  const logEvent = useCallback(async (event: Omit<ComplianceEvent, 'id' | 'detected_at'>) => {
    try {
      const { error } = await supabase
        .from('compliance_events')
        .insert([{
          ...event,
          detected_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Reload events
      await loadEvents();

      if (event.severity === 'critical' || event.severity === 'high') {
        toast({
          title: "Compliance Alert",
          description: event.description,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error logging compliance event:', error);
      toast({
        title: "Error",
        description: "Failed to log compliance event",
        variant: "destructive"
      });
    }
  }, [loadEvents, toast]);

  // Calculate compliance status
  const calculateComplianceStatus = useCallback(async () => {
    try {
      // Get various compliance metrics
      const { data: privacySettings } = await supabase
        .from('privacy_settings')
        .select('*');

      const { data: consentRecords } = await supabase
        .from('consent_records')
        .select('*')
        .eq('is_active', true);

      const { data: retentionPolicies } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('is_active', true);

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate scores (simplified scoring logic)
      const gdpr_compliance = Math.min(100, (consentRecords?.length || 0) * 10);
      const audit_coverage = Math.min(100, (auditLogs?.length || 0) / 10);
      const privacy_controls = Math.min(100, (privacySettings?.length || 0) * 20);
      const data_retention = Math.min(100, (retentionPolicies?.length || 0) * 25);
      const overall_score = Math.round((gdpr_compliance + audit_coverage + privacy_controls + data_retention) / 4);

      setStatus({
        gdpr_compliance,
        audit_coverage,
        privacy_controls,
        data_retention,
        overall_score
      });
    } catch (error) {
      console.error('Error calculating compliance status:', error);
    }
  }, []);

  // Resolve compliance event
  const resolveEvent = useCallback(async (eventId: string, resolution_notes?: string) => {
    try {
      const { error } = await supabase
        .from('compliance_events')
        .update({
          remediation_status: 'resolved',
          resolved_at: new Date().toISOString(),
          metadata: {
            resolution_notes
          }
        })
        .eq('id', eventId);

      if (error) throw error;

      await loadEvents();
      toast({
        title: "Success",
        description: "Compliance event resolved successfully"
      });
    } catch (error) {
      console.error('Error resolving compliance event:', error);
      toast({
        title: "Error",
        description: "Failed to resolve compliance event",
        variant: "destructive"
      });
    }
  }, [loadEvents, toast]);

  // Run compliance checks
  const runComplianceChecks = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check for missing privacy settings
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');

      const { data: privacySettings } = await supabase
        .from('privacy_settings')
        .select('user_id');

      const profileIds = profiles?.map(p => p.id) || [];
      const privacyUserIds = privacySettings?.map(p => p.user_id) || [];
      const missingPrivacySettings = profileIds.filter(id => !privacyUserIds.includes(id));

      if (missingPrivacySettings.length > 0) {
        await logEvent({
          event_type: 'missing_privacy_settings',
          severity: 'medium',
          description: `${missingPrivacySettings.length} users missing privacy settings`,
          compliance_standard: 'GDPR',
          remediation_required: true,
          remediation_status: 'pending',
          metadata: { missing_users: missingPrivacySettings }
        });
      }

      // Check for expired consents
      const { data: expiredConsents } = await supabase
        .from('consent_records')
        .select('*')
        .eq('is_active', true)
        .lt('expiry_date', new Date().toISOString());

      if (expiredConsents && expiredConsents.length > 0) {
        await logEvent({
          event_type: 'expired_consents',
          severity: 'high',
          description: `${expiredConsents.length} consent records have expired`,
          compliance_standard: 'GDPR',
          remediation_required: true,
          remediation_status: 'pending',
          metadata: { expired_consents: expiredConsents.map(c => c.id) }
        });
      }

      await calculateComplianceStatus();
      toast({
        title: "Success",
        description: "Compliance checks completed"
      });
    } catch (error) {
      console.error('Error running compliance checks:', error);
      toast({
        title: "Error",
        description: "Failed to run compliance checks",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [logEvent, calculateComplianceStatus, toast]);

  // Export compliance report
  const exportComplianceReport = useCallback(async (format: 'json' | 'csv' = 'json') => {
    try {
      const reportData = {
        generated_at: new Date().toISOString(),
        status,
        events: events.slice(0, 100), // Last 100 events
        summary: {
          total_events: events.length,
          critical_events: events.filter(e => e.severity === 'critical').length,
          high_events: events.filter(e => e.severity === 'high').length,
          unresolved_events: events.filter(e => e.remediation_status === 'pending').length
        }
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Success",
        description: "Compliance report exported successfully"
      });
    } catch (error) {
      console.error('Error exporting compliance report:', error);
      toast({
        title: "Error",
        description: "Failed to export compliance report",
        variant: "destructive"
      });
    }
  }, [status, events, toast]);

  useEffect(() => {
    loadEvents();
    calculateComplianceStatus();
  }, [loadEvents, calculateComplianceStatus]);

  return {
    events,
    status,
    rules,
    isLoading,
    loadEvents,
    logEvent,
    resolveEvent,
    runComplianceChecks,
    exportComplianceReport,
    calculateComplianceStatus
  };
};