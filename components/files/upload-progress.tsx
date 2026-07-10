'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  error?: string;
  completed?: boolean;
}

export function UploadProgress({ progress, error, completed }: UploadProgressProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="h-4 w-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Upload complete</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Progress value={progress} className="h-2" />
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  );
}
