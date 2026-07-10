'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Download, 
  File, 
  Image as ImageIcon, 
  Video, 
  FileText 
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

interface FilePreviewProps {
  file: FileRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilePreview({ file, open, onOpenChange }: FilePreviewProps) {
  if (!file) return null;

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6 text-purple-500" />;
    if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return <FileText className="h-6 w-6 text-red-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const renderPreview = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <img 
            src={file.s3Url} 
            alt={file.originalName}
            className="max-w-full max-h-96 mx-auto rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="bg-muted/50 rounded-lg p-4">
          <video 
            controls 
            className="max-w-full max-h-96 mx-auto rounded-lg"
            preload="metadata"
          >
            <source src={file.s3Url} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="bg-muted/50 rounded-lg p-4">
          <audio controls className="w-full">
            <source src={file.s3Url} type={file.mimeType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <FileText className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <p className="text-muted-foreground mb-4">PDF preview not available</p>
          <Button asChild>
            <a href={file.s3Url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open PDF
            </a>
          </Button>
        </div>
      );
    }

    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        {getFileIcon(file.mimeType)}
        <p className="text-muted-foreground mt-4">Preview not available for this file type</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(file.mimeType)}
            {file.originalName}
          </DialogTitle>
          <DialogDescription>
            File preview and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Preview */}
          {renderPreview()}

          {/* File Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>File Name:</strong> {file.originalName}
            </div>
            <div>
              <strong>File Size:</strong> {formatFileSize(file.size)}
            </div>
            <div>
              <strong>File Type:</strong> 
              <Badge variant="secondary" className="ml-2">
                {file.mimeType}
              </Badge>
            </div>
            <div>
              <strong>Uploaded:</strong> {formatDate(file.uploadedAt)}
            </div>
            <div>
              <strong>Uploaded By:</strong> {file.uploadedBy}
            </div>
          </div>

          {/* URL Copier */}
          <div className="space-y-2">
            <strong className="text-sm">Public URL:</strong>
            <URLCopier url={file.s3Url} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild>
              <a href={file.s3Url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={file.s3Url} download={file.originalName}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
