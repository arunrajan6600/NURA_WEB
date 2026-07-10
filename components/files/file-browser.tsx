'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  LogOut
} from 'lucide-react';
import { FileUpload } from './file-upload';
import { FileCard } from './file-card';
import { FilePreview } from './file-preview';

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
  const { user, logout, token } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  const fetchFiles = useCallback(async () => {
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
        setError('Failed to fetch files');
        setFiles([]);
      }
    } catch (err) {
      console.error('Network error while fetching files:', err);
      setError('Network error while fetching files');
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
        setError('Failed to delete file');
      }
    } catch (err) {
      console.error('Network error while deleting file:', err);
      setError('Network error while deleting file');
    }
  };

  const handleFilePreview = (file: FileRecord) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const filteredFiles = Array.isArray(files) ? files.filter(file =>
    (file.originalName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (file.mimeType?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">File Management</h1>
            <p className="text-muted-foreground">
              Welcome, {user?.username}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFiles}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Browse Files</TabsTrigger>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <FileUpload onUploadComplete={handleFileUpload} />
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Files Grid */}
            {filteredFiles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <UploadIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No files found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? 'No files match your search criteria' 
                      : 'Upload your first file to get started'
                    }
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={handleFileDelete}
                    onPreview={handleFilePreview}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* File Preview Modal */}
        <FilePreview
          file={selectedFile}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      </div>
    </div>
  );
}
