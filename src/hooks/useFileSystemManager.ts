import { useState, useCallback, useEffect } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CachedFile {
  id: string;
  originalUrl: string;
  localPath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  projectId?: string;
  category: 'image' | 'document' | 'video' | 'audio' | 'other';
  cachedAt: string;
  lastAccessed: string;
  thumbnailPath?: string;
  metadata?: Record<string, any>;
}

interface CacheStats {
  totalFiles: number;
  totalSize: number;
  availableSpace: number;
  cacheHitRate: number;
}

interface FileSystemDB {
  getCachedFiles(): Promise<CachedFile[]>;
  addCachedFile(file: CachedFile): Promise<void>;
  updateFileAccess(fileId: string): Promise<void>;
  removeCachedFile(fileId: string): Promise<void>;
  getCacheStats(): Promise<CacheStats>;
  cleanupOldFiles(maxAge: number): Promise<number>;
}

class FileSystemDatabase implements FileSystemDB {
  private dbName = 'file-cache';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cached_files')) {
          const store = db.createObjectStore('cached_files', { keyPath: 'id' });
          store.createIndex('originalUrl', 'originalUrl', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  }

  async getCachedFiles(): Promise<CachedFile[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_files'], 'readonly');
      const store = transaction.objectStore('cached_files');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addCachedFile(file: CachedFile): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_files'], 'readwrite');
      const store = transaction.objectStore('cached_files');
      const request = store.add(file);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateFileAccess(fileId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_files'], 'readwrite');
      const store = transaction.objectStore('cached_files');
      const getRequest = store.get(fileId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
          file.lastAccessed = new Date().toISOString();
          const putRequest = store.put(file);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  async removeCachedFile(fileId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_files'], 'readwrite');
      const store = transaction.objectStore('cached_files');
      const request = store.delete(fileId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCacheStats(): Promise<CacheStats> {
    const files = await this.getCachedFiles();
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
    
    // Estimate available space (simplified)
    const estimatedSpace = 100 * 1024 * 1024; // 100MB estimate
    
    return {
      totalFiles,
      totalSize,
      availableSpace: Math.max(0, estimatedSpace - totalSize),
      cacheHitRate: 0 // Would need hit/miss tracking for accurate rate
    };
  }

  async cleanupOldFiles(maxAge: number): Promise<number> {
    const files = await this.getCachedFiles();
    const cutoffDate = new Date(Date.now() - maxAge);
    const oldFiles = files.filter(file => 
      new Date(file.lastAccessed) < cutoffDate
    );

    let removedCount = 0;
    for (const file of oldFiles) {
      try {
        await this.removeCachedFile(file.id);
        removedCount++;
      } catch (error) {
        console.error('Error removing old file:', error);
      }
    }

    return removedCount;
  }
}

export const useFileSystemManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalFiles: 0,
    totalSize: 0,
    availableSpace: 0,
    cacheHitRate: 0
  });
  const [db] = useState(() => new FileSystemDatabase());

  // Initialize database
  useEffect(() => {
    db.init().catch(console.error);
    updateCacheStats();
  }, [db]);

  const updateCacheStats = useCallback(async () => {
    try {
      const stats = await db.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error updating cache stats:', error);
    }
  }, [db]);

  const categorizeFile = useCallback((fileName: string, mimeType: string): CachedFile['category'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return 'document';
    }
    return 'other';
  }, []);

  const generateThumbnail = useCallback(async (
    originalPath: string, 
    fileType: string
  ): Promise<string | undefined> => {
    if (!fileType.startsWith('image/')) return undefined;

    try {
      // For images, create a smaller thumbnail
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = async () => {
          const maxSize = 150;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(async (blob) => {
            if (blob && user?.id) {
              try {
                const thumbnailData = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });

                const thumbnailPath = `thumbnails/${Date.now()}_thumb.jpg`;
                await Filesystem.writeFile({
                  path: thumbnailPath,
                  data: thumbnailData.split(',')[1],
                  directory: Directory.Data,
                  encoding: Encoding.UTF8
                });

                resolve(thumbnailPath);
              } catch (error) {
                console.error('Error saving thumbnail:', error);
                resolve(undefined);
              }
            } else {
              resolve(undefined);
            }
          }, 'image/jpeg', 0.7);
        };

        img.onerror = () => resolve(undefined);
        
        // Load image from local file
        Filesystem.readFile({
          path: originalPath,
          directory: Directory.Data
        }).then(result => {
          img.src = `data:${fileType};base64,${result.data}`;
        }).catch(() => resolve(undefined));
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return undefined;
    }
  }, [user?.id]);

  const cacheFile = useCallback(async (
    url: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    projectId?: string
  ): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      // Check if file is already cached
      const cachedFiles = await db.getCachedFiles();
      const existingFile = cachedFiles.find(f => f.originalUrl === url);
      
      if (existingFile) {
        await db.updateFileAccess(existingFile.id);
        return existingFile.localPath;
      }

      // Download and cache file
      const response = await fetch(url);
      const blob = await response.blob();
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      const localPath = `cached/${user.id}/${Date.now()}_${fileName}`;
      
      await Filesystem.writeFile({
        path: localPath,
        data: base64Data,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });

      // Generate thumbnail if it's an image
      const thumbnailPath = await generateThumbnail(localPath, fileType);

      const cachedFile: CachedFile = {
        id: `cached_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: url,
        localPath,
        fileName,
        fileSize,
        fileType,
        projectId,
        category: categorizeFile(fileName, fileType),
        cachedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        thumbnailPath,
        metadata: {
          downloadedAt: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      };

      await db.addCachedFile(cachedFile);
      await updateCacheStats();

      return localPath;
    } catch (error) {
      console.error('Error caching file:', error);
      toast({
        title: "Cache Error",
        description: "Kon bestand niet cachen voor offline gebruik",
        variant: "destructive"
      });
      return null;
    }
  }, [user?.id, db, generateThumbnail, categorizeFile, updateCacheStats, toast]);

  const getCachedFile = useCallback(async (url: string): Promise<string | null> => {
    try {
      const cachedFiles = await db.getCachedFiles();
      const file = cachedFiles.find(f => f.originalUrl === url);
      
      if (file) {
        await db.updateFileAccess(file.id);
        
        // Verify file still exists
        try {
          await Filesystem.readFile({
            path: file.localPath,
            directory: Directory.Data
          });
          return file.localPath;
        } catch {
          // File doesn't exist anymore, remove from cache
          await db.removeCachedFile(file.id);
          await updateCacheStats();
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached file:', error);
      return null;
    }
  }, [db, updateCacheStats]);

  const cleanupCache = useCallback(async (maxAgeMs: number = 7 * 24 * 60 * 60 * 1000) => {
    try {
      const removedCount = await db.cleanupOldFiles(maxAgeMs);
      await updateCacheStats();
      
      if (removedCount > 0) {
        toast({
          title: "Cache Opgeschoond",
          description: `${removedCount} oude bestanden verwijderd`,
        });
      }
      
      return removedCount;
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      return 0;
    }
  }, [db, updateCacheStats, toast]);

  const getCachedFilesByProject = useCallback(async (projectId: string): Promise<CachedFile[]> => {
    try {
      const cachedFiles = await db.getCachedFiles();
      return cachedFiles.filter(f => f.projectId === projectId);
    } catch (error) {
      console.error('Error getting cached files by project:', error);
      return [];
    }
  }, [db]);

  const getCachedFilesByCategory = useCallback(async (category: CachedFile['category']): Promise<CachedFile[]> => {
    try {
      const cachedFiles = await db.getCachedFiles();
      return cachedFiles.filter(f => f.category === category);
    } catch (error) {
      console.error('Error getting cached files by category:', error);
      return [];
    }
  }, [db]);

  return {
    cacheStats,
    cacheFile,
    getCachedFile,
    cleanupCache,
    getCachedFilesByProject,
    getCachedFilesByCategory,
    updateCacheStats
  };
};