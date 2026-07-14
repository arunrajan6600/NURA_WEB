"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3001";
import { AdminLayout } from "@/components/layout/admin-layout";
import { postsApi } from "@/lib/posts-api";
import { Post } from "@/types/post";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  FolderOpen, 
  Eye, 
  Database, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar,
  Image as ImageIcon,
  Video,
  RefreshCw,
  Plus,
  Tag,
  Star,
  Archive,
  BookOpen,
  ClipboardList
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardMetricSkeleton } from "@/components/ui/shimmer-skeletons";
import { toast } from "sonner";

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

export default function AdminDashboardPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <DashboardContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

function DashboardContent() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);

      // Fetch posts (both published and drafts)
      const pubRes = await postsApi.listPosts({ status: "published" });
      const draftRes = await postsApi.listPosts({ status: "draft" });
      
      const published = Array.isArray(pubRes.data) ? pubRes.data : [];
      const drafts = Array.isArray(draftRes.data) ? draftRes.data : [];
      
      setPosts([...published, ...drafts] as Post[]);

      // Fetch files
      const filesResponse = await fetch(`${API_BASE_URL}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(Array.isArray(filesData) ? filesData : []);
      }
    } catch (err) {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  // Compute metrics
  const metrics = useMemo(() => {
    const totalPosts = posts.length;
    const published = posts.filter(p => p.status === "published" && !p.archived).length;
    const drafts = posts.filter(p => p.status === "draft" && !p.archived).length;
    const featured = posts.filter(p => p.featured).length;
    const archived = posts.filter(p => p.archived).length;
    const totalProjects = posts.filter(p => p.type === "project").length;

    const tagsSet = new Set<string>();
    posts.forEach((p) => {
      if (p.tags) p.tags.forEach((t) => tagsSet.add(t.toLowerCase()));
    });
    const totalTags = tagsSet.size;

    const totalViews = posts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    const totalFiles = files.length;
    const storageUsed = files.reduce((sum, f) => sum + (f.size || 0), 0);

    const images = files.filter(f => f.mimeType.startsWith("image/")).length;
    const videos = files.filter(f => f.mimeType.startsWith("video/")).length;
    const pdfs = files.filter(f => f.mimeType.includes("pdf")).length;
    const others = totalFiles - (images + videos + pdfs);

    return {
      totalPosts,
      published,
      drafts,
      featured,
      archived,
      totalProjects,
      totalTags,
      totalViews,
      totalFiles,
      storageUsed,
      images,
      videos,
      pdfs,
      others
    };
  }, [posts, files]);

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
          <DashboardMetricSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-64 border border-border/50 animate-pulse bg-muted/20" />
          <Card className="h-64 border border-border/50 animate-pulse bg-muted/20" />
        </div>
      </div>
    );
  }

  // Find most viewed posts
  const topPosts = [...posts]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 4);

  // Recent activity logs sorted by updatedAt desc
  const recentActivity = [...posts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Recent uploads
  const recentFiles = [...files].slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Title banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase mt-1">
            Express / Prisma DB Stats & Metrics
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="font-mono text-xs uppercase">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          sync stats
        </Button>
      </div>

      {/* Grid count stats (8 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Posts */}
        <Card className="border-border/60 hover:border-primary/20 transition-colors bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.totalPosts}</div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
              Blog writeups, pages & archives
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Total Projects */}
        <Card className="border-border/60 hover:border-primary/20 transition-colors bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Projects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.totalProjects}</div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
              Active works & portfolio items
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Published */}
        <Card className="border-border/60 hover:border-primary/20 transition-colors bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Published</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.published}</div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
              Live on the public site
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Drafts */}
        <Card className="border-border/60 hover:border-primary/20 transition-colors bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Drafts</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.drafts}</div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
              Unpublished edits in backlog
            </p>
          </CardContent>
        </Card>

        {/* Metric 5: Featured */}
        <Card className="border-border/60 hover:border-primary/20 transition-colors bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.featured}</div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
              Highlighted home selections
            </p>
          </CardContent>
        </Card>

        {/* Metric 6: Archived */}
        <Card className="border-border/60 hover:border-primary/20 transition-colors bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Archived</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.archived}</div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
              Hidden legacy project posts
            </p>
          </CardContent>
        </Card>

        {/* Metric 7: Total Tags */}
        <Card className="border-border/60 hover:border-primary/20 transition-colors bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{metrics.totalTags}</div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
              Unique taxonomy keywords
            </p>
          </CardContent>
        </Card>

        {/* Metric 8: Storage Size */}
        <Card className="border-border/60 hover:border-primary/20 transition-colors bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatStorage(metrics.storageUsed)}</div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
              Bucket size ({metrics.totalFiles} objects)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Popular Content */}
        <Card className="border-border bg-background">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Popular Content</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topPosts.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-muted-foreground uppercase">
                No content found
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {topPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0">
                      <span className="font-mono text-[9px] uppercase border border-border px-1.5 py-0.25 text-muted-foreground">
                        {post.type}
                      </span>
                      <p className="font-medium text-xs truncate mt-1">{post.title}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-xs">{post.viewCount || 0}</p>
                      <p className="font-mono text-[8px] text-muted-foreground uppercase">views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="border-border bg-background">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Recent Uploads</span>
              <Link href="/admin/files" className="font-mono text-[10px] uppercase text-primary hover:underline flex items-center gap-0.5">
                Manage <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentFiles.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-muted-foreground uppercase">
                No files uploaded yet
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {file.mimeType.startsWith("image/") && <ImageIcon className="h-4 w-4 text-blue-400" />}
                      {file.mimeType.startsWith("video/") && <Video className="h-4 w-4 text-purple-400" />}
                      <p className="text-xs truncate font-medium">{file.originalName}</p>
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground flex-shrink-0 uppercase">
                      {formatStorage(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log Row (Full Width) */}
      <Card className="border-border bg-background">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Recent Activity Log</span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Latest Updates</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-muted-foreground uppercase">
              No activity logs recorded
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentActivity.map((post) => (
                <div key={post.id} className="flex items-center justify-between px-4 py-3 gap-4 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="font-mono text-[9px] uppercase border border-border px-2 py-0.5 text-muted-foreground rounded-sm">
                      {post.type}
                    </span>
                    <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-sm ${
                      post.status === "published" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}>
                      {post.status}
                    </span>
                    <p className="text-xs font-medium truncate">{post.title}</p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase whitespace-nowrap">
                    updated: {new Date(post.updatedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <Card className="border border-border/60 bg-muted/5">
        <CardHeader>
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Admin Quick Launch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" asChild className="font-mono text-[10px] uppercase gap-1.5 h-9">
              <Link href="/admin/posts?action=new">
                <Plus className="h-3.5 w-3.5" />
                write new post
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="font-mono text-[10px] uppercase gap-1.5 h-9">
              <Link href="/admin/files">
                <FolderOpen className="h-3.5 w-3.5" />
                upload files
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="font-mono text-[10px] uppercase gap-1.5 h-9">
              <Link href="/admin/settings">
                <Calendar className="h-3.5 w-3.5" />
                edit site details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
