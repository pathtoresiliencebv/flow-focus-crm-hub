import React, { useState, useEffect } from 'react';
import { File, Image, Video, FileText, Music, Archive, Trash2, Download, Folder, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useFileSystemManager } from '@/hooks/useFileSystemManager';
import { useDownloadManager } from '@/hooks/useDownloadManager';

interface MobileFileOrganizerProps {
  projectId?: string;
  onFileSelect?: (filePath: string) => void;
}

export const MobileFileOrganizer: React.FC<MobileFileOrganizerProps> = ({
  projectId,
  onFileSelect
}) => {
  const { 
    cacheStats, 
    getCachedFilesByProject, 
    getCachedFilesByCategory, 
    cleanupCache 
  } = useFileSystemManager();
  
  const { 
    tasks, 
    activeDownloads, 
    totalProgress, 
    cancelDownload,
    clearCompleted 
  } = useDownloadManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    loadFiles();
  }, [activeTab, projectId]);

  const loadFiles = async () => {
    if (projectId) {
      const projectFiles = await getCachedFilesByProject(projectId);
      setFiles(projectFiles);
    } else if (activeTab === 'all') {
      // Load all files from all categories
      const categories = ['image', 'document', 'video', 'audio', 'other'] as const;
      const allFiles = await Promise.all(
        categories.map(cat => getCachedFilesByCategory(cat))
      );
      setFiles(allFiles.flat());
    } else {
      const categoryFiles = await getCachedFilesByCategory(activeTab as any);
      setFiles(categoryFiles);
    }
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = files.filter(file =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryStats = () => {
    const stats = {
      image: files.filter(f => f.category === 'image').length,
      document: files.filter(f => f.category === 'document').length,
      video: files.filter(f => f.category === 'video').length,
      audio: files.filter(f => f.category === 'audio').length,
      other: files.filter(f => f.category === 'other').length,
    };
    return stats;
  };

  const handleCleanup = async () => {
    await cleanupCache();
    loadFiles();
  };

  const stats = getCategoryStats();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Bestandsbeheer</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {formatFileSize(cacheStats.totalSize)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek bestanden..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Cache Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <div className="font-medium">{cacheStats.totalFiles}</div>
            <div className="text-muted-foreground">Bestanden</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{formatFileSize(cacheStats.totalSize)}</div>
            <div className="text-muted-foreground">Gebruikt</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{formatFileSize(cacheStats.availableSpace)}</div>
            <div className="text-muted-foreground">Beschikbaar</div>
          </div>
        </div>
      </div>

      {/* Downloads Progress */}
      {activeDownloads > 0 && (
        <div className="p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Downloads ({activeDownloads})</span>
            <Button variant="ghost" size="sm" onClick={clearCompleted}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Progress value={totalProgress} className="mb-2" />
          <div className="space-y-1">
            {tasks.filter(t => t.status === 'downloading').slice(0, 2).map(task => (
              <div key={task.id} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1">{task.fileName}</span>
                <div className="flex items-center gap-2">
                  <span>{task.progress}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelDownload(task.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="all" className="text-xs">Alle ({files.length})</TabsTrigger>
          <TabsTrigger value="image" className="text-xs">
            <Image className="h-3 w-3 mr-1" />
            {stats.image}
          </TabsTrigger>
          <TabsTrigger value="document" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            {stats.document}
          </TabsTrigger>
          <TabsTrigger value="video" className="text-xs">
            <Video className="h-3 w-3 mr-1" />
            {stats.video}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Geen bestanden gevonden</p>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <Card 
                    key={file.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onFileSelect?.(file.localPath)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {file.fileName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(file.cachedAt)}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {file.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};