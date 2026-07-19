"use client";

import { useState } from "react";
import { ProjectLink, ProjectLinkType } from "@/types/post";
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
import { Grip, Trash2, Plus, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { nanoid } from "nanoid";

const LINK_TYPES: { value: ProjectLinkType; label: string }[] = [
  { value: "publication", label: "Publication" },
  { value: "repository", label: "Repository" },
  { value: "demo", label: "Demo / Live" },
  { value: "documentation", label: "Documentation" },
  { value: "website", label: "Website" },
  { value: "dataset", label: "Dataset" },
  { value: "presentation", label: "Presentation" },
  { value: "video", label: "Video" },
  { value: "doi", label: "DOI" },
  { value: "other", label: "Other" },
];

interface ProjectLinksEditorProps {
  links: ProjectLink[];
  onChange: (links: ProjectLink[]) => void;
}

export function ProjectLinksEditor({ links, onChange }: ProjectLinksEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      onChange(arrayMove(links, oldIndex, newIndex).map((l, i) => ({ ...l, order: i })));
    }
  };

  const addLink = () => {
    const newLink: ProjectLink = {
      id: nanoid(),
      type: "website",
      title: "",
      url: "",
      description: "",
      order: links.length,
    };
    onChange([...links, newLink]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-display">
          Manage dynamic project links. Drag to reorder.
        </span>
        <Button
          type="button"
          onClick={addLink}
          variant="outline"
          size="sm"
          className="h-8 text-xs font-display uppercase gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Link
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {links.map((link) => (
              <SortableLinkItem
                key={link.id}
                link={link}
                onChange={(updated) =>
                  onChange(links.map((l) => (l.id === updated.id ? updated : l)))
                }
                onDelete={() => onChange(links.filter((l) => l.id !== link.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {links.length === 0 && (
        <div className="border border-dashed border-border px-4 py-8 text-center font-display text-xs text-muted-foreground uppercase rounded-sm">
          No links added yet. Click &quot;Add Link&quot; to begin.
        </div>
      )}
    </div>
  );
}

function SortableLinkItem({
  link,
  onChange,
  onDelete,
}: {
  link: ProjectLink;
  onChange: (link: ProjectLink) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
  const [collapsed, setCollapsed] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getLinkHeaderLabel = () => {
    const typeLabel = LINK_TYPES.find((t) => t.value === link.type)?.label || "Link";
    return link.title ? `${typeLabel}: ${link.title}` : `New ${typeLabel}`;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-hidden border border-border/60 shadow-xs">
        {/* Header Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border-b border-border/40">
          <div {...attributes} {...listeners} className="flex-shrink-0 cursor-move py-1 px-0.5">
            <Grip className="h-4 w-4 text-muted-foreground" />
          </div>
          <Link2 className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
          <span className="font-display text-xs font-medium uppercase truncate flex-1 select-none">
            {getLinkHeaderLabel()}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove link"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title={collapsed ? "Expand link details" : "Collapse link details"}
            >
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Card Body */}
        {!collapsed && (
          <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-background">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">Link Type</Label>
              <Select
                value={link.type}
                onValueChange={(val: ProjectLinkType) => onChange({ ...link, type: val })}
              >
                <SelectTrigger className="h-8 font-display text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="font-display text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">Title / Label</Label>
              <Input
                value={link.title}
                onChange={(e) => onChange({ ...link, title: e.target.value })}
                placeholder="e.g. IEEE Paper, GitHub Repo"
                className="h-8 text-xs font-display"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">URL</Label>
              <Input
                type="url"
                value={link.url}
                onChange={(e) => onChange({ ...link, url: e.target.value })}
                placeholder="https://example.com/..."
                className="h-8 text-xs font-display"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">Description (Optional)</Label>
              <Textarea
                value={link.description || ""}
                onChange={(e) => onChange({ ...link, description: e.target.value })}
                placeholder="Brief summary or metadata details..."
                rows={2}
                className="text-xs font-display resize-y"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
