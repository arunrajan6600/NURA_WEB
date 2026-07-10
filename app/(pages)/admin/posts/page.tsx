"use client";

import { useEffect, useState } from "react";
import { Post } from "@/types/post";
import { PostsManager } from "@/components/post/posts-manager";
import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  Server,
  Users,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Cloud,
  Zap,
} from "lucide-react";
import { postsApi } from "@/lib/posts-api";
import { toast } from "sonner";

export default function AdminPostsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    featuredPosts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

  // Load stats from API
  useEffect(() => {
    if (token) {
      postsApi.setAuthToken(token);
      loadStats();
      checkApiStatus();
    }
  }, [token]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Load all posts to calculate stats
      const allPostsResponse = await postsApi.listPosts({
        status: "published",
      });
      const draftPostsResponse = await postsApi.listPosts({ status: "draft" });
      const featuredPostsResponse = await postsApi.listPosts({
        status: "published",
        featured: true,
      });

      const publishedPosts = (
        Array.isArray(allPostsResponse.data) ? allPostsResponse.data : []
      ) as Post[];
      const draftPosts = (
        Array.isArray(draftPostsResponse.data) ? draftPostsResponse.data : []
      ) as Post[];
      const featuredPosts = (
        Array.isArray(featuredPostsResponse.data)
          ? featuredPostsResponse.data
          : []
      ) as Post[];

      setStats({
        totalPosts: publishedPosts.length + draftPosts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        featuredPosts: featuredPosts.length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const checkApiStatus = async () => {
    try {
      setApiStatus("checking");
      await postsApi.listPosts({ limit: 1 });
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  };

  const refreshStats = () => {
    loadStats();
    checkApiStatus();
    toast.success("Statistics refreshed");
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Posts Administration</h1>
              <p className="text-muted-foreground">
                Manage your blog posts, projects, and content using AWS DynamoDB
                and Lambda functions.
              </p>
            </div>
            <Button
              onClick={refreshStats}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalPosts}
              </div>
              <p className="text-xs text-muted-foreground">
                All posts in database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.publishedPosts}
              </div>
              <p className="text-xs text-muted-foreground">Live on website</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.draftPosts}
              </div>
              <p className="text-xs text-muted-foreground">Work in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.featuredPosts}
              </div>
              <p className="text-xs text-muted-foreground">
                Highlighted content
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                AWS Services Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    DynamoDB Table
                  </span>
                  <Badge
                    variant={
                      apiStatus === "online"
                        ? "default"
                        : apiStatus === "offline"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {apiStatus === "online"
                      ? "Connected"
                      : apiStatus === "offline"
                      ? "Offline"
                      : "Checking..."}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Lambda Functions
                  </span>
                  <Badge
                    variant={apiStatus === "online" ? "default" : "secondary"}
                  >
                    {apiStatus === "online" ? "Active" : "Unknown"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    API Gateway
                  </span>
                  <Badge
                    variant={apiStatus === "online" ? "default" : "secondary"}
                  >
                    {apiStatus === "online" ? "Online" : "Unknown"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open("/posts", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Posts Page
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open("/admin/files", "_blank")}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Manage Files & Media
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={refreshStats}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh Statistics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts Manager */}
        <PostsManager authToken={token || undefined} isAdmin={true} />
      </div>
    </ProtectedRoute>
  );
}
