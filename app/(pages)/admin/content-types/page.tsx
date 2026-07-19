"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminLayout } from "@/components/layout/admin-layout";
import { postsApi } from "@/lib/posts-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface ContentType {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  order: number;
  isSystem: boolean;
}

export default function ContentTypesPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <ContentTypeManagerContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

function ContentTypeManagerContent() {
  const { token } = useAuth();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [renamingType, setRenamingType] = useState<ContentType | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  const loadContentTypes = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      postsApi.setAuthToken(token);
      const res = await postsApi.listContentTypes();
      if (res.success && Array.isArray(res.data)) {
        setContentTypes(res.data as ContentType[]);
      } else {
        toast.error(res.error || "Failed to load content types");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while loading content types");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadContentTypes();
    }
  }, [token, loadContentTypes]);

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      toast.error("Content type name is required");
      return;
    }

    try {
      const res = await postsApi.createContentType(newTypeName);
      if (res.success) {
        toast.success("Content type created successfully");
        setNewTypeName("");
        setIsAddDialogOpen(false);
        loadContentTypes();
      } else {
        toast.error(res.error || "Failed to create content type");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create content type");
    }
  };

  const handleRenameType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingType) return;
    if (!renameValue.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const res = await postsApi.updateContentType(renamingType.slug, {
        name: renameValue,
      });
      if (res.success) {
        toast.success("Content type renamed successfully");
        setRenamingType(null);
        setRenameValue("");
        setIsRenameDialogOpen(false);
        loadContentTypes();
      } else {
        toast.error(res.error || "Failed to rename content type");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to rename content type");
    }
  };

  const toggleStatus = async (type: ContentType) => {
    if (type.isSystem) {
      toast.error("Core system content types cannot be disabled");
      return;
    }

    try {
      const res = await postsApi.updateContentType(type.slug, {
        enabled: !type.enabled,
      });
      if (res.success) {
        toast.success(`Content type ${!type.enabled ? "enabled" : "disabled"} successfully`);
        loadContentTypes();
      } else {
        toast.error(res.error || "Failed to update content type status");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (type: ContentType) => {
    if (type.isSystem) {
      toast.error("Core system content types cannot be deleted");
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete the content type "${type.name}"? This cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await postsApi.deleteContentType(type.slug);
      if (res.success) {
        toast.success("Content type deleted successfully");
        loadContentTypes();
      } else {
        toast.error(res.error || "Failed to delete content type");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete content type");
    }
  };

  const moveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= contentTypes.length) return;

    const list = [...contentTypes];
    // Swap order property
    const tempOrder = list[index].order;
    list[index].order = list[targetIndex].order;
    list[targetIndex].order = tempOrder;

    // Local swap for immediate visual update
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setContentTypes(list);

    // Save orders to server
    try {
      await postsApi.updateContentType(list[index].slug, { order: list[index].order });
      await postsApi.updateContentType(list[targetIndex].slug, { order: list[targetIndex].order });
      toast.success("Order updated successfully");
      loadContentTypes();
    } catch (err) {
      toast.error("Failed to persist order change");
      loadContentTypes();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-medium uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Content Type Manager
          </h1>
          <p className="text-muted-foreground text-sm font-sans mt-1">
            Manage system and custom content types. Custom types act as first-class post categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadContentTypes} className="h-9">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 font-display text-[11px] uppercase">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Content Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-display uppercase text-sm">Add Custom Content Type</DialogTitle>
                <DialogDescription className="text-xs">
                  Create a new content type. It will be added as a first-class post category in the database.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddType} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase">Content Type Name</Label>
                  <Input
                    id="name"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g., Daily Reflection, Announcement"
                    className="h-10"
                    maxLength={30}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Create Type
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display uppercase text-sm">Rename Content Type</DialogTitle>
            <DialogDescription className="text-xs">
              Change the name of the content type. This will update the slug and matching database records.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameType} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rename-name" className="text-xs uppercase">New Name</Label>
              <Input
                id="rename-name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter new name"
                className="h-10"
                maxLength={30}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Rename
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Info Alert */}
      <div className="flex items-start gap-3 bg-muted/40 border border-border/80 p-4 text-xs text-muted-foreground font-sans">
        <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">Content Type System Rules</p>
          <ul className="list-disc pl-4 space-y-1 mt-1">
            <li><strong>Core System Types:</strong> Project, Blog, Paper, and Story are required by the core portfolio pages and cannot be renamed or deleted.</li>
            <li><strong>Articles Merger:</strong> The legacy &apos;Article&apos; post type has been fully merged into &apos;Paper&apos; and no longer appears as a separate option.</li>
            <li><strong>Safe Deletion:</strong> You cannot delete a content type that is currently in use by any posts. Re-categorize or delete those posts first.</li>
          </ul>
        </div>
      </div>

      {/* List Card */}
      <Card className="border border-border/80 bg-muted/5">
        <CardHeader>
          <CardTitle className="text-sm font-display uppercase tracking-wider">Active Content Types</CardTitle>
          <CardDescription className="text-xs font-sans">
            Listed in current order. Drag-and-drop or reorder using arrows.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading && contentTypes.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contentTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-sans text-sm">
              No content types configured.
            </div>
          ) : (
            <div className="border border-border/80 divide-y divide-border/60">
              {contentTypes.map((type, index) => (
                <div 
                  key={type.id} 
                  className={`flex items-center justify-between p-4 bg-background transition-colors hover:bg-muted/10 ${
                    !type.enabled ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="h-4.5 w-4.5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-medium text-sm text-foreground">{type.name}</span>
                        {type.isSystem ? (
                          <Badge variant="outline" className="text-[9px] uppercase h-5 font-display bg-primary/5 text-primary border-primary/20">
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] uppercase h-5 font-display border-border">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        slug: /{type.slug}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Ordering arrows */}
                    <div className="flex items-center mr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveOrder(index, "up")}
                        disabled={index === 0}
                        className="h-8 w-8 hover:text-primary disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveOrder(index, "down")}
                        disabled={index === contentTypes.length - 1}
                        className="h-8 w-8 hover:text-primary disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStatus(type)}
                      disabled={type.isSystem}
                      className="h-8 w-8 hover:text-primary disabled:opacity-30"
                      title={type.enabled ? "Hide from readers" : "Show to readers"}
                    >
                      {type.enabled ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>

                    {/* Rename Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setRenamingType(type);
                        setRenameValue(type.name);
                        setIsRenameDialogOpen(true);
                      }}
                      disabled={type.isSystem}
                      className="h-8 w-8 hover:text-primary disabled:opacity-30"
                      title="Rename"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(type)}
                      disabled={type.isSystem}
                      className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
