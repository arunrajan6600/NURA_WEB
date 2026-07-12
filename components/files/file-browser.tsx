'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  RefreshCw, 
  Upload as UploadIcon,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { FileUpload } from './file-upload';
import { FileCard } from './file-card';
import { FilePreview } from './file-preview';
import { FileCardSkeleton } from '@/components/ui/shimmer-skeletons';

interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadedAt: Date;
  uploadedBy: string;
  isActive: boolean;
}

export function FileBrowser() {
  const { token } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Toggles and controls
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('date-desc');
  
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  const fetchFiles = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch files from storage');
        setFiles([]);
      }
    } catch (err) {
      console.error('Network error while fetching files:', err);
      setError('Connection offline or server down. Unable to fetch files.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = (uploadedFiles: FileRecord[]) => {
    setFiles(prev => [...uploadedFiles, ...prev]);
    setActiveTab('browse');
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
      } else {
        setError('Failed to delete file from storage');
      }
    } catch (err) {
      console.error('Network error while deleting file:', err);
      setError('Network error while deleting file');
    }
  };

  const handleFileRenameComplete = (fileId: string, newName: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, originalName: newName } : file
    ));
  };

  const handleFilePreview = (file: FileRecord) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  // Compute filtered & sorted lists
  const processedFiles = useMemo(() => {
    let result = [...files];

    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(file => 
        (file.originalName?.toLowerCase() || '').includes(query) ||
        (file.mimeType?.toLowerCase() || '').includes(query)
      );
    }

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter(file => {
        const mime = file.mimeType.toLowerCase();
        if (categoryFilter === 'image') return mime.startsWith('image/');
        if (categoryFilter === 'video') return mime.startsWith('video/');
        if (categoryFilter === 'audio') return mime.startsWith('audio/');
        if (categoryFilter === 'pdf') return mime.includes('pdf');
        if (categoryFilter === 'document') {
          return mime.startsWith('text/') || mime.includes('word') || mime.includes('excel') || mime.includes('powerpoint');
        }
        return true;
      });
    }

    // 3. Sort options
    result.sort((a, b) => {
      if (sortOption === 'date-desc') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortOption === 'date-asc') {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortOption === 'size-desc') {
        return b.size - a.size;
      }
      if (sortOption === 'size-asc') {
        return a.size - b.size;
      }
      if (sortOption === 'name-asc') {
        return a.originalName.localeCompare(b.originalName);
      }
      if (sortOption === 'name-desc') {
        return b.originalName.localeCompare(a.originalName);
      }
      return 0;
    });

    return result;
  }, [files, searchQuery, categoryFilter, sortOption]);

  const categories = [
    { value: 'all', label: 'All Files' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'document', label: 'Documents' },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">File & Media Assets</h2>
          <p className="text-muted-foreground font-mono text-[10px] uppercase mt-1">
            Supabase Public Storage Bucket
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchFiles}
          disabled={loading}
          className="font-mono text-xs uppercase"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="font-mono text-xs uppercase">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchFiles} className="underline ml-4">[ Retry ]</button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="font-mono text-xs uppercase">
            <TabsTrigger value="browse">Browse Files</TabsTrigger>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <FileUpload onUploadComplete={handleFileUpload} />
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            {/* Toolbar Filters */}
            <div className="flex flex-col gap-4 border border-border/80 p-4 bg-muted/5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search query */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search files by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 font-mono text-xs"
                  />
                </div>

                {/* View toggles & Sort select */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center border border-border rounded overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      aria-label="Grid view"
                      title="Grid View"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${
                        viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      aria-label="List view"
                      title="List View"
                    >
                      <ListIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 border border-border px-3 py-1 bg-background text-xs font-mono text-muted-foreground">
                    <ArrowUpDown className="h-3 w-3" />
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="bg-transparent border-none outline-none text-foreground py-1 cursor-pointer"
                    >
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="size-desc">Largest Size</option>
                      <option value="size-asc">Smallest Size</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Type Category Filtering pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                <span className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-1.5 mr-2">
                  <Filter className="h-3 w-3" /> filter:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategoryFilter(cat.value)}
                    className={`px-3 py-1 font-mono text-[10px] uppercase transition-all ${
                      categoryFilter === cat.value
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Files Grid / List */}
            {loading ? (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4' 
                : 'space-y-2'
              }>
                {Array.from({ length: 8 }).map((_, i) => (
                  <FileCardSkeleton key={i} />
                ))}
              </div>
            ) : processedFiles.length === 0 ? (
              <Card className="border border-border bg-background">
                <CardContent className="p-12 text-center max-w-sm mx-auto">
                  <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-sm font-semibold mb-1">No files found</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {searchQuery || categoryFilter !== 'all'
                      ? 'No items match your active search filter options'
                      : 'Upload your first file to get started in admin panel.'
                    }
                  </p>
                  <Button onClick={() => setActiveTab('upload')} size="sm">
                    <UploadIcon className="h-3.5 w-3.5 mr-1.5" />
                    Upload Files
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {processedFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    viewMode="grid"
                    onDelete={handleFileDelete}
                    onPreview={handleFilePreview}
                    onRenameComplete={handleFileRenameComplete}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-border/80 divide-y divide-border/60 rounded-lg overflow-hidden bg-background">
                {processedFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    viewMode="list"
                    onDelete={handleFileDelete}
                    onPreview={handleFilePreview}
                    onRenameComplete={handleFileRenameComplete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* File Preview Drawer */}
        <FilePreview
          file={selectedFile}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
    </div>
  );
}
