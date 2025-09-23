# Offline Sync Strategie - Smans CRM Mobile App

## Offline-First Architectuur

### Kern Principes
1. **App werkt altijd** - Ook zonder internetverbinding
2. **Data consistency** - Lokale en remote data blijven gesynchroniseerd
3. **Conflict resolution** - Elegante afhandeling van data conflicts
4. **Performance** - Snelle respons door lokale data access
5. **User experience** - Transparante sync zonder gebruikersinterruptie

## Data Storage Strategie

### Lokale Database (SQLite)
```sql
-- Sync metadata table
CREATE TABLE sync_metadata (
  table_name TEXT PRIMARY KEY,
  last_sync_timestamp TEXT,
  sync_token TEXT,
  pending_operations INTEGER DEFAULT 0
);

-- Sync queue voor offline operaties
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL, -- CREATE, UPDATE, DELETE
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  local_data TEXT NOT NULL, -- JSON data
  timestamp TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  priority INTEGER DEFAULT 0 -- Higher = more important
);
```

### Data Partitioning
- **User-specific data**: Projects, tasks, time registrations
- **Shared data**: Company settings, templates
- **Media files**: Photos, documents (separate storage strategy)

## Sync Mechanisme

### 1. Initial Sync (First App Launch)
```typescript
export class InitialSyncService {
  async performInitialSync(userId: string): Promise<void> {
    // 1. Download user's assigned projects
    await this.syncUserProjects(userId);
    
    // 2. Download project tasks and materials
    await this.syncProjectDetails();
    
    // 3. Download company settings
    await this.syncCompanyData();
    
    // 4. Mark initial sync complete
    await this.markInitialSyncComplete();
  }
}
```

### 2. Incremental Sync
```typescript
export class IncrementalSyncService {
  async performIncrementalSync(): Promise<void> {
    try {
      // 1. Upload pending local changes
      await this.uploadPendingOperations();
      
      // 2. Download remote changes since last sync
      await this.downloadRemoteChanges();
      
      // 3. Resolve any conflicts
      await this.resolveConflicts();
      
      // 4. Update sync timestamps
      await this.updateSyncMetadata();
    } catch (error) {
      console.error('Sync failed:', error);
      // Retry logic here
    }
  }
}
```

### 3. Real-time Updates (When Online)
```typescript
export class RealtimeSyncService {
  setupRealtimeSubscriptions(): void {
    // Project updates
    supabase
      .channel('project-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => this.handleProjectUpdate(payload)
      )
      .subscribe();
      
    // New assignments
    supabase
      .channel('project-assignments')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_assignments' },
        (payload) => this.handleNewAssignment(payload)
      )
      .subscribe();
  }
}
```

## Conflict Resolution

### Conflict Types
1. **Update conflicts**: Same record modified locally and remotely
2. **Delete conflicts**: Record deleted remotely but modified locally
3. **Business logic conflicts**: Status changes that conflict with business rules

### Resolution Strategies
```typescript
export enum ConflictResolution {
  CLIENT_WINS = 'client_wins',
  SERVER_WINS = 'server_wins', 
  MERGE_FIELDS = 'merge_fields',
  USER_CHOICE = 'user_choice',
  BUSINESS_RULES = 'business_rules'
}

export class ConflictResolver {
  async resolveProjectConflict(
    localProject: Project,
    remoteProject: Project
  ): Promise<Project> {
    // Business rule: If project is completed remotely, server wins
    if (remoteProject.status === 'completed') {
      return remoteProject;
    }
    
    // Merge non-conflicting fields
    return {
      ...remoteProject,
      // Keep local progress updates
      progress_percentage: localProject.progress_percentage,
      last_activity: localProject.last_activity,
      // Merge completed tasks
      completed_tasks: this.mergeCompletedTasks(
        localProject.completed_tasks,
        remoteProject.completed_tasks
      )
    };
  }
}
```

## Network Detection & Queue Management

### Network Status Monitoring
```typescript
export class NetworkManager {
  private isOnline: boolean = true;
  private syncQueue: SyncOperation[] = [];
  
  async monitorNetworkStatus(): Promise<void> {
    const networkState = await NetInfo.fetch();
    this.isOnline = networkState.isConnected;
    
    if (this.isOnline && this.syncQueue.length > 0) {
      await this.processSyncQueue();
    }
  }
  
  async processSyncQueue(): Promise<void> {
    // Sort by priority and timestamp
    const sortedQueue = this.syncQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    for (const operation of sortedQueue) {
      try {
        await this.executeOperation(operation);
        await this.removeFromQueue(operation.id);
      } catch (error) {
        await this.handleOperationError(operation, error);
      }
    }
  }
}
```

