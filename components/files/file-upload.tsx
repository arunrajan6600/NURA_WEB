'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  RotateCcw, 
  Ban, 
  AlertCircle,
  FileAudio
} from 'lucide-react';

import { toast } from 'sonner';

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

interface UploadingFile {
  id: string;
  file: File;
  originalName: string;
  progress: number;
  status: 'pending' | 'optimizing' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  xhr?: XMLHttpRequest;
}

interface FileUploadProps {
  onUploadComplete?: (files: FileRecord[]) => void;
}

// Client-side image optimization to WebP/JPEG under 1MB
async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < 1 * 1024 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Limit max dimensions to 2560px to prevent memory limits
        const maxDim = 2560;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now()
          });
          resolve(optimizedFile.size < file.size ? optimizedFile : file);
        }, 'image/webp', 0.80);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const { token } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const [globalError, setGlobalError] = useState<string>('');
  const dragCounter = useRef(0);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-amber-500" />;
    if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'text/'];
    
    if (file.size > maxSize) {
      return 'File exceeds 50MB maximum upload limit';
    }
    
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      return 'File type not allowed (Supported: Images, Videos, Audio, PDF, Text)';
    }
    
    return null;
  };

  // Perform upload for a single file in the queue
  const executeUpload = useCallback(async (queueItem: UploadingFile) => {
    if (!token) {
      toast.error('Authentication required for uploads');
      return;
    }
    
    let fileToUpload = queueItem.file;

    // Phase 1: Optimize if it's an image
    if (fileToUpload.type.startsWith('image/') && fileToUpload.size >= 1 * 1024 * 1024) {
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { ...item, status: 'optimizing' } : item
      ));
      fileToUpload = await optimizeImage(fileToUpload);
    }

    setUploadQueue(prev => prev.map(item => 
      item.id === queueItem.id ? { ...item, status: 'uploading', progress: 0 } : item
    ));

    // Custom XMLHttpRequest with abort support
    const formData = new FormData();
    formData.append('file', fileToUpload);

    const xhr = new XMLHttpRequest();

    // Store XHR reference so it can be cancelled
    setUploadQueue(prev => prev.map(item => 
      item.id === queueItem.id ? { ...item, xhr } : item
    ));

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

    const uploadPromise = new Promise<FileRecord>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadQueue(prev => prev.map(item => 
            item.id === queueItem.id ? { ...item, progress } : item
          ));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            const rawFile = result.files[0];
            resolve({
              id: rawFile.id,
              filename: rawFile.filename,
              originalName: rawFile.filename,
              size: rawFile.size,
              mimeType: rawFile.contentType,
              s3Key: rawFile.id,
              s3Url: rawFile.url,
              uploadedAt: new Date(rawFile.createdAt),
              uploadedBy: rawFile.uploadedBy,
              isActive: true,
            });
          } catch {
            reject(new Error('Invalid upload response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Upload failed'));
          } catch {
            reject(new Error(`Server error ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Cancelled')));

      xhr.open('POST', `${apiBaseUrl}/files/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });

    try {
      const fileRecord = await uploadPromise;
      
      setUploadQueue(prev => prev.map(item => 
        item.id === queueItem.id ? { ...item, status: 'completed', progress: 100 } : item
      ));

      toast.success(`Uploaded: ${queueItem.originalName}`);
      
      if (onUploadComplete) {
        onUploadComplete([fileRecord]);
      }
    } catch (err: unknown) {
      const uploadErr = err as { message?: string };
      if (uploadErr.message === 'Cancelled') {
        setUploadQueue(prev => prev.map(item => 
          item.id === queueItem.id ? { ...item, status: 'cancelled' } : item
        ));
      } else {
        setUploadQueue(prev => prev.map(item => 
          item.id === queueItem.id ? { ...item, status: 'failed', error: uploadErr.message || 'Upload failed' } : item
        ));
        toast.error(`Failed: ${queueItem.originalName}`);
      }
    }
  }, [token, onUploadComplete]);

  const handleFiles = useCallback(async (files: FileList) => {
    setGlobalError('');
    const fileArray = Array.from(files);
    
    // Validate
    const validatedItems: UploadingFile[] = [];
    for (const file of fileArray) {
      const errorMsg = validateFile(file);
      if (errorMsg) {
        setGlobalError(`${file.name}: ${errorMsg}`);
        return;
      }
      validatedItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        originalName: file.name,
        progress: 0,
        status: 'pending'
      });
    }

    // Append to queue
    setUploadQueue(prev => [...prev, ...validatedItems]);

    // Start uploads sequentially
    for (const item of validatedItems) {
      await executeUpload(item);
    }
  }, [executeUpload]);

  // Drag and drop event listeners
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    dragCounter.current = 0;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const cancelUpload = (id: string) => {
    const item = uploadQueue.find(q => q.id === id);
    if (item && item.xhr) {
      item.xhr.abort();
    }
  };

  const retryUpload = (id: string) => {
    const item = uploadQueue.find(q => q.id === id);
    if (item) {
      executeUpload(item);
    }
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue(prev => prev.filter(q => q.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Clear completed/cancelled queue items
  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(q => q.status !== 'completed' && q.status !== 'cancelled'));
  };

  return (
    <div className="space-y-6">
      {/* File Dropping overlay */}
      {isDragOver && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 border-4 border-dashed border-primary m-4 p-8 backdrop-blur-sm transition-all duration-300"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-16 w-16 text-primary animate-bounce mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Drop files to upload</h2>
          <p className="text-sm text-muted-foreground mt-2 font-mono">Supabase Storage System</p>
        </div>
      )}

      <Card 
        className={`border border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-center cursor-pointer">
            <Upload className="h-10 w-10 text-muted-foreground mb-3 transition-transform group-hover:-translate-y-1" />
            <h3 className="font-semibold text-sm">Drag and drop files here</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
              Or click to select. Supports Images (with automatic quality WebP compression), Videos, Audio, and PDFs.
            </p>
            <span className="mt-4 border border-border px-3 py-1 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground transition-colors">
              select files
            </span>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,application/pdf,text/*"
            />
          </label>
        </CardContent>
      </Card>

      {globalError && (
        <Alert variant="destructive" className="font-mono text-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {/* Upload progress queue */}
      {uploadQueue.length > 0 && (
        <div className="border border-border p-4 bg-muted/10 space-y-3">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase text-muted-foreground border-b border-border pb-2">
            <span>Upload Queue ({uploadQueue.length} files)</span>
            {uploadQueue.some(q => q.status === 'completed' || q.status === 'cancelled') && (
              <button 
                onClick={clearCompleted}
                className="hover:text-foreground transition-colors"
              >
                [ Clear Finished ]
              </button>
            )}
          </div>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {uploadQueue.map((item) => (
              <div 
                key={item.id} 
                className={`p-3 border rounded-lg transition-colors duration-200 ${
                  item.status === 'completed' 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : item.status === 'failed'
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(item.file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-medium truncate" title={item.originalName}>
                        {item.originalName}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0 uppercase">
                        {item.status === 'optimizing' && 'optimizing WebP…'}
                        {item.status === 'uploading' && `uploading ${item.progress}%`}
                        {item.status === 'completed' && 'completed'}
                        {item.status === 'cancelled' && 'cancelled'}
                        {item.status === 'failed' && 'failed'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted h-1.5 overflow-hidden rounded-full relative">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          item.status === 'completed' 
                            ? 'bg-green-500' 
                            : item.status === 'failed'
                            ? 'bg-destructive'
                            : item.status === 'optimizing'
                            ? 'bg-blue-400 animate-pulse'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {/* Meta info & Action tools */}
                    <div className="flex items-center justify-between mt-2 font-mono text-[9px] text-muted-foreground">
                      <span>{formatSize(item.file.size)}</span>
                      <div className="flex items-center gap-3">
                        {item.status === 'uploading' && (
                          <button 
                            onClick={() => cancelUpload(item.id)}
                            className="flex items-center gap-1 hover:text-foreground text-destructive transition-colors"
                            title="Cancel upload"
                          >
                            <Ban className="h-3 w-3" /> Cancel
                          </button>
                        )}
                        {item.status === 'failed' && (
                          <button 
                            onClick={() => retryUpload(item.id)}
                            className="flex items-center gap-1 hover:text-foreground text-primary transition-colors"
                            title="Retry upload"
                          >
                            <RotateCcw className="h-3 w-3" /> Retry
                          </button>
                        )}
                        {(item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') && (
                          <button 
                            onClick={() => removeQueueItem(item.id)}
                            className="hover:text-foreground transition-colors"
                            title="Remove from queue"
                          >
                            <X className="h-3 w-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {item.error && (
                      <p className="mt-1 font-mono text-[9px] text-destructive break-words uppercase">
                        error: {item.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
