import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Database,
  Smartphone,
  CreditCard,
  Sync,
  RefreshCw
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { errorHandler } from '@/utils/errorHandler';
import { useAuth } from '@/hooks/useAuth';

interface ErrorSummary {
  category: string;
  severity: string;
  error_count: number;
  unique_users: number;
  latest_occurrence: string;
}

interface PerformanceSummary {
  page_name: string;
  action: string;
  avg_duration_ms: number;
  max_duration_ms: number;
  request_count: number;
  unique_users: number;
}

interface SystemHealth {
  totalErrors: number;
  criticalErrors: number;
  avgResponseTime: number;
  activeUsers: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
}

export const SystemMonitoringDashboard: React.FC = () => {
  const { hasPermission } = useAuth();
  const [errorSummary, setErrorSummary] = useState<ErrorSummary[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    totalErrors: 0,
    criticalErrors: 0,
    avgResponseTime: 0,
    activeUsers: 0,
    systemStatus: 'healthy'
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Check if user has admin permissions
  if (!hasPermission('reports_view')) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Je hebt geen toegang tot de systeemmonitoring. Neem contact op met een administrator.
        </AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    loadDashboardData();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        loadErrorSummary(),
        loadPerformanceSummary(),
        loadSystemHealth()
      ]);
      
      setLastRefresh(new Date());
    } catch (error: any) {
      errorHandler.handleError(error, {
        component: 'SystemMonitoringDashboard',
        action: 'loadDashboardData'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadErrorSummary = async () => {
    const { data, error } = await supabase
      .rpc('get_error_summary', { days_back: 7 });
    
    if (error) throw error;
    setErrorSummary(data || []);
  };

  const loadPerformanceSummary = async () => {
    const { data, error } = await supabase
      .rpc('get_performance_summary', { days_back: 7 });
    
    if (error) throw error;
    setPerformanceSummary(data || []);
  };

  const loadSystemHealth = async () => {
    // Get overall system metrics
    const { data: errorData } = await supabase
      .from('error_logs')
      .select('severity')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: perfData } = await supabase
      .from('performance_logs')
      .select('duration_ms')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: userCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('status', 'Actief');

    const totalErrors = errorData?.length || 0;
    const criticalErrors = errorData?.filter(e => e.severity === 'critical').length || 0;
    const avgResponseTime = perfData?.length 
      ? perfData.reduce((sum, p) => sum + p.duration_ms, 0) / perfData.length 
      : 0;
    const activeUsers = userCount?.length || 0;

    let systemStatus: SystemHealth['systemStatus'] = 'healthy';
    if (criticalErrors > 0 || avgResponseTime > 3000) {
      systemStatus = 'critical';
    } else if (totalErrors > 50 || avgResponseTime > 1500) {
      systemStatus = 'warning';
    }

    setSystemHealth({
      totalErrors,
      criticalErrors,
      avgResponseTime: Math.round(avgResponseTime),
      activeUsers,
      systemStatus
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api': return <Database className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'sync': return <Sync className="h-4 w-4" />;
      case 'auth': return <Users className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Kritiek</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Hoog</Badge>;
      case 'medium':
        return <Badge variant="secondary">Gemiddeld</Badge>;
      case 'low':
        return <Badge variant="outline">Laag</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getSystemStatusBadge = () => {
    switch (systemHealth.systemStatus) {
      case 'healthy':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Gezond
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Waarschuwing
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Kritiek
          </Badge>
        );
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading && errorSummary.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Systeemmonitoring</h2>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Laden...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Systeemmonitoring</h2>
        <div className="flex items-center gap-4">
          {getSystemStatusBadge()}
          <Button 
            onClick={loadDashboardData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totaal fouten (24u)</p>
                <p className="text-2xl font-bold">{systemHealth.totalErrors}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kritieke fouten</p>
                <p className="text-2xl font-bold text-red-600">{systemHealth.criticalErrors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gem. responstijd</p>
                <p className="text-2xl font-bold">{formatDuration(systemHealth.avgResponseTime)}</p>
              </div>
              {systemHealth.avgResponseTime > 1500 ? (
                <TrendingUp className="h-8 w-8 text-red-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actieve gebruikers</p>
                <p className="text-2xl font-bold">{systemHealth.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Fouten Overzicht</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fouten per Categorie (7 dagen)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorSummary.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    Geen fouten gevonden in de afgelopen 7 dagen!
                  </div>
                ) : (
                  errorSummary.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(error.category)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{error.category}</span>
                            {getSeverityBadge(error.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {error.unique_users} gebruiker(s) getroffen
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{error.error_count}</p>
                        <p className="text-xs text-muted-foreground">
                          Laatst: {new Date(error.latest_occurrence).toLocaleString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics (7 dagen)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceSummary.slice(0, 10).map((perf, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{perf.page_name}</p>
                      <p className="text-sm text-muted-foreground">{perf.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {perf.request_count} verzoeken • {perf.unique_users} gebruikers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Ø {formatDuration(perf.avg_duration_ms)}</p>
                      <p className="text-sm text-muted-foreground">
                        Max: {formatDuration(perf.max_duration_ms)}
                      </p>
                      <div className="w-24 mt-1">
                        <Progress 
                          value={Math.min((perf.avg_duration_ms / 3000) * 100, 100)} 
                          className="h-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground text-center">
        Laatste update: {lastRefresh.toLocaleString('nl-NL')} • 
        Automatisch vernieuwen elke 5 minuten
      </div>
    </div>
  );
};