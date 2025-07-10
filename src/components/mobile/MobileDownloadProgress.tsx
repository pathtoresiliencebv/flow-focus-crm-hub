import React from 'react';
import { Download, Pause, Play, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDownloadManager } from '@/hooks/useDownloadManager';

interface MobileDownloadProgressProps {
  compact?: boolean;
  maxVisible?: number;
}

export const MobileDownloadProgress: React.FC<MobileDownloadProgressProps> = ({
  compact = false,
  maxVisible = 3
}) => {
  const {
    tasks,
    activeDownloads,
    totalProgress,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    clearCompleted
  } = useDownloadManager();

  const activeTasks = tasks.filter(t => 
    t.status === 'downloading' || t.status === 'queued' || t.status === 'paused'
  );

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  if (activeTasks.length === 0 && completedTasks.length === 0 && failedTasks.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading':
        return <Download className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      case 'paused':
        return <Pause className="h-3 w-3 text-muted-foreground" />;
      default:
        return <Download className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <div className="bg-muted/30 border-t p-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Download className="h-3 w-3" />
            <span>Downloads ({activeDownloads})</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{totalProgress}%</span>
            {(completedTasks.length > 0 || failedTasks.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {totalProgress > 0 && (
          <Progress value={totalProgress} className="mt-1 h-1" />
        )}
      </div>
    );
  }

  return (
    <Card className="mx-4 mb-4">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="font-medium text-sm">Downloads</span>
            {activeDownloads > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeDownloads} actief
              </Badge>
            )}
          </div>
          {(completedTasks.length > 0 || failedTasks.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Overall Progress */}
        {activeTasks.length > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Totale voortgang</span>
              <span>{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>
        )}

        {/* Individual Tasks */}
        <div className="space-y-2">
          {[...activeTasks, ...completedTasks.slice(0, 2), ...failedTasks.slice(0, 1)]
            .slice(0, maxVisible)
            .map((task) => (
              <div key={task.id} className="bg-muted/30 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(task.status)}
                    <span className="text-xs font-medium truncate">
                      {task.fileName}
                    </span>
                    <Badge 
                      variant={getStatusColor(task.status) as any} 
                      className="text-xs"
                    >
                      {task.status === 'downloading' ? 'Download' :
                       task.status === 'completed' ? 'Gereed' :
                       task.status === 'failed' ? 'Fout' :
                       task.status === 'paused' ? 'Gepauzeerd' : 'Wachten'}
                    </Badge>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {task.status === 'downloading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => pauseDownload(task.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                    )}
                    {task.status === 'paused' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resumeDownload(task.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    {(task.status === 'queued' || task.status === 'downloading' || task.status === 'paused') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelDownload(task.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatFileSize(task.downloadedBytes)} / {formatFileSize(task.fileSize)}
                  </span>
                  <span>{task.progress}%</span>
                </div>

                {/* Progress Bar */}
                {task.status === 'downloading' || task.status === 'paused' ? (
                  <Progress value={task.progress} className="h-1 mt-1" />
                ) : null}

                {/* Error Message */}
                {task.status === 'failed' && task.error && (
                  <div className="mt-1 text-xs text-destructive">
                    {task.error}
                  </div>
                )}

                {/* Retry Info */}
                {task.retryCount > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Poging {task.retryCount + 1} van {task.maxRetries + 1}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Show More Indicator */}
        {tasks.length > maxVisible && (
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              +{tasks.length - maxVisible} meer...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};