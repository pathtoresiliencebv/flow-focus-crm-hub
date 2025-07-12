import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useAuditLogger } from './useAuditLogger';

interface PrivacySettings {
  id: string;
  user_id: string;
  data_processing_consent: any;
  marketing_consent: boolean;
  analytics_consent: boolean;
  third_party_sharing: boolean;
  data_export_requests: any[];
  deletion_requests: any[];
  privacy_preferences: any;
  created_at: string;
  updated_at: string;
}

interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: string;
  purpose: string;
  given_at: string;
  withdrawn_at?: string;
  is_active: boolean;
  consent_source?: string;
  legal_basis?: string;
  data_categories: string[];
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

interface DataExportRequest {
  id: string;
  requested_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data_types: string[];
  format: 'json' | 'csv' | 'pdf';
  download_url?: string;
  expires_at?: string;
}

interface DataDeletionRequest {
  id: string;
  requested_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data_types: string[];
  reason?: string;
  completed_at?: string;
}

export const usePrivacyControls = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logComplianceEvent, logUserAction } = useAuditLogger();
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user privacy settings
  const loadPrivacySettings = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPrivacySettings({
          ...data,
          data_export_requests: data.data_export_requests as any[] || [],
          deletion_requests: data.deletion_requests as any[] || []
        });
      } else {
        // Create default privacy settings
        const defaultSettings = {
          user_id: user.id,
          data_processing_consent: {},
          marketing_consent: false,
          analytics_consent: false,
          third_party_sharing: false,
          data_export_requests: [],
          deletion_requests: [],
          privacy_preferences: {}
        };

        const { data: newSettings, error: createError } = await supabase
          .from('privacy_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        setPrivacySettings({
          ...newSettings,
          data_export_requests: newSettings.data_export_requests as any[] || [],
          deletion_requests: newSettings.deletion_requests as any[] || []
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Load consent records
  const loadConsentRecords = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', user.id)
        .order('given_at', { ascending: false });

      if (error) throw error;
      setConsentRecords(data || []);
    } catch (error) {
      console.error('Error loading consent records:', error);
    }
  }, [user]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (updates: Partial<PrivacySettings>) => {
    if (!user?.id || !privacySettings) return;

    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPrivacySettings({
        ...data,
        data_export_requests: data.data_export_requests as any[] || [],
        deletion_requests: data.deletion_requests as any[] || []
      });
      await logUserAction('privacy_settings_updated', updates);

      toast({
        title: "Success",
        description: "Privacy settings updated successfully"
      });

      return data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive"
      });
      throw error;
    }
  }, [user, privacySettings, logUserAction, toast]);

  // Give consent
  const giveConsent = useCallback(async (
    consent_type: string,
    purpose: string,
    data_categories: string[],
    legal_basis: string = 'consent',
    expiry_days?: number
  ) => {
    if (!user?.id) return;

    try {
      const expiry_date = expiry_days 
        ? new Date(Date.now() + expiry_days * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const { data, error } = await supabase
        .from('consent_records')
        .insert([{
          user_id: user.id,
          consent_type,
          purpose,
          data_categories,
          legal_basis,
          expiry_date,
          consent_source: 'user_interface',
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      await loadConsentRecords();
      await logComplianceEvent('consent_given', 'consent_record', data.id, {
        consent_type,
        purpose,
        data_categories
      });

      toast({
        title: "Success",
        description: "Consent recorded successfully"
      });

      return data;
    } catch (error) {
      console.error('Error giving consent:', error);
      toast({
        title: "Error",
        description: "Failed to record consent",
        variant: "destructive"
      });
      throw error;
    }
  }, [user, loadConsentRecords, logComplianceEvent, toast]);

  // Withdraw consent
  const withdrawConsent = useCallback(async (consentId: string, reason?: string) => {
    try {
      const { data, error } = await supabase
        .from('consent_records')
        .update({
          is_active: false,
          withdrawn_at: new Date().toISOString()
        })
        .eq('id', consentId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      await loadConsentRecords();
      await logComplianceEvent('consent_withdrawn', 'consent_record', consentId, { reason });

      toast({
        title: "Success",
        description: "Consent withdrawn successfully"
      });

      return data;
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw consent",
        variant: "destructive"
      });
      throw error;
    }
  }, [user, loadConsentRecords, logComplianceEvent, toast]);

  // Request data export (GDPR Article 20)
  const requestDataExport = useCallback(async (
    data_types: string[],
    format: 'json' | 'csv' | 'pdf' = 'json'
  ) => {
    if (!user?.id) return;

    try {
      const exportRequest: DataExportRequest = {
        id: crypto.randomUUID(),
        requested_at: new Date().toISOString(),
        status: 'pending',
        data_types,
        format
      };

      // Update privacy settings with new export request
      const currentRequests = privacySettings?.data_export_requests || [];
      await updatePrivacySettings({
        data_export_requests: [...currentRequests, exportRequest]
      });

      await logComplianceEvent('data_export_requested', 'user_data', undefined, {
        data_types,
        format,
        request_id: exportRequest.id
      });

      toast({
        title: "Success",
        description: "Data export request submitted. You will be notified when ready."
      });

      return exportRequest;
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast({
        title: "Error",
        description: "Failed to submit data export request",
        variant: "destructive"
      });
      throw error;
    }
  }, [user, privacySettings, updatePrivacySettings, logComplianceEvent, toast]);

  // Request data deletion (GDPR Article 17)
  const requestDataDeletion = useCallback(async (
    data_types: string[],
    reason?: string
  ) => {
    if (!user?.id) return;

    try {
      const deletionRequest: DataDeletionRequest = {
        id: crypto.randomUUID(),
        requested_at: new Date().toISOString(),
        status: 'pending',
        data_types,
        reason
      };

      // Update privacy settings with new deletion request
      const currentRequests = privacySettings?.deletion_requests || [];
      await updatePrivacySettings({
        deletion_requests: [...currentRequests, deletionRequest]
      });

      await logComplianceEvent('data_deletion_requested', 'user_data', undefined, {
        data_types,
        reason,
        request_id: deletionRequest.id
      });

      toast({
        title: "Success",
        description: "Data deletion request submitted. This will be processed according to our data retention policy."
      });

      return deletionRequest;
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      toast({
        title: "Error",
        description: "Failed to submit data deletion request",
        variant: "destructive"
      });
      throw error;
    }
  }, [user, privacySettings, updatePrivacySettings, logComplianceEvent, toast]);

  // Export user data
  const exportUserData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Collect all user data
      const userData: any = {
        user_profile: {},
        privacy_settings: privacySettings,
        consent_records: consentRecords
      };

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      userData.user_profile = profile;

      // Get user's projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      userData.projects = projects;

      // Get user's chat messages
      const { data: messages } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

      userData.messages = messages;

      // Get user's audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id);

      userData.audit_logs = auditLogs;

      // Generate export file
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      await logComplianceEvent('data_exported', 'user_data', undefined, { format });

      toast({
        title: "Success",
        description: "User data exported successfully"
      });
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast({
        title: "Error",
        description: "Failed to export user data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, privacySettings, consentRecords, logComplianceEvent, toast]);

  // Get privacy dashboard data
  const getPrivacyDashboard = useCallback(() => {
    const activeConsents = consentRecords.filter(c => c.is_active);
    const expiredConsents = consentRecords.filter(c => 
      c.expiry_date && new Date(c.expiry_date) < new Date()
    );

    return {
      privacy_settings: privacySettings,
      consent_summary: {
        total: consentRecords.length,
        active: activeConsents.length,
        expired: expiredConsents.length,
        by_type: activeConsents.reduce((acc: any, consent) => {
          acc[consent.consent_type] = (acc[consent.consent_type] || 0) + 1;
          return acc;
        }, {})
      },
      pending_requests: {
        export_requests: exportRequests.filter(r => r.status === 'pending').length,
        deletion_requests: deletionRequests.filter(r => r.status === 'pending').length
      },
      data_sharing: {
        marketing_consent: privacySettings?.marketing_consent || false,
        analytics_consent: privacySettings?.analytics_consent || false,
        third_party_sharing: privacySettings?.third_party_sharing || false
      }
    };
  }, [privacySettings, consentRecords, exportRequests, deletionRequests]);

  useEffect(() => {
    if (user?.id) {
      loadPrivacySettings();
      loadConsentRecords();
    }
  }, [user, loadPrivacySettings, loadConsentRecords]);

  return {
    privacySettings,
    consentRecords,
    exportRequests,
    deletionRequests,
    isLoading,
    loadPrivacySettings,
    updatePrivacySettings,
    giveConsent,
    withdrawConsent,
    requestDataExport,
    requestDataDeletion,
    exportUserData,
    getPrivacyDashboard
  };
};