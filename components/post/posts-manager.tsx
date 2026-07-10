"use client";

import { useState, useEffect, useCallback } from "react";
import { postsApi, PostsApiResponse } from "@/lib/posts-api";
import { Post } from "@/types/post";
import { POST_TYPES, POST_FILTER_TYPES, PostType } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Eye, Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import { PostCell } from "@/components/post/post-cell";
import { VisualEditor } from "@/components/editor/visual-editor";

interface PostsManagerProps {
  authToken?: string;
  isAdmin?: boolean;
}

export function PostsManager({
  authToken,
  isAdmin = false,
}: PostsManagerProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    featured: "all",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [editingPostVisual, setEditingPostVisual] = useState<Post | null>(null);
  const [originalEditingPost, setOriginalEditingPost] = useState<Post | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    type: "blog" as PostType,
    status: "draft" as "published" | "draft",
    featured: false,
    excerpt: "",
    thumbnail: { url: "", alt: "" },
  });

  // Set auth token when provided
  useEffect(() => {
    if (authToken) {
      postsApi.setAuthToken(authToken);
    }
  }, [authToken]);

  // Handle filter changes
  const handleStatusFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handleTypeFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, type: value }));
  }, []);

  const handleFeaturedFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, featured: value }));
  }, []);

  // Handle visual editor changes
  const handleVisualEditorChange = useCallback(
    (updatedPost: Post) => {
      setEditingPostVisual(updatedPost);
      // Check if there are unsaved changes by comparing with original
      if (originalEditingPost) {
        const hasChanges =
          JSON.stringify(updatedPost) !== JSON.stringify(originalEditingPost);
        setHasUnsavedChanges(hasChanges);
      }
    },
    [originalEditingPost]
  );

  // Save changes handler
  const handleSaveChanges = useCallback(async () => {
    if (!editingPostVisual) return;

    try {
      if (authToken && isAdmin) {
        // Save to API
        await postsApi.updatePost(editingPostVisual.id, editingPostVisual);
        toast.success("Post saved successfully!");
      }

      // Update the post in the list
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === editingPostVisual.id ? editingPostVisual : p
        )
      );

      // Update original post and reset dirty state
      setOriginalEditingPost(editingPostVisual);
      setHasUnsavedChanges(false);
      toast.success("Changes saved!");
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  }, [editingPostVisual, authToken, isAdmin]);

  // Discard changes handler
  const handleDiscardChanges = useCallback(() => {
    if (originalEditingPost) {
      setEditingPostVisual(JSON.parse(JSON.stringify(originalEditingPost))); // Deep copy
      setHasUnsavedChanges(false);
      setEditorKey((prev) => prev + 1); // Force re-render
      toast.success("Changes discarded");
    }
  }, [originalEditingPost]);

  // Close editor handler with confirmation
  const handleCloseEditor = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCloseConfirmation(true);
    } else {
      setEditingPostVisual(null);
      setOriginalEditingPost(null);
      setHasUnsavedChanges(false);
    }
  }, [hasUnsavedChanges]);

  // Confirm close without saving
  const handleConfirmClose = useCallback(() => {
    setEditingPostVisual(null);
    setOriginalEditingPost(null);
    setHasUnsavedChanges(false);
    setShowCloseConfirmation(false);
    toast.info("Changes discarded");
  }, []);

  // Open editor with original post tracking
  const openVisualEditor = useCallback((post: Post) => {
    setEditingPostVisual(post);
    setOriginalEditingPost(JSON.parse(JSON.stringify(post))); // Deep copy
    setHasUnsavedChanges(false);
    setEditorKey((prev) => prev + 1); // Ensure fresh editor instance
  }, []);

  // Load posts
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const filterParams: Record<string, string | boolean> = {};

      if (filters.status && filters.status !== "all") {
        filterParams.status = filters.status as "draft" | "published";
      }
      if (filters.type && filters.type !== "all") {
        filterParams.type = filters.type as PostType;
      }
      if (filters.featured && filters.featured !== "all") {
        filterParams.featured = filters.featured === "true";
      }

      const response = await postsApi.listPosts(filterParams);

      if (response.success && response.data) {
        setPosts(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error(response.error || "Failed to load posts");
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      let response: PostsApiResponse;

      if (editingPost) {
        response = await postsApi.updatePost(editingPost.id, formData);
      } else {
        response = await postsApi.createPost(formData);
      }

      if (response.success) {
        const successMessage = editingPost
          ? "Post updated successfully"
          : "Post created successfully";
        toast.success(successMessage);

        // If it's a new post, get the created post ID and offer to open visual editor
        if (
          !editingPost &&
          response.data &&
          typeof response.data === "object" &&
          "id" in response.data
        ) {
          const postData = response.data as Post;
          const shouldOpenEditor = confirm(
            "Post created successfully! Would you like to open the visual editor to add content?"
          );
          if (shouldOpenEditor) {
            openVisualEditor(postData);
          }
        }

        setIsCreateDialogOpen(false);
        setEditingPost(null);
        resetForm();
        loadPosts();
      } else {
        toast.error(response.error || "Failed to save post");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  // Handle delete
  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await postsApi.deletePost(postId);

      if (response.success) {
        toast.success("Post deleted successfully");
        loadPosts();
      } else {
        toast.error(response.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      type: "blog",
      status: "draft",
      featured: false,
      excerpt: "",
      thumbnail: { url: "", alt: "" },
    });
  };

  // Start editing
  const startEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      type: post.type,
      status: post.status,
      featured: post.featured,
      excerpt: post.excerpt || "",
      thumbnail: post.thumbnail || { url: "", alt: "" },
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts Manager</h1>
        {isAdmin && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingPost(null);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="!w-[90vw] !h-[90vh] !max-w-none !max-h-none p-0 overflow-hidden">
              <div className="flex flex-col h-full">
                <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
                  <DialogTitle className="text-xl">
                    {editingPost ? "Edit Post" : "Create New Post"}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Enter post title"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: string) =>
                            setFormData({
                              ...formData,
                              type: value as PostType,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POST_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: string) =>
                            setFormData({
                              ...formData,
                              status: value as "draft" | "published",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) =>
                          setFormData({ ...formData, excerpt: e.target.value })
                        }
                        placeholder="Brief description of the post"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="thumbnail-url">Thumbnail URL</Label>
                        <Input
                          id="thumbnail-url"
                          value={formData.thumbnail.url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              thumbnail: {
                                ...formData.thumbnail,
                                url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="thumbnail-alt">
                          Thumbnail Alt Text
                        </Label>
                        <Input
                          id="thumbnail-alt"
                          value={formData.thumbnail.alt}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              thumbnail: {
                                ...formData.thumbnail,
                                alt: e.target.value,
                              },
                            })
                          }
                          placeholder="Describe the image"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, featured: checked })
                        }
                      />
                      <Label htmlFor="featured">Featured post</Label>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        {editingPost && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setEditingPostVisual(editingPost);
                              setIsCreateDialogOpen(false);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Open Visual Editor
                          </Button>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingPost ? "Update" : "Create"} Post
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={handleTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {POST_FILTER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Featured</Label>
              <Select
                value={filters.featured}
                onValueChange={handleFeaturedFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All posts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All posts</SelectItem>
                  <SelectItem value="true">Featured only</SelectItem>
                  <SelectItem value="false">Non-featured only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-8">Loading posts...</div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No posts found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <Badge
                        variant={
                          post.status === "published" ? "default" : "secondary"
                        }
                      >
                        {post.status}
                      </Badge>
                      <Badge variant="outline">{post.type}</Badge>
                      {post.featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>

                    {post.excerpt && (
                      <p className="text-muted-foreground mb-2">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(post.createdAt).toLocaleDateString()} |
                      Updated: {new Date(post.updatedAt).toLocaleDateString()}
                      {post.viewCount !== undefined &&
                        ` | Views: ${post.viewCount}`}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingPost(post)}
                        title="View Post"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openVisualEditor(post)}
                        title="Edit with Visual Editor"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(post)}
                        title="Edit Properties"
                      >
                        <Filter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Post Modal */}
      <Dialog open={!!viewingPost} onOpenChange={() => setViewingPost(null)}>
        <DialogContent className="!w-[90vw] !h-[90vh] !max-w-none !max-h-none !p-0 !gap-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-2xl font-bold">
              {viewingPost?.title}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {viewingPost && (
                <>
                  <Badge variant="secondary">{viewingPost.type}</Badge>
                  <Badge
                    variant={
                      viewingPost.status === "published"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {viewingPost.status}
                  </Badge>
                  {viewingPost.featured && (
                    <Badge variant="outline">Featured</Badge>
                  )}
                </>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {viewingPost && (
              <div className="space-y-6">
                {viewingPost.excerpt && (
                  <div className="border-l-4 border-primary/20 pl-4">
                    <p className="text-lg text-muted-foreground italic">
                      {viewingPost.excerpt}
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {viewingPost.cells && viewingPost.cells.length > 0 ? (
                    viewingPost.cells.map((cell) => (
                      <div
                        key={cell.id}
                        className="border rounded-lg p-4 bg-muted/20"
                      >
                        <PostCell cell={cell} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground text-lg">
                        No content available
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This post doesn&apos;t have any content cells yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Visual Editor Modal */}
      <Dialog
        open={!!editingPostVisual}
        onOpenChange={() => handleCloseEditor()}
      >
        <DialogContent
          className="!w-[90vw] !h-[90vh] !max-w-none !max-h-none !p-0 !gap-0 flex flex-col"
          showCloseButton={false}
        >
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-muted/20">
            <DialogTitle className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl font-semibold truncate">
                  Edit: {editingPostVisual?.title}
                </span>
                {editingPostVisual && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary">{editingPostVisual.type}</Badge>
                    <Badge
                      variant={
                        editingPostVisual.status === "published"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {editingPostVisual.status}
                    </Badge>
                    {editingPostVisual.featured && (
                      <Badge variant="outline">Featured</Badge>
                    )}
                    {hasUnsavedChanges && (
                      <Badge variant="destructive">Unsaved Changes</Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardChanges}
                  disabled={!hasUnsavedChanges}
                >
                  Discard Changes
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={!hasUnsavedChanges}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewingPost(editingPostVisual);
                    setEditingPostVisual(null);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={handleCloseEditor}>
                  Close
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {editingPostVisual && (
              <div className="p-6">
                <VisualEditor
                  key={`${editingPostVisual.id}-${editorKey}`}
                  post={editingPostVisual}
                  onChange={handleVisualEditorChange}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog
        open={showCloseConfirmation}
        onOpenChange={setShowCloseConfirmation}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to close the
              editor? Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCloseConfirmation(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Close Without Saving
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
