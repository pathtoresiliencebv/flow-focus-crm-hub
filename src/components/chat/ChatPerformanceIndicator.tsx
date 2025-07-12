import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Zap, 
  Clock, 
  Database,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { useChatOptimizations } from '@/hooks/useChatOptimizations';
import { useNetworkAware } from '@/hooks/useNetworkAware';

export const ChatPerformanceIndicator = () => {
  const { getPerformanceReport, cleanupMemory } = useChatOptimizations();
  const { isOnline, networkQuality } = useNetworkAware();
  const [report, setReport] = useState(getPerformanceReport());

  useEffect(() => {
    const interval = setInterval(() => {
      setReport(getPerformanceReport());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getPerformanceReport]);

  const getNetworkIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />;
    
    if (networkQuality === 'excellent') return <Wifi className="h-4 w-4 text-green-500" />;
    if (networkQuality === 'poor') return <Wifi className="h-4 w-4 text-yellow-500" />;
    return <Wifi className="h-4 w-4 text-blue-500" />;
  };

  const getPerformanceColor = () => {
    if (report.stats.averageLatency < 500) return 'text-green-500';
    if (report.stats.averageLatency < 1000) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryUsageLevel = () => {
    const usage = report.stats.memoryUsage;
    if (usage < 100) return { level: 'low', color: 'bg-green-500' };
    if (usage < 300) return { level: 'medium', color: 'bg-yellow-500' };
    return { level: 'high', color: 'bg-red-500' };
  };

  const memoryUsage = getMemoryUsageLevel();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          {getNetworkIcon()}
          <Activity className={`h-4 w-4 ${getPerformanceColor()}`} />
          <Badge variant="outline" className="text-xs">
            {Math.round(report.stats.averageLatency)}ms
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Chat Performance Monitor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Network Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {getNetworkIcon()}
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Connection:</span>
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Quality:</span>
                <Badge variant="outline" className="capitalize">
                  {networkQuality}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Latency:</span>
                <span className={`text-sm font-medium ${getPerformanceColor()}`}>
                  {Math.round(report.stats.averageLatency)}ms
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Messages Sent</span>
                  <span className="text-lg font-bold">{report.stats.messagesSent}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Messages Received</span>
                  <span className="text-lg font-bold">{report.stats.messagesReceived}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Network Retries</span>
                  <span className="text-lg font-bold text-orange-500">{report.stats.networkRetries}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Memory Usage</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{report.stats.memoryUsage}</span>
                    <div className={`w-2 h-2 rounded-full ${memoryUsage.color}`} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                Memory Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cached Messages</span>
                  <span>{report.stats.memoryUsage} / 500</span>
                </div>
                <Progress 
                  value={(report.stats.memoryUsage / 500) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Cleanup:</span>
                <span className="text-sm text-muted-foreground">
                  {report.stats.lastOptimization 
                    ? new Date(report.stats.lastOptimization).toLocaleTimeString()
                    : 'Never'
                  }
                </span>
              </div>
              
              <Button 
                onClick={cleanupMemory}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                Run Memory Cleanup
              </Button>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Performance Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimization Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Optimization Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Message Batching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Memory Cleanup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Network Retry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Adaptive Quality</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};