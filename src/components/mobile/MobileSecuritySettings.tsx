import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useSecurityService } from "@/hooks/useSecurityService";
import { useSecureApiClient } from "@/hooks/useSecureApiClient";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  AlertTriangle,
  Activity,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";

export const MobileSecuritySettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    securityConfig,
    securityMetrics,
    updateSecurityConfig,
    wipeSensitiveData,
    initializeSecurity
  } = useSecurityService();
  
  const { getSecurityMetrics, clearLogs } = useSecureApiClient();

  const apiMetrics = getSecurityMetrics();

  const handleConfigUpdate = async (key: keyof typeof securityConfig, value: any) => {
    setIsLoading(true);
    try {
      await updateSecurityConfig({ [key]: value });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWipeData = async () => {
    if (confirm('Are you sure you want to wipe all sensitive data? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await wipeSensitiveData();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetSecurity = async () => {
    setIsLoading(true);
    try {
      await initializeSecurity();
    } finally {
      setIsLoading(false);
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Current security configuration and metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Security Level</span>
            <Badge variant={getSecurityLevelColor(securityMetrics.securityLevel)}>
              {securityMetrics.securityLevel.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Encryption Status</span>
            <div className="flex items-center gap-2">
              {securityMetrics.encryptionStatus === 'active' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm capitalize">
                {securityMetrics.encryptionStatus}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Failed Attempts</span>
            <span className="text-sm font-mono">
              {securityMetrics.failedAttempts}/{securityConfig.maxFailedAttempts}
            </span>
          </div>
          
          {securityMetrics.lastActivity && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Activity</span>
              <span className="text-sm text-muted-foreground">
                {securityMetrics.lastActivity.toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Configuration
          </CardTitle>
          <CardDescription>
            Configure security features and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Data Encryption</label>
              <p className="text-xs text-muted-foreground">
                Encrypt sensitive data in local storage
              </p>
            </div>
            <Switch
              checked={securityConfig.encryptionEnabled}
              onCheckedChange={(checked) => 
                handleConfigUpdate('encryptionEnabled', checked)
              }
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Biometric Authentication</label>
              <p className="text-xs text-muted-foreground">
                Use fingerprint/face recognition for app access
              </p>
            </div>
            <Switch
              checked={securityConfig.biometricEnabled}
              onCheckedChange={(checked) => 
                handleConfigUpdate('biometricEnabled', checked)
              }
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">PIN for Sensitive Data</label>
              <p className="text-xs text-muted-foreground">
                Require PIN for accessing sensitive information
              </p>
            </div>
            <Switch
              checked={securityConfig.requirePinForSensitiveData}
              onCheckedChange={(checked) => 
                handleConfigUpdate('requirePinForSensitiveData', checked)
              }
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">Session Timeout</label>
            <p className="text-xs text-muted-foreground">
              Automatically logout after {securityConfig.sessionTimeout} minutes of inactivity
            </p>
            <select
              value={securityConfig.sessionTimeout}
              onChange={(e) => 
                handleConfigUpdate('sessionTimeout', parseInt(e.target.value))
              }
              className="w-full p-2 border rounded text-sm"
              disabled={isLoading}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* API Security Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Security Metrics
          </CardTitle>
          <CardDescription>
            Network security and API request statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {apiMetrics.successfulRequests}
              </div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {apiMetrics.failedRequests}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span>{apiMetrics.successRate.toFixed(1)}%</span>
            </div>
            <Progress value={apiMetrics.successRate} className="h-2" />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Encrypted: {apiMetrics.encryptedRequests}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Sensitive: {apiMetrics.sensitiveRequests}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security Actions
          </CardTitle>
          <CardDescription>
            Emergency and maintenance security actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleResetSecurity}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reinitialize Security
          </Button>

          <Button
            onClick={clearLogs}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Security Logs
          </Button>

          <Button
            onClick={handleWipeData}
            variant="destructive"
            className="w-full"
            disabled={isLoading}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Data Wipe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};