'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, FileText, Image as ImageIcon, Video, File } from 'lucide-react';

interface FileCellProps {
  s3Url: string;
  displayType?: 'inline' | 'attachment' | 'gallery';
  caption?: string;
  fileType?: 'image' | 'video' | 'audio' | 'document';
  originalName?: string;
  size?: number;
}

export function FileCell({ 
  s3Url, 
  displayType = 'inline', 
  caption, 
  fileType,
  originalName,
  size 
}: FileCellProps) {
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderInlineContent = () => {
    if (fileType === 'image') {
      return (
        <div className="my-4">
          <img 
            src={s3Url} 
            alt={caption || originalName || 'Image'} 
            className="max-w-full h-auto rounded-lg"
          />
          {caption && (
            <p className="text-sm text-muted-foreground mt-2 italic text-center">
              {caption}
            </p>
          )}
        </div>
      );
    }

    if (fileType === 'video') {
      return (
        <div className="my-4">
          <video 
            controls 
            className="max-w-full h-auto rounded-lg"
            preload="metadata"
          >
            <source src={s3Url} />
            Your browser does not support the video tag.
          </video>
          {caption && (
            <p className="text-sm text-muted-foreground mt-2 italic text-center">
              {caption}
            </p>
          )}
        </div>
      );
    }

    if (fileType === 'audio') {
      return (
        <div className="my-4">
          <audio controls className="w-full">
            <source src={s3Url} />
            Your browser does not support the audio tag.
          </audio>
          {caption && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              {caption}
            </p>
          )}
        </div>
      );
    }

    // Fallback for other file types
    return renderAttachment();
  };

  const renderAttachment = () => {
    return (
      <Card className="my-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <h4 className="font-medium">{originalName || 'File'}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {size && <span>{formatFileSize(size)}</span>}
                  {fileType && (
                    <Badge variant="secondary" className="text-xs">
                      {fileType}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={s3Url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={s3Url} download={originalName}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
          {caption && (
            <p className="text-sm text-muted-foreground mt-3 border-t pt-3">
              {caption}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (displayType === 'attachment') {
    return renderAttachment();
  }

  if (displayType === 'gallery') {
    // For gallery mode, we'll just render inline for now
    // This could be enhanced to show thumbnails in a grid
    return renderInlineContent();
  }

  // Default inline display
  return renderInlineContent();
}
