import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { useChatIntegrationTest } from '@/hooks/useChatIntegrationTest';

export const ChatTestingPanel = () => {
  const {
    testSuite,
    runIntegrationTests,
    getPerformanceMetrics,
    resetTests,
    isTestingSupported
  } = useChatIntegrationTest();

  const [showDetails, setShowDetails] = useState(false);

  if (!isTestingSupported) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Chat Integration Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please log in to access integration testing features.
          </p>
        </CardContent>
      </Card>
    );
  }

  const performanceMetrics = getPerformanceMetrics();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Chat Integration Testing & Performance
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <Button 
            onClick={runIntegrationTests}
            disabled={testSuite.isRunning}
            variant="default"
          >
            {testSuite.isRunning ? 'Running Tests...' : 'Run Integration Tests'}
          </Button>
          <Button onClick={resetTests} variant="outline">
            Reset Tests
          </Button>
          <Button 
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {testSuite.totalTests > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Test Progress</span>
                      <span>{testSuite.passedTests}/{testSuite.totalTests}</span>
                    </div>
                    <Progress 
                      value={(testSuite.passedTests / testSuite.totalTests) * 100} 
                      className="h-2"
                    />
                  </div>
                  <Badge variant={testSuite.overallScore >= 80 ? "default" : "destructive"}>
                    {testSuite.overallScore}% Score
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Passed</span>
                    </div>
                    <p className="text-2xl font-bold">{testSuite.passedTests}</p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Failed</span>
                    </div>
                    <p className="text-2xl font-bold">{testSuite.totalTests - testSuite.passedTests}</p>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Avg Duration</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {testSuite.results.length > 0 
                        ? Math.round(testSuite.results.reduce((sum, r) => sum + r.duration, 0) / testSuite.results.length)
                        : 0}ms
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {testSuite.totalTests === 0 && !testSuite.isRunning && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No tests have been run yet. Click "Run Integration Tests" to start.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {testSuite.results.map((result, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{result.testName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{result.duration}ms</Badge>
                        <Badge variant={result.passed ? "default" : "destructive"}>
                          {result.passed ? "PASS" : "FAIL"}
                        </Badge>
                      </div>
                    </div>
                    {showDetails && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {result.message}
                      </p>
                    )}
                  </Card>
                ))}
                
                {testSuite.isRunning && (
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Running tests...</span>
                    </div>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3">Store Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Channels:</span>
                    <Badge variant="outline">{performanceMetrics.storeSize.channels}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Users:</span>
                    <Badge variant="outline">{performanceMetrics.storeSize.availableUsers}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Messages:</span>
                    <Badge variant="outline">{performanceMetrics.storeSize.totalMessages}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Subscriptions:</span>
                    <Badge variant="outline">{performanceMetrics.storeSize.subscriptions}</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-3">Memory Usage</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Unread Counts:</span>
                    <Badge variant="outline">{performanceMetrics.memory.unreadCounts}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Typing Users:</span>
                    <Badge variant="outline">{performanceMetrics.memory.typingUsers}</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-3">Real-time Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Connected:</span>
                    <Badge variant={performanceMetrics.realtime.connected ? "default" : "destructive"}>
                      {performanceMetrics.realtime.connected ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <Badge variant="outline">{performanceMetrics.realtime.features}</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-3">Optimization Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Store Efficiency:</span>
                    <Badge variant="default">
                      {performanceMetrics.storeSize.totalMessages < 1000 ? "Optimal" : "Consider cleanup"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Health:</span>
                    <Badge variant="default">
                      {performanceMetrics.memory.unreadCounts < 50 ? "Good" : "Monitor"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};