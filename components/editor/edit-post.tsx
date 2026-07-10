"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Post } from "@/types/post";
import { useState } from "react";
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
import { Eye, Save, Loader2 } from "lucide-react";
import { postsApi } from "@/lib/posts-api";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

interface EditPostProps {
  post: Post;
}

export function EditPost({ post }: EditPostProps) {
  const [editedPost, setEditedPost] = useState<Post>(post);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();

  const handleSave = async () => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setSaving(true);
    
    try {
      postsApi.setAuthToken(token);
      
      const response = await postsApi.updatePost(editedPost.id, {
        title: editedPost.title,
        status: editedPost.status,
        featured: editedPost.featured,
        type: editedPost.type,
        excerpt: editedPost.excerpt,
        thumbnail: editedPost.thumbnail,
        cells: editedPost.cells
      });
      
      if (response.success) {
        toast.success('Post saved successfully!');
      } else {
        toast.error(response.error || 'Failed to save post');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-3xl font-bold">Edit Post: {post.title}</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
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
