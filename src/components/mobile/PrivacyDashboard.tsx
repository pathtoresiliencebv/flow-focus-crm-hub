import React from 'react';
import { Shield, FileText, Settings, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrivacyControls } from '@/hooks/usePrivacyControls';

export const PrivacyDashboard = () => {
  const { 
    privacySettings, 
    consentRecords, 
    getPrivacyDashboard,
    exportUserData,
    requestDataExport,
    requestDataDeletion
  } = usePrivacyControls();

  const dashboardData = getPrivacyDashboard();

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Privacy Dashboard</h2>
      </div>

      {/* Privacy Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Data Sharing Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Marketing</span>
              <Badge variant={dashboardData.data_sharing.marketing_consent ? "default" : "secondary"}>
                {dashboardData.data_sharing.marketing_consent ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Analytics</span>
              <Badge variant={dashboardData.data_sharing.analytics_consent ? "default" : "secondary"}>
                {dashboardData.data_sharing.analytics_consent ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Consent Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Active Consents</span>
              <span className="font-medium">{dashboardData.consent_summary.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Expired</span>
              <span className="font-medium text-warning">{dashboardData.consent_summary.expired}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data Rights</CardTitle>
          <CardDescription>Exercise your GDPR data rights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => exportUserData('json')}
          >
            <Download className="mr-2 h-4 w-4" />
            Export My Data
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => requestDataExport(['all'], 'json')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Request Data Copy
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive"
            onClick={() => requestDataDeletion(['all'], 'User requested deletion')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Delete My Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};