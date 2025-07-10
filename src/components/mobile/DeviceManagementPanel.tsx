import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeviceRegistration } from "@/hooks/useDeviceRegistration";
import { 
  Smartphone, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Eye,
  MapPin
} from "lucide-react";

export const DeviceManagementPanel = () => {
  const {
    currentDevice,
    deviceTrust,
    registeredDevices,
    updateDeviceTrust,
    removeDevice,
    getSecurityRecommendations,
    initializeDeviceRegistration
  } = useDeviceRegistration();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const getTrustLevelColor = (trustLevel: string) => {
    switch (trustLevel) {
      case 'trusted': return 'default';
      case 'new': return 'secondary';
      case 'suspicious': return 'destructive';
      case 'blocked': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTrustLevelIcon = (trustLevel: string) => {
    switch (trustLevel) {
      case 'trusted': return <CheckCircle className="h-4 w-4" />;
      case 'new': return <Clock className="h-4 w-4" />;
      case 'suspicious': return <AlertTriangle className="h-4 w-4" />;
      case 'blocked': return <Shield className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const handleUpdateTrust = async (deviceId: string, trustLevel: any) => {
    setIsLoading(true);
    try {
      await updateDeviceTrust(deviceId, trustLevel);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (confirm('Are you sure you want to remove this device? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await removeDevice(deviceId);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await initializeDeviceRegistration();
    } finally {
      setIsLoading(false);
    }
  };

  const recommendations = getSecurityRecommendations();

  return (
    <div className="space-y-4">
      {/* Current Device */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Current Device
          </CardTitle>
          <CardDescription>
            Information about the device you're currently using
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentDevice && deviceTrust ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Device Name:</span>
                  <p className="text-muted-foreground">{currentDevice.name}</p>
                </div>
                <div>
                  <span className="font-medium">Model:</span>
                  <p className="text-muted-foreground">{currentDevice.model}</p>
                </div>
                <div>
                  <span className="font-medium">Platform:</span>
                  <p className="text-muted-foreground capitalize">{currentDevice.platform}</p>
                </div>
                <div>
                  <span className="font-medium">OS Version:</span>
                  <p className="text-muted-foreground">{currentDevice.osVersion}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Trust Level:</span>
                  <Badge variant={getTrustLevelColor(deviceTrust.trustLevel)} className="flex items-center gap-1">
                    {getTrustLevelIcon(deviceTrust.trustLevel)}
                    {deviceTrust.trustLevel.charAt(0).toUpperCase() + deviceTrust.trustLevel.slice(1)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Login Count:</span>
                  <span className="text-sm font-mono">{deviceTrust.loginCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Registered:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(deviceTrust.registeredAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Last Seen:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(deviceTrust.lastSeenAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {deviceTrust.riskFactors.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="font-medium text-sm">Risk Factors:</span>
                    <div className="flex flex-wrap gap-2">
                      {deviceTrust.riskFactors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Loading device information...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Registered Devices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Registered Devices
              </CardTitle>
              <CardDescription>
                Manage all devices that have accessed your account
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {registeredDevices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No registered devices found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registeredDevices.map((device) => (
                <div key={device.deviceId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">
                        {device.deviceId === currentDevice?.id ? 'Current Device' : `Device ${device.deviceId.slice(-4)}`}
                      </span>
                    </div>
                    <Badge variant={getTrustLevelColor(device.trustLevel)} className="flex items-center gap-1">
                      {getTrustLevelIcon(device.trustLevel)}
                      {device.trustLevel.charAt(0).toUpperCase() + device.trustLevel.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>
                      <span>Registered:</span>
                      <p>{new Date(device.registeredAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span>Last Seen:</span>
                      <p>{new Date(device.lastSeenAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span>Login Count:</span>
                      <p>{device.loginCount}</p>
                    </div>
                    <div>
                      <span>Risk Factors:</span>
                      <p>{device.riskFactors.length}</p>
                    </div>
                  </div>

                  {device.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {device.location.city && device.location.country 
                          ? `${device.location.city}, ${device.location.country}`
                          : 'Location available'
                        }
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Select
                      value={device.trustLevel}
                      onValueChange={(value) => handleUpdateTrust(device.deviceId, value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trusted">Trusted</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="suspicious">Suspicious</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>

                    {device.deviceId !== currentDevice?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveDevice(device.deviceId)}
                        disabled={isLoading}
                        className="px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Security Recommendations
            </CardTitle>
            <CardDescription>
              Suggestions to improve your device security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    {recommendation}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};