## Data Synchronization Patterns

### 1. Optimistic Updates
```typescript
export class OptimisticUpdateService {
  async updateTaskCompletion(taskId: string, completed: boolean): Promise<void> {
    // 1. Update local database immediately
    await this.localDB.updateTask(taskId, { completed, updated_at: new Date() });
    
    // 2. Update UI state
    this.taskStore.updateTask(taskId, { completed });
    
    // 3. Queue for remote sync
    await this.queueOperation({
      type: 'UPDATE',
      table: 'project_tasks',
      record_id: taskId,
      data: { completed, updated_at: new Date().toISOString() }
    });
    
    // 4. Attempt immediate sync if online
    if (this.networkManager.isOnline) {
      await this.syncSingleOperation(taskId);
    }
  }
}
```

### 2. Batch Operations
```typescript
export class BatchSyncService {
  async syncMaterialsBatch(materials: Material[]): Promise<void> {
    const batchSize = 10;
    const batches = this.chunkArray(materials, batchSize);
    
    for (const batch of batches) {
      try {
        await this.uploadMaterialsBatch(batch);
      } catch (error) {
        // Add failed batch back to queue
        for (const material of batch) {
          await this.queueMaterialOperation(material);
        }
      }
    }
  }
}
```

## Media File Sync Strategy

### Upload Strategy
```typescript
export class MediaSyncService {
  async syncMediaFiles(): Promise<void> {
    const pendingUploads = await this.getPendingMediaUploads();
    
    for (const mediaFile of pendingUploads) {
      try {
        // 1. Compress image if needed
        const compressedUri = await this.compressImage(mediaFile.uri);
        
        // 2. Upload to Supabase Storage
        const uploadPath = await this.uploadToStorage(compressedUri, mediaFile);
        
        // 3. Update database with storage URL
        await this.updateMediaRecord(mediaFile.id, uploadPath);
        
        // 4. Delete local file if upload successful
        await this.cleanupLocalFile(mediaFile.uri);
        
      } catch (error) {
        // Retry logic or mark for later
        await this.markUploadFailed(mediaFile.id, error.message);
      }
    }
  }
  
  private async compressImage(uri: string): Promise<string> {
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
  }
}
```

## Performance Optimizations

### 1. Lazy Loading
```typescript
export class LazyDataLoader {
  async loadProjectDetails(projectId: string): Promise<Project> {
    // Load basic project info first
    let project = await this.localDB.getProject(projectId);
    
    // Load additional details on demand
    if (!project.tasks_loaded) {
      project.tasks = await this.localDB.getProjectTasks(projectId);
      project.tasks_loaded = true;
    }
    
    if (!project.materials_loaded) {
      project.materials = await this.localDB.getProjectMaterials(projectId);
      project.materials_loaded = true;
    }
    
    return project;
  }
}
```

### 2. Background Sync
```typescript
export class BackgroundSyncService {
  async registerBackgroundSync(): Promise<void> {
    await BackgroundFetch.registerTaskAsync('background-sync', {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
  
  async performBackgroundSync(): Promise<void> {
    try {
      // Quick sync of critical data only
      await this.syncCriticalData();
      
      // Upload time registrations
      await this.syncTimeRegistrations();
      
      // Upload completed tasks
      await this.syncCompletedTasks();
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  }
}
```

## Error Handling & Recovery

### Retry Logic
```typescript
export class RetryManager {
  private readonly maxRetries = 3;
  private readonly backoffMultiplier = 2;
  private readonly baseDelay = 1000; // 1 second
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt);
          await this.sleep(delay);
        }
      }
    }
    
    // Mark operation as failed after max retries
    await this.markOperationFailed(operationId, lastError.message);
    throw lastError;
  }
}
```

## Data Integrity Checks

### Validation & Checksums
```typescript
export class DataIntegrityService {
  async validateSyncData(data: any): Promise<boolean> {
    // Basic validation
    if (!data.id || !data.updated_at) {
      return false;
    }
    
    // Business logic validation
    if (data.table === 'projects' && !data.customer_name) {
      return false;
    }
    
    return true;
  }
  
  async generateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return await this.hashString(jsonString);
  }
}
```

## Monitoring & Analytics

### Sync Performance Tracking
```typescript
export class SyncAnalytics {
  async trackSyncOperation(operation: SyncOperation): Promise<void> {
    const metrics = {
      operation_type: operation.type,
      table_name: operation.table_name,
      duration: operation.duration,
      success: operation.success,
      retry_count: operation.retry_count,
      error_message: operation.error_message,
      timestamp: new Date().toISOString()
    };
    
    // Store locally for later upload
    await this.storeMetrics(metrics);
  }
}
```
