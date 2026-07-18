'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  ExternalLink,
  Edit2,
  Check,
  X,
  FileAudio
} from 'lucide-react';
import { URLCopier } from './url-copier';
import { postsApi } from '@/lib/posts-api';
import { useAuth } from '@/components/auth/auth-provider';

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
  viewMode?: 'grid' | 'list';
  onDelete?: (fileId: string) => void;
  onPreview?: (file: FileRecord) => void;
  onRenameComplete?: (fileId: string, newName: string) => void;
}

export function FileCard({ file, viewMode = 'grid', onDelete, onPreview, onRenameComplete }: FileCardProps) {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(file.originalName);
  const [isHovered, setIsHovered] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName) {
      setTimeout(() => renameInputRef.current?.focus(), 60);
    }
  }, [isEditingName]);

  const getFileIcon = (mimeType: string) => {
    if (typeof mimeType !== 'string') return <File className="h-5 w-5 text-muted-foreground" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-amber-500" />;
    if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    const toastId = toast.loading(`Deleting "${file.originalName}"`);
    
    try {
      await onDelete(file.id);
      toast.success(`File deleted successfully`, { id: toastId });
    } catch (err) {
      console.error('Failed to delete file:', err);
      toast.error(`Failed to delete file`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveRename = async () => {
    const trimmed = editedName.trim();
    if (!trimmed || trimmed === file.originalName) {
      setIsEditingName(false);
      return;
    }
    
    const toastId = toast.loading(`Renaming file to "${trimmed}"…`);
    try {
      if (token) {
        postsApi.setAuthToken(token);
      }
      const res = await postsApi.renameFile(file.id, trimmed);
      if (res.success) {
        toast.success(`Renamed successfully`, { id: toastId });
        setIsEditingName(false);
        if (onRenameComplete) {
          onRenameComplete(file.id, trimmed);
        }
      } else {
        toast.error(res.error || `Rename failed`, { id: toastId });
      }
    } catch {
      toast.error(`Failed to rename file`, { id: toastId });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    }
    if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditedName(file.originalName);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(file.s3Url, '_blank');
  };

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');

  if (viewMode === 'list') {
    return (
      <div 
        className="flex items-center justify-between border border-border/60 hover:border-primary/45 p-3 bg-background hover:bg-muted/10 transition-colors gap-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* List thumbnail */}
          <div className="h-10 w-10 relative flex-shrink-0 bg-muted/30 border border-border/40 overflow-hidden flex items-center justify-center rounded">
            {isImage ? (
              <img src={file.s3Url} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : isVideo && isHovered ? (
              <video src={file.s3Url} muted loop autoPlay className="h-full w-full object-cover" />
            ) : (
              getFileIcon(file.mimeType)
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 max-w-sm">
                <input
                  ref={renameInputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="font-display text-xs border border-border px-2 py-1 outline-none bg-background w-full"
                />
                <Button size="sm" variant="ghost" onClick={handleSaveRename} className="h-7 w-7 p-0">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)} className="h-7 w-7 p-0">
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span 
                  className="font-medium text-xs truncate cursor-pointer hover:underline"
                  onClick={() => onPreview?.(file)}
                  title={file.originalName}
                >
                  {file.originalName}
                </span>
                <span className="font-display text-[9px] text-muted-foreground flex-shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground font-display mt-0.5 uppercase">
              Uploaded {formatDate(file.uploadedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="font-display text-[8px] uppercase px-1.5 py-0">
            {file.mimeType.split('/')[0]}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview?.(file)}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive focus:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="group hover:shadow-md hover:border-primary/30 transition-all duration-200 w-full overflow-hidden border-border bg-background"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual Thumbnail Area */}
      <div 
        className="aspect-[16/10] w-full bg-muted/20 border-b border-border/40 relative flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => onPreview?.(file)}
      >
        {isImage ? (
          <img 
            src={file.s3Url} 
            alt={file.originalName} 
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : isVideo ? (
          <div className="relative h-full w-full">
            {isHovered ? (
              <video 
                src={file.s3Url} 
                muted 
                loop 
                autoPlay 
                playsInline
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted/40">
                <Video className="h-10 w-10 text-purple-400" />
              </div>
            )}
            <Badge className="absolute bottom-2 right-2 bg-black/60 text-white border-none font-display text-[8px] uppercase">
              video
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {getFileIcon(file.mimeType)}
            <span className="font-display text-[9px] uppercase mt-2 text-muted-foreground">
              {file.mimeType.split('/')[1] || 'binary'}
            </span>
          </div>
        )}

        {/* Action overlay hint */}
        <div className="absolute inset-0 bg-background/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="bg-background/90 border border-border px-2 py-1 font-display text-[9px] uppercase text-muted-foreground shadow-sm">
            preview
          </span>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  ref={renameInputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="font-display text-[11px] border border-border px-1.5 py-0.5 outline-none bg-background w-full"
                />
                <button onClick={handleSaveRename} className="hover:text-green-500 p-0.5">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                </button>
                <button onClick={() => setIsEditingName(false)} className="hover:text-destructive p-0.5">
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ) : (
              <h3 
                className="font-medium text-xs truncate cursor-pointer hover:text-primary transition-colors" 
                title={file.originalName}
                onClick={() => onPreview?.(file)}
              >
                {file.originalName}
              </h3>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatFileSize(file.size)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview?.(file)}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive focus:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between font-display text-[9px] text-muted-foreground uppercase">
            <span>{formatDate(file.uploadedAt)}</span>
            <Badge variant="secondary" className="text-[8px] leading-none px-1.5 py-0.5 select-none">
              {file.mimeType.split('/')[0]}
            </Badge>
          </div>
          
          <URLCopier url={file.s3Url} />
        </div>
      </CardContent>
    </Card>
  );
}
