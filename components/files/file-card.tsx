'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  File, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { URLCopier } from './url-copier';

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

interface FileCardProps {
  file: FileRecord;
  onDelete?: (fileId: string) => void;
  onPreview?: (file: FileRecord) => void;
}

export function FileCard({ file, onDelete, onPreview }: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getFileIcon = (mimeType: string) => {
    if (typeof mimeType !== 'string') {
      return <File className="h-8 w-8 text-gray-500" />;
    }
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
    if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    const toastId = toast.loading(`Deleting "${file.originalName}"`, {
      description: "Removing file from storage..."
    });
    
    try {
      await onDelete(file.id);
      toast.success(`File deleted successfully`, {
        id: toastId,
        description: file.originalName
      });
    } catch (err) {
      console.error('Failed to delete file:', err);
      toast.error(`Failed to delete file`, {
        id: toastId,
        description: `Could not delete "${file.originalName}". Please try again.`
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      toast.loading(`Loading preview`, {
        description: file.originalName,
        duration: 2000
      });
      onPreview(file);
    }
  };

  const handleOpenInNewTab = () => {
    toast(`Opening file in new tab`, {
      description: file.originalName,
      icon: "↗️"
    });
    window.open(file.s3Url, '_blank');
  };

  return (
    <Card className="group hover:shadow-md transition-shadow w-full overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              {getFileIcon(file.mimeType)}
            </div>
            <div className="flex-1 min-w-0 max-w-[calc(100%-2rem)]">
              <div className="break-all">
                <h3 className="font-medium text-sm truncate block" title={file.originalName}>
                  {file.originalName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">Uploaded {formatDate(file.uploadedAt)}</span>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {file.mimeType.split('/')[0]}
            </Badge>
          </div>
          
          <div className="w-full overflow-hidden">
            <URLCopier url={file.s3Url} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
