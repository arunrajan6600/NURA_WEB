"use client";

import { Cell, ImageContent, Post, VideoContent } from "@/types/post";
import { POST_TYPES, PostType } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, Trash2, Plus } from "lucide-react";
import { nanoid } from "nanoid";

interface VisualEditorProps {
  post: Post;
  onChange: (post: Post) => void;
}

interface CellEditorProps {
  cell: Cell;
  onChange: (cell: Cell) => void;
  onDelete: () => void;
}

function SortableCell({ cell, onChange, onDelete }: CellEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: cell.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners}>
          <Grip className="h-5 w-5 text-muted-foreground cursor-move" />
        </div>
        <div className="flex-1">
          <CellEditor cell={cell} onChange={onChange} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

function CellEditor({ cell, onChange, onDelete }: CellEditorProps) {
  // Helper function to parse content if it's a JSON string (same as in post-cell.tsx)
  const parseContent = <T,>(content: string | T): T => {
    if (typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch {
        return content as T;
      }
    }
    return content;
  };

  // Get parsed content for display in editor
  const getParsedContent = () => {
    if (cell.type === "image") {
      return parseContent<ImageContent>(cell.content as string | ImageContent);
    } else if (cell.type === "video") {
      return parseContent<VideoContent>(cell.content as string | VideoContent);
    }
    return cell.content;
  };

  const parsedContent = getParsedContent();

  const handleContentChange = (value: string | ImageContent | VideoContent) => {
    onChange({ ...cell, content: value });
  };

  const handleTypeChange = (type: "markdown" | "image" | "video") => {
    if (type === cell.type) return;

    let newContent: string | ImageContent | VideoContent;
    if (type === "markdown") {
      newContent = "";
    } else if (type === "image") {
      newContent = { url: "", alt: "" };
    } else {
      // Default to video
      newContent = { url: "", title: "", provider: "youtube" };
    }

    onChange({ ...cell, type, content: newContent });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={cell.type}
          onValueChange={handleTypeChange as (value: string) => void}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="markdown">Markdown</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="ml-auto"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {cell.type === "markdown" ? (
        <MarkdownEditor
          value={cell.content as string}
          onChange={(value) => handleContentChange(value)}
        />
      ) : cell.type === "image" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={(parsedContent as ImageContent).url || ""}
              onChange={(e) =>
                handleContentChange({
                  ...(parsedContent as ImageContent),
                  url: e.target.value,
                })
              }
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Alt Text</Label>
            <Input
              value={(parsedContent as ImageContent).alt || ""}
              onChange={(e) =>
                handleContentChange({
                  ...(parsedContent as ImageContent),
                  alt: e.target.value,
                })
              }
              placeholder="Description of the image"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Video URL</Label>
            <Input
              value={(parsedContent as VideoContent).url || ""}
              onChange={(e) =>
                handleContentChange({
                  ...(parsedContent as VideoContent),
                  url: e.target.value,
                  title: (parsedContent as VideoContent).title || "",
                  provider:
                    (parsedContent as VideoContent).provider || "youtube",
                })
              }
              placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Title (Optional)</Label>
            <Input
              value={(parsedContent as VideoContent).title || ""}
              onChange={(e) =>
                handleContentChange({
                  ...(parsedContent as VideoContent),
                  title: e.target.value,
                })
              }
              placeholder="Video title or caption"
            />
          </div>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={(parsedContent as VideoContent).provider || "youtube"}
              onValueChange={(value) =>
                handleContentChange({
                  ...(parsedContent as VideoContent),
                  provider: value as "youtube" | "vimeo" | "direct",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="direct">Direct Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Card>
  );
}

export function VisualEditor({ post, onChange }: VisualEditorProps) {
  const [localPost, setLocalPost] = useState<Post>(post);
  const [isUpdatingInternally, setIsUpdatingInternally] = useState(false);

  // Sync with prop changes (for discard functionality) - but not when we're updating internally
  useEffect(() => {
    if (!isUpdatingInternally) {
      setLocalPost(post);
    }
  }, [post, isUpdatingInternally]);

  useEffect(() => {
    if (isUpdatingInternally) {
      onChange(localPost);
      setIsUpdatingInternally(false);
    }
  }, [localPost, onChange, isUpdatingInternally]);

  // Helper function to update post data internally
  const updatePostInternally = useCallback((updateFn: (prev: Post) => Post) => {
    setIsUpdatingInternally(true);
    setLocalPost(updateFn);
  }, []);

  const handleCellChange = useCallback(
    (index: number, cell: Cell) => {
      updatePostInternally((prev) => ({
        ...prev,
        cells: prev.cells.map((c, i) => (i === index ? cell : c)),
      }));
    },
    [updatePostInternally]
  );

  const handleCellDelete = useCallback(
    (index: number) => {
      updatePostInternally((prev) => ({
        ...prev,
        cells: prev.cells.filter((_, i) => i !== index),
      }));
    },
    [updatePostInternally]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: {
      active: { id: string | number };
      over: { id: string | number } | null;
    }) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        updatePostInternally((prev) => {
          const oldIndex = prev.cells.findIndex(
            (cell) => cell.id === active.id
          );
          const newIndex = prev.cells.findIndex((cell) => cell.id === over.id);

          return {
            ...prev,
            cells: arrayMove(prev.cells, oldIndex, newIndex),
          };
        });
      }
    },
    [updatePostInternally]
  );

  const addCell = useCallback(() => {
    const newCell: Cell = {
      id: nanoid(),
      type: "markdown",
      content: "",
    };

    updatePostInternally((prev) => ({
      ...prev,
      cells: [...prev.cells, newCell],
    }));
  }, [updatePostInternally]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={localPost.title}
            onChange={(e) =>
              updatePostInternally((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Thumbnail</Label>
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={localPost.thumbnail?.url || ""}
                  onChange={(e) =>
                    updatePostInternally((prev) => ({
                      ...prev,
                      thumbnail: {
                        ...(prev.thumbnail || { alt: "" }),
                        url: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                  value={localPost.thumbnail?.alt || ""}
                  onChange={(e) =>
                    updatePostInternally((prev) => ({
                      ...prev,
                      thumbnail: {
                        ...(prev.thumbnail || { url: "" }),
                        alt: e.target.value,
                      },
                    }))
                  }
                  placeholder="Description of the thumbnail"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-2">
          <Label>Post Type</Label>
          <Select
            value={localPost.type}
            onValueChange={(value: PostType) =>
              updatePostInternally((prev) => ({ ...prev, type: value }))
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
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Content Cells</Label>
          <Button onClick={addCell} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Cell
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localPost.cells.map((cell) => cell.id)}
            strategy={verticalListSortingStrategy}
          >
            {localPost.cells.map((cell, index) => (
              <SortableCell
                key={cell.id}
                cell={cell}
                onChange={(cell) => handleCellChange(index, cell)}
                onDelete={() => handleCellDelete(index)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
