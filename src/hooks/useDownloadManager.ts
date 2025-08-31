import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFileSystemManager } from './useFileSystemManager';

interface DownloadTask {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  projectId?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  downloadedBytes: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

interface DownloadManagerState {
  tasks: DownloadTask[];
  activeDownloads: number;
  maxConcurrentDownloads: number;
  totalProgress: number;
}

export const useDownloadManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { cacheFile } = useFileSystemManager();
  
  const [state, setState] = useState<DownloadManagerState>({
    tasks: [],
    activeDownloads: 0,
    maxConcurrentDownloads: 3,
    totalProgress: 0
  });

  const generateTaskId = useCallback(() => {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<DownloadTask>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    }));
  }, []);

  const calculateTotalProgress = useCallback((tasks: DownloadTask[]) => {
    if (tasks.length === 0) return 0;
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  }, []);

  const downloadFile = useCallback(async (
    url: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    options: {
      priority?: 'low' | 'medium' | 'high';
      projectId?: string;
      maxRetries?: number;
    } = {}
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const taskId = generateTaskId();
      const task: DownloadTask = {
        id: taskId,
        url,
        fileName,
        fileSize,
        fileType,
        projectId: options.projectId,
        priority: options.priority || 'medium',
        status: 'queued',
        progress: 0,
        downloadedBytes: 0,
        retryCount: 0,
        maxRetries: options.maxRetries || 3
      };

      setState(prev => {
        const newTasks = [...prev.tasks, task];
        return {
          ...prev,
          tasks: newTasks,
          totalProgress: calculateTotalProgress(newTasks)
        };
      });

      // Start download immediately if we have capacity
      if (state.activeDownloads < state.maxConcurrentDownloads) {
        processDownload(taskId, resolve, reject);
      }
    });
  }, [generateTaskId, state.activeDownloads, state.maxConcurrentDownloads, calculateTotalProgress]);

  const processDownload = useCallback(async (
    taskId: string,
    resolve: (path: string) => void,
    reject: (error: Error) => void
  ) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
      reject(new Error('Task not found'));
      return;
    }

    updateTask(taskId, { 
      status: 'downloading', 
      startedAt: new Date().toISOString() 
    });

    setState(prev => ({ ...prev, activeDownloads: prev.activeDownloads + 1 }));

    try {
      // Use fetch with AbortController for cancellation support
      const controller = new AbortController();
      const response = await fetch(task.url, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const chunks: Uint8Array[] = [];
      let downloadedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        downloadedBytes += value.length;
        
        const progress = Math.round((downloadedBytes / task.fileSize) * 100);
        updateTask(taskId, { 
          progress, 
          downloadedBytes 
        });
      }

      // Convert chunks to blob and cache
      const blob = new Blob(chunks, { type: task.fileType });
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Cache the file
      const cachedPath = await cacheFile(
        task.url,
        task.fileName,
        task.fileSize,
        task.fileType,
        task.projectId
      );

      if (!cachedPath) {
        throw new Error('Failed to cache file');
      }

      updateTask(taskId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString()
      });

      setState(prev => {
        const newTasks = prev.tasks.filter(t => t.id !== taskId);
        return {
          ...prev,
          tasks: newTasks,
          activeDownloads: prev.activeDownloads - 1,
          totalProgress: calculateTotalProgress(newTasks)
        };
      });

      resolve(cachedPath);

      // Process next queued download
      processNextDownload();

    } catch (error) {
      console.error('Download error:', error);
      
      const currentTask = state.tasks.find(t => t.id === taskId);
      if (currentTask && currentTask.retryCount < currentTask.maxRetries) {
        // Retry download
        updateTask(taskId, {
          status: 'queued',
          retryCount: currentTask.retryCount + 1,
          error: (error as Error).message
        });
        
        setState(prev => ({ ...prev, activeDownloads: prev.activeDownloads - 1 }));
        
        // Retry after delay
        setTimeout(() => {
          processDownload(taskId, resolve, reject);
        }, Math.pow(2, currentTask.retryCount) * 1000); // Exponential backoff
        
      } else {
        // Max retries reached
        updateTask(taskId, {
          status: 'failed',
          error: (error as Error).message
        });
        
        setState(prev => ({ ...prev, activeDownloads: prev.activeDownloads - 1 }));
        
        reject(error as Error);
        processNextDownload();
      }
    }
  }, [state.tasks, updateTask, cacheFile, calculateTotalProgress]);

  const processNextDownload = useCallback(() => {
    if (state.activeDownloads >= state.maxConcurrentDownloads) return;

    // Find next queued task by priority
    const queuedTasks = state.tasks
      .filter(t => t.status === 'queued')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    if (queuedTasks.length > 0) {
      const nextTask = queuedTasks[0];
      processDownload(nextTask.id, () => {}, () => {});
    }
  }, [state.activeDownloads, state.maxConcurrentDownloads, state.tasks, processDownload]);

  const pauseDownload = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'paused' });
    setState(prev => ({ ...prev, activeDownloads: prev.activeDownloads - 1 }));
  }, [updateTask]);

  const resumeDownload = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'queued' });
    processNextDownload();
  }, [updateTask, processNextDownload]);

  const cancelDownload = useCallback((taskId: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      const newTasks = prev.tasks.filter(t => t.id !== taskId);
      const activeDownloadsAdjustment = task?.status === 'downloading' ? -1 : 0;
      
      return {
        ...prev,
        tasks: newTasks,
        activeDownloads: prev.activeDownloads + activeDownloadsAdjustment,
        totalProgress: calculateTotalProgress(newTasks)
      };
    });
    
    processNextDownload();
  }, [calculateTotalProgress, processNextDownload]);

  const clearCompleted = useCallback(() => {
    setState(prev => {
      const newTasks = prev.tasks.filter(t => t.status !== 'completed' && t.status !== 'failed');
      return {
        ...prev,
        tasks: newTasks,
        totalProgress: calculateTotalProgress(newTasks)
      };
    });
  }, [calculateTotalProgress]);

  const getTasksByStatus = useCallback((status: DownloadTask['status']) => {
    return state.tasks.filter(t => t.status === status);
  }, [state.tasks]);

  const getTasksByProject = useCallback((projectId: string) => {
    return state.tasks.filter(t => t.projectId === projectId);
  }, [state.tasks]);

  return {
    tasks: state.tasks,
    activeDownloads: state.activeDownloads,
    totalProgress: state.totalProgress,
    downloadFile,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    clearCompleted,
    getTasksByStatus,
    getTasksByProject
  };
};