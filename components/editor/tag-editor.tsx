"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  /** Colour accent for the chips (Tailwind class prefix-compatible) */
  variant?: "default" | "tech" | "category";
  id?: string;
  suggestions?: string[];
  popularTags?: string[];
}

const variantStyles: Record<string, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  tech: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  category: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function TagEditor({
  tags,
  onChange,
  label,
  placeholder = "Add tag…",
  variant = "default",
  id,
  suggestions = [],
  popularTags = [],
}: TagEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addTag = (newTag: string) => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed) return;
    if (tags.map((t) => t.toLowerCase()).includes(trimmed)) {
      inputRef.current?.select();
      return;
    }
    onChange([...tags, trimmed]);
    setInputValue("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  // Filtered suggestions based on input value (not already selected)
  const filteredSuggestions = suggestions.filter((s) => {
    const normalized = s.toLowerCase();
    const alreadySelected = tags.map((t) => t.toLowerCase()).includes(normalized);
    const matchesInput = normalized.startsWith(inputValue.toLowerCase());
    return matchesInput && !alreadySelected;
  });

  // Highlight suggestions popup keyboard handler
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
        addTag(filteredSuggestions[activeIndex]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setActiveIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chipStyle = variantStyles[variant] ?? variantStyles.default;

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      {label && <Label htmlFor={id}>{label}</Label>}
      
      {/* Editor Main Box */}
      <div className="flex flex-wrap gap-1.5 min-h-[2.25rem] rounded-md border border-input bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring transition-shadow">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-display text-[10px] uppercase ${chipStyle}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="rounded-sm opacity-60 hover:opacity-100 focus:outline-none"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <Input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="h-5 flex-1 min-w-[120px] border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50 animate-none"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul role="listbox" className="p-1">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => addTag(suggestion)}
                className={`flex items-center px-3 py-1.5 text-xs font-display lowercase rounded-sm cursor-pointer select-none ${
                  index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                }`}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addTag(inputValue)}
            disabled={!inputValue.trim()}
            className="h-7 px-2 text-xs font-display"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
          {tags.length > 0 && (
            <span className="text-[10px] font-display text-muted-foreground uppercase">
              {tags.length} tag{tags.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Popular Tags suggestions */}
        {popularTags.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-display uppercase text-muted-foreground">
            <span>Popular:</span>
            <div className="flex gap-1 flex-wrap">
              {popularTags
                .filter((pt) => !tags.map((t) => t.toLowerCase()).includes(pt.toLowerCase()))
                .slice(0, 4)
                .map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => addTag(pt)}
                    className="hover:text-primary transition-colors hover:underline lowercase"
                  >
                    #{pt}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
