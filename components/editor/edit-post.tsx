"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Post } from "@/types/post";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisualEditor } from "@/components/editor/visual-editor";
import { PostCell } from "@/components/post/post-cell";
import { formatDistance } from "date-fns";
import { Eye, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { postsApi } from "@/lib/posts-api";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

interface EditPostProps {
  post: Post;
}

export function EditPost({ post }: EditPostProps) {
  const [editedPost, setEditedPost] = useState<Post>(post);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const { token } = useAuth();

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Autosave: debounce 3s after each change
  const savePost = useCallback(
    async (postToSave: Post, options?: { silent?: boolean }) => {
      if (!token) return;
      setSaving(true);
      setAutosaveStatus("saving");
      try {
        postsApi.setAuthToken(token);
        const response = await postsApi.updatePost(postToSave.id, {
          title: postToSave.title,
          slug: postToSave.slug,
          status: postToSave.status,
          featured: postToSave.featured,
          pinned: postToSave.pinned,
          archived: postToSave.archived,
          type: postToSave.type,
          excerpt: postToSave.excerpt,
          thumbnail: postToSave.thumbnail,
          tags: postToSave.tags,
          cells: postToSave.cells,
          researchMetadata: postToSave.researchMetadata as Record<string, unknown>,
          projectMetadata: postToSave.projectMetadata as Record<string, unknown>,
        });
        if (response.success) {
          setIsDirty(false);
          setAutosaveStatus("saved");
          if (!options?.silent) toast.success("Post saved successfully!");
          setTimeout(() => setAutosaveStatus("idle"), 3000);
        } else {
          setAutosaveStatus("error");
          if (!options?.silent) toast.error(response.error || "Failed to save post");
        }
      } catch {
        setAutosaveStatus("error");
        if (!options?.silent) toast.error("Failed to save post");
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const handleSave = useCallback(async () => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    await savePost(editedPost);
  }, [savePost, editedPost]);

  // Global Ctrl+S / Cmd+S save hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (modifier && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    // Skip the first render (initial mount)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsDirty(true);
    setAutosaveStatus("idle");

    // Debounce autosave
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      savePost(editedPost, { silent: true });
    }, 3000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedPost]);

  const handleCopyJson = () => {
    const json = JSON.stringify(editedPost, null, 2);
    navigator.clipboard.writeText(json);
    toast.success('JSON copied to clipboard!');
  };

  const formattedDate = formatDistance(
    new Date(editedPost.updatedAt),
    new Date(),
    {
      addSuffix: true,
    }
  );

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold truncate">Edit Post: {post.title}</h1>
          {/* Autosave status indicator */}
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase h-4">
            {autosaveStatus === "saving" && (
              <><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Autosaving…</span></>
            )}
            {autosaveStatus === "saved" && (
              <><CheckCircle2 className="h-3 w-3 text-green-500" /><span className="text-green-600">All changes saved</span></>
            )}
            {autosaveStatus === "error" && (
              <><AlertCircle className="h-3 w-3 text-destructive" /><span className="text-destructive">Autosave failed</span></>
            )}
            {isDirty && autosaveStatus === "idle" && (
              <span className="text-amber-500">Unsaved changes</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : autosaveStatus === "saved" ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes <kbd className="ml-1.5 hidden sm:inline border border-white/20 px-1 text-[9px]">⌘S</kbd>
              </>
            )}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Preview: {editedPost.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-6">
                <article className="max-w-4xl mx-auto">
                  <div className="space-y-6 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                      {editedPost.title}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                      Updated {formattedDate}
                    </p>
                  </div>

                  <div className="space-y-12">
                    {editedPost.cells.map((cell) => (
                      <PostCell key={cell.id} cell={cell} />
                    ))}
                  </div>
                </article>
              </div>
            </DialogContent>
          </Dialog>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">View JSON</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-4xl">
                <DrawerHeader>
                  <DrawerTitle>Post JSON</DrawerTitle>
                </DrawerHeader>
                <div className="p-6">
                  <Card className="relative">
                    <pre className="p-4 text-sm overflow-auto max-h-[600px]">
                      <code>{JSON.stringify(editedPost, null, 2)}</code>
                    </pre>
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleCopyJson}
                    >
                      Copy
                    </Button>
                  </Card>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <VisualEditor post={editedPost} onChange={setEditedPost} />
    </div>
  );
}
