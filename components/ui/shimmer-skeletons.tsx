import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SkeletonBase({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className}`} />
  );
}

export function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/50">
      <div className="aspect-[16/10] w-full bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <SkeletonBase className="h-3 w-1/4" />
        <SkeletonBase className="h-5 w-3/4" />
        <div className="space-y-1.5 pt-1">
          <SkeletonBase className="h-3 w-full" />
          <SkeletonBase className="h-3 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FileCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <SkeletonBase className="h-10 w-10 flex-shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <SkeletonBase className="h-4 w-3/4" />
            <SkeletonBase className="h-3 w-1/4" />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonBase className="h-3 w-1/2" />
          <SkeletonBase className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardMetricSkeleton() {
  return (
    <Card className="border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-4 w-4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <SkeletonBase className="h-8 w-16" />
        <SkeletonBase className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}
