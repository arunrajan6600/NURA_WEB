"use client";

import { useState } from "react";
import { ProjectCredit, ProjectCreditRole } from "@/types/post";
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
import { Grip, Trash2, Plus, ChevronDown, ChevronUp, Users } from "lucide-react";
import { nanoid } from "nanoid";

const CREDIT_ROLES: { value: ProjectCreditRole; label: string }[] = [
  { value: "developer", label: "Developer" },
  { value: "contributor", label: "Contributor" },
  { value: "advisor", label: "Advisor" },
  { value: "supervisor", label: "Supervisor" },
  { value: "mentor", label: "Mentor" },
  { value: "institution", label: "Institution" },
  { value: "organization", label: "Organization" },
  { value: "client", label: "Client" },
  { value: "sponsor", label: "Sponsor" },
  { value: "funding", label: "Funding / Grant" },
  { value: "research_lab", label: "Research Lab" },
  { value: "designer", label: "Designer" },
  { value: "tester", label: "Tester" },
  { value: "reviewer", label: "Reviewer" },
  { value: "other", label: "Other" },
];

interface ProjectCreditsEditorProps {
  credits: ProjectCredit[];
  onChange: (credits: ProjectCredit[]) => void;
}

export function ProjectCreditsEditor({ credits, onChange }: ProjectCreditsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = credits.findIndex((c) => c.id === active.id);
      const newIndex = credits.findIndex((c) => c.id === over.id);
      onChange(arrayMove(credits, oldIndex, newIndex).map((c, i) => ({ ...c, order: i })));
    }
  };

  const addCredit = () => {
    const newCredit: ProjectCredit = {
      id: nanoid(),
      role: "developer",
      name: "",
      organization: "",
      url: "",
      description: "",
      order: credits.length,
    };
    onChange([...credits, newCredit]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-display">
          Manage dynamic project credits. Drag to reorder.
        </span>
        <Button
          type="button"
          onClick={addCredit}
          variant="outline"
          size="sm"
          className="h-8 text-xs font-display uppercase gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Credit
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={credits.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {credits.map((credit) => (
              <SortableCreditItem
                key={credit.id}
                credit={credit}
                onChange={(updated) =>
                  onChange(credits.map((c) => (c.id === updated.id ? updated : c)))
                }
                onDelete={() => onChange(credits.filter((c) => c.id !== credit.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {credits.length === 0 && (
        <div className="border border-dashed border-border px-4 py-8 text-center font-display text-xs text-muted-foreground uppercase rounded-sm">
          No credits added yet. Click &quot;Add Credit&quot; to begin.
        </div>
      )}
    </div>
  );
}

function SortableCreditItem({
  credit,
  onChange,
  onDelete,
}: {
  credit: ProjectCredit;
  onChange: (credit: ProjectCredit) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: credit.id });
  const [collapsed, setCollapsed] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getCreditHeaderLabel = () => {
    const roleLabel = CREDIT_ROLES.find((r) => r.value === credit.role)?.label || "Credit";
    return credit.name ? `${roleLabel}: ${credit.name}` : `New ${roleLabel}`;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-hidden border border-border/60 shadow-xs">
        {/* Header Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border-b border-border/40">
          <div {...attributes} {...listeners} className="flex-shrink-0 cursor-move py-1 px-0.5">
            <Grip className="h-4 w-4 text-muted-foreground" />
          </div>
          <Users className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
          <span className="font-display text-xs font-medium uppercase truncate flex-1 select-none">
            {getCreditHeaderLabel()}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove credit"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title={collapsed ? "Expand credit details" : "Collapse credit details"}
            >
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Card Body */}
        {!collapsed && (
          <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-background">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">Role</Label>
              <Select
                value={credit.role}
                onValueChange={(val: ProjectCreditRole) => onChange({ ...credit, role: val })}
              >
                <SelectTrigger className="h-8 font-display text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {CREDIT_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="font-display text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">Name</Label>
              <Input
                value={credit.name}
                onChange={(e) => onChange({ ...credit, name: e.target.value })}
                placeholder="e.g. Arun Nura, John Doe"
                className="h-8 text-xs font-display"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">Organization (Optional)</Label>
              <Input
                value={credit.organization || ""}
                onChange={(e) => onChange({ ...credit, organization: e.target.value })}
                placeholder="e.g. CUSAT, IEEE"
                className="h-8 text-xs font-display"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">URL / Website (Optional)</Label>
              <Input
                type="url"
                value={credit.url || ""}
                onChange={(e) => onChange({ ...credit, url: e.target.value })}
                placeholder="https://..."
                className="h-8 text-xs font-display"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] uppercase text-muted-foreground font-display">Description (Optional)</Label>
              <Textarea
                value={credit.description || ""}
                onChange={(e) => onChange({ ...credit, description: e.target.value })}
                placeholder="Brief summary or details about their involvement..."
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
