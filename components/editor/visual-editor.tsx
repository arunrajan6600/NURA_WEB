"use client";

import { Cell, ImageContent, Post, VideoContent, ProjectSection, ProjectMetadata } from "@/types/post";
import { POST_TYPES, PostType } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { MarkdownCell } from "@/components/post/markdown-cell";
import { TagEditor } from "@/components/editor/tag-editor";
import { useCallback, useEffect, useState, useMemo } from "react";
import { posts } from "@/data/posts";
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
import { Grip, Trash2, Plus, ChevronDown, ChevronUp, Link2, Users, Code2, Layers, Copy, Eye } from "lucide-react";
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

// ─── Sortable Cell Wrapper ─────────────────────────────────────────────────

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

// ─── Cell Editor ─────────────────────────────────────────────────────────────

function CellEditor({ cell, onChange, onDelete }: CellEditorProps) {
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
                  provider: (parsedContent as VideoContent).provider || "youtube",
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

// ─── Collapsible Section Wrapper ─────────────────────────────────────────────

function CollapsiblePanel({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-2 space-y-4">{children}</div>}
    </Card>
  );
}

// ─── Project Sections Editor ─────────────────────────────────────────────────

const DEFAULT_SECTION_TITLES = [
  "Overview",
  "Problem",
  "Objectives",
  "Architecture",
  "Features",
  "Workflow",
  "Challenges",
  "Solutions",
  "Results",
  "Future Improvements",
  "Conclusion",
];

function SortableSection({
  section,
  onChange,
  onDelete,
  onDuplicate,
}: {
  section: ProjectSection;
  onChange: (s: ProjectSection) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });
  const [collapsed, setCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="overflow-hidden border border-border/60">
        {/* Section Header Row */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/10 border-b border-border/40">
          <div {...attributes} {...listeners} className="flex-shrink-0 cursor-move">
            <Grip className="h-4 w-4 text-muted-foreground" aria-label="Drag to reorder" />
          </div>
          <Input
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            placeholder="Section title"
            className="h-7 text-xs font-mono flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
          />
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDuplicate}
              className="h-7 w-7"
              title="Duplicate section"
              aria-label="Duplicate section"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 hover:text-destructive"
              title="Delete section"
              aria-label="Delete section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 w-7"
              title={collapsed ? "Expand section" : "Collapse section"}
              aria-label={collapsed ? "Expand section" : "Collapse section"}
            >
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Section Body */}
        {!collapsed && (
          <div className="p-3 space-y-2">
            {/* Edit / Preview Tabs */}
            <div className="flex items-center gap-0 border border-border/50 rounded-md w-fit">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1 text-[10px] font-mono uppercase rounded-l-md transition-colors ${
                  !previewMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1 text-[10px] font-mono uppercase rounded-r-md transition-colors flex items-center gap-1 ${
                  previewMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
            </div>

            {previewMode ? (
              <div className="min-h-[80px] text-sm prose-sm border border-border/40 rounded-md p-3 bg-background">
                {section.content ? (
                  <MarkdownCell content={section.content} />
                ) : (
                  <p className="text-muted-foreground italic text-xs font-mono">No content yet.</p>
                )}
              </div>
            ) : (
              <Textarea
                value={section.content}
                onChange={(e) => onChange({ ...section, content: e.target.value })}
                placeholder="Section content (supports Markdown)…"
                rows={5}
                className="text-sm font-mono resize-y"
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function ProjectSectionsEditor({
  sections,
  onChange,
}: {
  sections: ProjectSection[];
  onChange: (sections: ProjectSection[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      onChange(arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i })));
    }
  };

  const addSection = (title?: string) => {
    const newSection: ProjectSection = {
      id: nanoid(),
      title: title || "New Section",
      content: "",
      order: sections.length,
    };
    onChange([...sections, newSection]);
  };

  const [quickAdd, setQuickAdd] = useState("");

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              onChange={(updated) =>
                onChange(sections.map((s) => (s.id === updated.id ? updated : s)))
              }
              onDelete={() => onChange(sections.filter((s) => s.id !== section.id))}
              onDuplicate={() => {
                const duplicate: ProjectSection = {
                  ...section,
                  id: nanoid(),
                  title: section.title + " — Copy",
                  order: sections.length,
                };
                onChange([...sections, duplicate]);
              }}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Quick-add from common sections */}
      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_SECTION_TITLES.filter(
          (t) => !sections.some((s) => s.title.toLowerCase() === t.toLowerCase())
        ).map((title) => (
          <button
            key={title}
            type="button"
            onClick={() => addSection(title)}
            className="border border-dashed border-border px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground hover:border-primary hover:text-primary transition-colors rounded-sm"
          >
            + {title}
          </button>
        ))}
      </div>

      {/* Custom section */}
      <div className="flex gap-2">
        <Input
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          placeholder="Custom section title…"
          className="h-8 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (quickAdd.trim()) {
                addSection(quickAdd.trim());
                setQuickAdd("");
              }
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            if (quickAdd.trim()) {
              addSection(quickAdd.trim());
              setQuickAdd("");
            }
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Visual Editor ────────────────────────────────────────────────────────────

export function VisualEditor({ post, onChange }: VisualEditorProps) {
  const [localPost, setLocalPost] = useState<Post>(post);
  const [isUpdatingInternally, setIsUpdatingInternally] = useState(false);

  // Sync with prop changes (for discard functionality)
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

  const updatePostInternally = useCallback((updateFn: (prev: Post) => Post) => {
    setIsUpdatingInternally(true);
    setLocalPost(updateFn);
  }, []);

  const allExistingTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach((p) => {
      if (p.tags) p.tags.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, []);

  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.tags) {
        p.tags.forEach((t) => {
          const l = t.toLowerCase();
          counts[l] = (counts[l] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 8);
  }, []);

  const allExistingTechs = useMemo(() => {
    const techSet = new Set<string>();
    posts.forEach((p) => {
      if (p.projectMetadata?.technologies) {
        p.projectMetadata.technologies.forEach((t) => techSet.add(t));
      }
    });
    return Array.from(techSet);
  }, []);

  const allExistingTools = useMemo(() => {
    const toolSet = new Set<string>();
    posts.forEach((p) => {
      if (p.projectMetadata?.tools) {
        p.projectMetadata.tools.forEach((t) => toolSet.add(t));
      }
    });
    return Array.from(toolSet);
  }, []);

  const updateProjectMeta = useCallback(
    (field: keyof ProjectMetadata, value: any) => {
      updatePostInternally((prev) => ({
        ...prev,
        projectMetadata: {
          ...(prev.projectMetadata || {}),
          [field]: value,
        } as ProjectMetadata,
      }));
    },
    [updatePostInternally]
  );

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
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        updatePostInternally((prev) => {
          const oldIndex = prev.cells.findIndex((cell) => cell.id === active.id);
          const newIndex = prev.cells.findIndex((cell) => cell.id === over.id);
          return { ...prev, cells: arrayMove(prev.cells, oldIndex, newIndex) };
        });
      }
    },
    [updatePostInternally]
  );

  const addCell = useCallback(() => {
    const newCell: Cell = { id: nanoid(), type: "markdown", content: "" };
    updatePostInternally((prev) => ({ ...prev, cells: [...prev.cells, newCell] }));
  }, [updatePostInternally]);

  const isProject = localPost.type === "project";
  const pm = localPost.projectMetadata || {};

  return (
    <div className="space-y-6">
      {/* ── Core Post Fields ─────────────────────────────────────── */}
      <CollapsiblePanel title="Post Details" icon={Layers} defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input
              value={localPost.title}
              onChange={(e) =>
                updatePostInternally((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={localPost.slug || ""}
              onChange={(e) =>
                updatePostInternally((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="auto-generated from title"
            />
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

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localPost.status}
              onValueChange={(value: "draft" | "published") =>
                updatePostInternally((prev) => ({ ...prev, status: value }))
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

          <div className="space-y-2 md:col-span-2">
            <Label>Excerpt</Label>
            <Textarea
              value={localPost.excerpt || ""}
              onChange={(e) =>
                updatePostInternally((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              placeholder="Short description shown in listings"
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <TagEditor
              label="Tags"
              tags={localPost.tags || []}
              onChange={(tags) =>
                updatePostInternally((prev) => ({ ...prev, tags }))
              }
              placeholder="Add tag (Enter to confirm)…"
              id="post-tags"
              suggestions={allExistingTags}
              popularTags={popularTags}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-8 md:col-span-2">
            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={localPost.featured}
                onCheckedChange={(checked) =>
                  updatePostInternally((prev) => ({ ...prev, featured: checked }))
                }
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="pinned"
                checked={localPost.pinned ?? false}
                onCheckedChange={(checked) =>
                  updatePostInternally((prev) => ({ ...prev, pinned: checked }))
                }
              />
              <Label htmlFor="pinned">Pinned</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="archived"
                checked={localPost.archived ?? false}
                onCheckedChange={(checked) =>
                  updatePostInternally((prev) => ({ ...prev, archived: checked }))
                }
              />
              <Label htmlFor="archived">Archived</Label>
            </div>
          </div>
        </div>
      </CollapsiblePanel>

      {/* ── Thumbnail ────────────────────────────────────────────── */}
      <CollapsiblePanel title="Thumbnail" icon={Layers}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={localPost.thumbnail?.url || ""}
              onChange={(e) =>
                updatePostInternally((prev) => ({
                  ...prev,
                  thumbnail: { ...(prev.thumbnail || { alt: "" }), url: e.target.value },
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
                  thumbnail: { ...(prev.thumbnail || { url: "" }), alt: e.target.value },
                }))
              }
              placeholder="Description of the thumbnail"
            />
          </div>
          {localPost.thumbnail?.url && (
            <div className="md:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localPost.thumbnail.url}
                alt={localPost.thumbnail.alt || "Thumbnail preview"}
                className="max-h-48 rounded border border-border object-cover"
              />
            </div>
          )}
        </div>
      </CollapsiblePanel>

      {/* ── Project-only Metadata ─────────────────────────────────── */}
      {isProject && (
        <>
          <CollapsiblePanel title="Project Details" icon={Code2} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Subtitle</Label>
                <Input
                  value={pm.subtitle || ""}
                  onChange={(e) => updateProjectMeta("subtitle", e.target.value)}
                  placeholder="Brief subtitle or tagline"
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={pm.category || ""}
                  onChange={(e) => updateProjectMeta("category", e.target.value)}
                  placeholder="e.g. Installation, Software, Film"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={pm.role || ""}
                  onChange={(e) => updateProjectMeta("role", e.target.value)}
                  placeholder="Your role in the project"
                />
              </div>

              <div className="space-y-2">
                <Label>Client (optional)</Label>
                <Input
                  value={pm.client || ""}
                  onChange={(e) => updateProjectMeta("client", e.target.value)}
                  placeholder="Client or commissioner"
                />
              </div>

              <div className="space-y-2">
                <Label>Team Members (optional)</Label>
                <Input
                  value={pm.teamMembers || ""}
                  onChange={(e) => updateProjectMeta("teamMembers", e.target.value)}
                  placeholder="Collaborators, team members"
                />
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  value={pm.year || ""}
                  onChange={(e) => updateProjectMeta("year", e.target.value)}
                  placeholder="2024"
                />
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={pm.duration || ""}
                  onChange={(e) => updateProjectMeta("duration", e.target.value)}
                  placeholder="e.g. 3 months, 12 min"
                />
              </div>

              <div className="space-y-2">
                <Label>Medium</Label>
                <Input
                  value={pm.medium || ""}
                  onChange={(e) => updateProjectMeta("medium", e.target.value)}
                  placeholder="e.g. Video, Interactive Installation"
                />
              </div>

              <div className="space-y-2">
                <Label>Research Area</Label>
                <Input
                  value={pm.researchArea || ""}
                  onChange={(e) => updateProjectMeta("researchArea", e.target.value)}
                  placeholder="e.g. Human-Computer Interaction"
                />
              </div>

              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={pm.institution || ""}
                  onChange={(e) => updateProjectMeta("institution", e.target.value)}
                  placeholder="University, organisation"
                />
              </div>

              <div className="space-y-2">
                <Label>Exhibition</Label>
                <Input
                  value={pm.exhibition || ""}
                  onChange={(e) => updateProjectMeta("exhibition", e.target.value)}
                  placeholder="Exhibition name"
                />
              </div>

              <div className="space-y-2">
                <Label>Collaborators</Label>
                <Input
                  value={pm.collaborators || ""}
                  onChange={(e) => updateProjectMeta("collaborators", e.target.value)}
                  placeholder="Names or organisations"
                />
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Technologies & Tools" icon={Code2}>
            <div className="space-y-4">
              <TagEditor
                label="Technologies"
                tags={pm.technologies || []}
                onChange={(technologies) => updateProjectMeta("technologies", technologies)}
                placeholder="Add technology (Enter to confirm)…"
                variant="tech"
                id="project-technologies"
                suggestions={allExistingTechs}
              />
              <TagEditor
                label="Tools & Software"
                tags={pm.tools || []}
                onChange={(tools) => updateProjectMeta("tools", tools)}
                placeholder="Add tool (Enter to confirm)…"
                variant="category"
                id="project-tools"
                suggestions={allExistingTools}
              />
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Links" icon={Link2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Repository Link</Label>
                <Input
                  value={pm.repoLink || ""}
                  onChange={(e) => updateProjectMeta("repoLink", e.target.value)}
                  placeholder="https://github.com/…"
                />
              </div>
              <div className="space-y-2">
                <Label>Live Demo Link</Label>
                <Input
                  value={pm.demoLink || ""}
                  onChange={(e) => updateProjectMeta("demoLink", e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-2">
                <Label>Documentation Link</Label>
                <Input
                  value={pm.docLink || ""}
                  onChange={(e) => updateProjectMeta("docLink", e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-2">
                <Label>Publication</Label>
                <Input
                  value={pm.publication || ""}
                  onChange={(e) => updateProjectMeta("publication", e.target.value)}
                  placeholder="Published in…"
                />
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Credits" icon={Users}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["performers", "cinematography", "music", "sound", "editing", "institutions"].map(
                (field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field}</Label>
                    <Input
                      value={(pm.credits as Record<string, string> | undefined)?.[field] || ""}
                      onChange={(e) =>
                        updateProjectMeta("credits", {
                          ...(pm.credits || {}),
                          [field]: e.target.value,
                        })
                      }
                      placeholder={field}
                    />
                  </div>
                )
              )}
              <div className="space-y-2 md:col-span-2">
                <Label>Acknowledgements</Label>
                <Textarea
                  value={(pm.credits as Record<string, string> | undefined)?.acknowledgements || ""}
                  onChange={(e) =>
                    updateProjectMeta("credits", {
                      ...(pm.credits || {}),
                      acknowledgements: e.target.value,
                    })
                  }
                  placeholder="Acknowledgements…"
                  rows={2}
                />
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Project Sections" icon={Layers}>
            <p className="text-xs text-muted-foreground font-mono mb-3">
              Add structured sections (drag to reorder). Supports Markdown content.
            </p>
            <ProjectSectionsEditor
              sections={pm.sections || []}
              onChange={(sections) => updateProjectMeta("sections", sections)}
            />
          </CollapsiblePanel>
        </>
      )}

      {/* ── Content Cells ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Content Cells</Label>
          <Button onClick={addCell} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Cell
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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

        {localPost.cells.length === 0 && (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground text-sm">
              No content cells yet. Click &ldquo;Add Cell&rdquo; to get started.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
