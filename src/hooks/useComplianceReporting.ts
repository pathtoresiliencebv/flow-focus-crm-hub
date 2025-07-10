import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface ComplianceReport {
  id: string;
  report_type: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  data: any;
  status: 'generating' | 'completed' | 'failed';
  generated_by: string;
}

interface ComplianceMetrics {
  gdpr_compliance_score: number;
  audit_coverage: number;
  data_retention_compliance: number;
  consent_management_score: number;
  security_incidents: number;
  privacy_violations: number;
  data_breaches: number;
  user_requests_processed: number;
  automated_deletions: number;
  manual_reviews_required: number;
}

interface ComplianceViolation {
  id: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected_at: string;
  resolved_at?: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  affected_data_types: string[];
  remediation_actions: string[];
}

export const useComplianceReporting = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate compliance metrics
  const generateMetrics = useCallback(async (
    periodStart: string,
    periodEnd: string
  ): Promise<ComplianceMetrics> => {
    try {
      // Get audit logs for the period
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', periodStart)
        .lte('timestamp', periodEnd);

      // Get compliance events
      const { data: complianceEvents } = await supabase
        .from('compliance_events')
        .select('*')
        .gte('detected_at', periodStart)
        .lte('detected_at', periodEnd);

      // Get consent records
      const { data: consentRecords } = await supabase
        .from('consent_records')
        .select('*')
        .gte('given_at', periodStart)
        .lte('given_at', periodEnd);

      // Get privacy settings
      const { data: privacySettings } = await supabase
        .from('privacy_settings')
        .select('*');

      // Get data retention policies
      const { data: retentionPolicies } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('is_active', true);

      // Calculate metrics
      const totalUsers = privacySettings?.length || 0;
      const usersWithConsent = new Set(consentRecords?.map(c => c.user_id)).size;
      const activeConsents = consentRecords?.filter(c => c.is_active).length || 0;
      const securityEvents = complianceEvents?.filter(e => e.event_type.includes('security')).length || 0;
      const privacyViolations = complianceEvents?.filter(e => e.event_type.includes('privacy')).length || 0;
      const dataBreaches = complianceEvents?.filter(e => e.event_type.includes('breach')).length || 0;
      const auditCoverage = Math.min(100, (auditLogs?.length || 0) / Math.max(1, totalUsers * 10));

      return {
        gdpr_compliance_score: totalUsers > 0 ? Math.round((usersWithConsent / totalUsers) * 100) : 100,
        audit_coverage: Math.round(auditCoverage),
        data_retention_compliance: Math.min(100, (retentionPolicies?.length || 0) * 20),
        consent_management_score: Math.round((activeConsents / Math.max(1, consentRecords?.length || 1)) * 100),
        security_incidents: securityEvents,
        privacy_violations: privacyViolations,
        data_breaches: dataBreaches,
        user_requests_processed: complianceEvents?.filter(e => e.event_type.includes('request')).length || 0,
        automated_deletions: complianceEvents?.filter(e => e.event_type.includes('cleanup')).length || 0,
        manual_reviews_required: complianceEvents?.filter(e => e.remediation_required).length || 0
      };
    } catch (error) {
      console.error('Error generating compliance metrics:', error);
      throw error;
    }
  }, []);

  // Generate GDPR compliance report
  const generateGDPRReport = useCallback(async (
    periodStart: string,
    periodEnd: string
  ) => {
    setIsLoading(true);
    try {
      const metrics = await generateMetrics(periodStart, periodEnd);

      // Get detailed GDPR data
      const { data: dataExportRequests } = await supabase
        .from('privacy_settings')
        .select('data_export_requests, deletion_requests');

      const { data: consentRecords } = await supabase
        .from('consent_records')
        .select('*')
        .gte('given_at', periodStart)
        .lte('given_at', periodEnd);

      const { data: privacySettings } = await supabase
        .from('privacy_settings')
        .select('*');

      const exportRequests = dataExportRequests?.flatMap(p => p.data_export_requests || []) || [];
      const deletionRequests = dataExportRequests?.flatMap(p => p.deletion_requests || []) || [];

      const reportData = {
        period: { start: periodStart, end: periodEnd },
        metrics,
        gdpr_compliance: {
          data_subject_rights: {
            export_requests: exportRequests.length,
            deletion_requests: deletionRequests.length,
            consent_withdrawals: consentRecords?.filter(c => c.withdrawn_at).length || 0
          },
          consent_management: {
            total_consents: consentRecords?.length || 0,
            active_consents: consentRecords?.filter(c => c.is_active).length || 0,
            expired_consents: consentRecords?.filter(c => 
              c.expiry_date && new Date(c.expiry_date) < new Date()
            ).length || 0
          },
          privacy_controls: {
            users_with_settings: privacySettings?.length || 0,
            marketing_opt_ins: privacySettings?.filter(p => p.marketing_consent).length || 0,
            analytics_opt_ins: privacySettings?.filter(p => p.analytics_consent).length || 0
          }
        },
        recommendations: generateGDPRRecommendations(metrics, consentRecords || [], privacySettings || [])
      };

      const report: Omit<ComplianceReport, 'id'> = {
        report_type: 'gdpr_compliance',
        generated_at: new Date().toISOString(),
        period_start: periodStart,
        period_end: periodEnd,
        data: reportData,
        status: 'completed',
        generated_by: 'system'
      };

      const { data: savedReport, error } = await supabase
        .from('compliance_events')
        .insert([{
          event_type: 'compliance_report_generated',
          severity: 'info',
          description: 'GDPR compliance report generated',
          compliance_standard: 'GDPR',
          metadata: report
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "GDPR compliance report generated successfully"
      });

      return reportData;
    } catch (error) {
      console.error('Error generating GDPR report:', error);
      toast({
        title: "Error",
        description: "Failed to generate GDPR report",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [generateMetrics, toast]);

  // Generate audit report
  const generateAuditReport = useCallback(async (
    periodStart: string,
    periodEnd: string
  ) => {
    setIsLoading(true);
    try {
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', periodStart)
        .lte('timestamp', periodEnd)
        .order('timestamp', { ascending: false });

      const { data: complianceEvents } = await supabase
        .from('compliance_events')
        .select('*')
        .gte('detected_at', periodStart)
        .lte('detected_at', periodEnd);

      const reportData = {
        period: { start: periodStart, end: periodEnd },
        audit_summary: {
          total_events: auditLogs?.length || 0,
          by_severity: {
            info: auditLogs?.filter(log => log.severity === 'info').length || 0,
            warning: auditLogs?.filter(log => log.severity === 'warning').length || 0,
            error: auditLogs?.filter(log => log.severity === 'error').length || 0,
            critical: auditLogs?.filter(log => log.severity === 'critical').length || 0
          },
          by_action_type: auditLogs?.reduce((acc: any, log) => {
            acc[log.action_type] = (acc[log.action_type] || 0) + 1;
            return acc;
          }, {}) || {},
          compliance_relevant: auditLogs?.filter(log => log.compliance_relevant).length || 0
        },
        security_events: complianceEvents?.filter(e => e.event_type.includes('security')) || [],
        top_users_by_activity: getTopUsersByActivity(auditLogs || []),
        anomalies: detectAuditAnomalies(auditLogs || [])
      };

      toast({
        title: "Success",
        description: "Audit report generated successfully"
      });

      return reportData;
    } catch (error) {
      console.error('Error generating audit report:', error);
      toast({
        title: "Error",
        description: "Failed to generate audit report",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Generate recommendations
  const generateGDPRRecommendations = (
    metrics: ComplianceMetrics,
    consents: any[],
    privacySettings: any[]
  ): string[] => {
    const recommendations: string[] = [];

    if (metrics.gdpr_compliance_score < 80) {
      recommendations.push("Improve consent collection procedures to increase GDPR compliance score");
    }

    if (metrics.consent_management_score < 90) {
      recommendations.push("Review and update expired consent records");
    }

    if (metrics.audit_coverage < 70) {
      recommendations.push("Increase audit logging coverage across all user actions");
    }

    if (metrics.privacy_violations > 0) {
      recommendations.push("Investigate and remediate privacy violations");
    }

    if (metrics.manual_reviews_required > 10) {
      recommendations.push("Automate compliance checks to reduce manual review requirements");
    }

    const expiredConsents = consents.filter(c => 
      c.expiry_date && new Date(c.expiry_date) < new Date()
    );
    if (expiredConsents.length > 0) {
      recommendations.push(`Review ${expiredConsents.length} expired consent records`);
    }

    const usersWithoutPrivacySettings = privacySettings.length;
    if (usersWithoutPrivacySettings === 0) {
      recommendations.push("Ensure all users have privacy settings configured");
    }

    return recommendations;
  };

  // Get top users by activity
  const getTopUsersByActivity = (auditLogs: any[]): any[] => {
    const userActivity = auditLogs.reduce((acc: any, log) => {
      if (log.user_id) {
        acc[log.user_id] = (acc[log.user_id] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(userActivity)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([user_id, count]) => ({ user_id, activity_count: count }));
  };

  // Detect audit anomalies
  const detectAuditAnomalies = (auditLogs: any[]): any[] => {
    const anomalies: any[] = [];

    // Check for unusual activity patterns
    const hourlyActivity = auditLogs.reduce((acc: any, log) => {
      const hour = new Date(log.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Detect activity outside business hours (22:00 - 06:00)
    const nightActivity = Object.entries(hourlyActivity)
      .filter(([hour]) => parseInt(hour) >= 22 || parseInt(hour) <= 6)
      .reduce((sum, [, count]) => sum + (count as number), 0);

    if (nightActivity > auditLogs.length * 0.1) {
      anomalies.push({
        type: 'unusual_time_activity',
        description: `${nightActivity} activities detected outside business hours`,
        severity: 'medium'
      });
    }

    // Check for failed login attempts
    const failedLogins = auditLogs.filter(log => 
      log.action_type.includes('login') && log.severity === 'error'
    );

    if (failedLogins.length > 10) {
      anomalies.push({
        type: 'excessive_failed_logins',
        description: `${failedLogins.length} failed login attempts detected`,
        severity: 'high'
      });
    }

    return anomalies;
  };

  // Export report to file
  const exportReport = useCallback(async (
    reportData: any,
    reportType: string,
    format: 'json' | 'pdf' | 'csv' = 'json'
  ) => {
    try {
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Success",
        description: "Report exported successfully"
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Get compliance dashboard data
  const getComplianceDashboard = useCallback(async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const currentMetrics = await generateMetrics(
        thirtyDaysAgo.toISOString(),
        now.toISOString()
      );

      setMetrics(currentMetrics);

      // Get recent violations
      const { data: recentEvents } = await supabase
        .from('compliance_events')
        .select('*')
        .gte('detected_at', thirtyDaysAgo.toISOString())
        .eq('remediation_required', true)
        .order('detected_at', { ascending: false });

      const violations: ComplianceViolation[] = (recentEvents || []).map(event => ({
        id: event.id,
        violation_type: event.event_type,
        severity: event.severity as any,
        description: event.description,
        detected_at: event.detected_at,
        resolved_at: event.resolved_at,
        status: event.remediation_status === 'resolved' ? 'resolved' : 'open',
        affected_data_types: (event.metadata as any)?.affected_data_types || [],
        remediation_actions: (event.metadata as any)?.remediation_actions || []
      }));

      setViolations(violations);

      return {
        metrics: currentMetrics,
        violations: violations.filter(v => v.status === 'open'),
        recent_reports: reports.slice(0, 5),
        compliance_trend: await getComplianceTrend()
      };
    } catch (error) {
      console.error('Error getting compliance dashboard:', error);
      return null;
    }
  }, [generateMetrics, reports]);

  // Get compliance trend
  const getComplianceTrend = useCallback(async () => {
    try {
      const trends: any[] = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const endDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const weekMetrics = await generateMetrics(
          startDate.toISOString(),
          endDate.toISOString()
        );

        trends.push({
          week: endDate.toISOString().split('T')[0],
          score: Math.round((
            weekMetrics.gdpr_compliance_score +
            weekMetrics.audit_coverage +
            weekMetrics.data_retention_compliance +
            weekMetrics.consent_management_score
          ) / 4)
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting compliance trend:', error);
      return [];
    }
  }, [generateMetrics]);

  useEffect(() => {
    getComplianceDashboard();
  }, [getComplianceDashboard]);

  return {
    reports,
    metrics,
    violations,
    isLoading,
    generateGDPRReport,
    generateAuditReport,
    exportReport,
    getComplianceDashboard,
    getComplianceTrend
  };
};