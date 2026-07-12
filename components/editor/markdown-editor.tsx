"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownCell } from "../post/markdown-cell";
import { 
  Eye, 
  Code, 
  Columns, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Table, 
  Terminal, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Video, 
  File,
  HelpCircle
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  className,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<"write" | "preview" | "split">("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus utility helper
  const insertTextAtCursor = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = before + selectedText + after;

    onChange(text.substring(0, start) + replacement + text.substring(end));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case "bold":
        insertTextAtCursor("**", "**");
        break;
      case "italic":
        insertTextAtCursor("*", "*");
        break;
      case "h1":
        insertTextAtCursor("# ", "");
        break;
      case "h2":
        insertTextAtCursor("## ", "");
        break;
      case "h3":
        insertTextAtCursor("### ", "");
        break;
      case "bullet":
        insertTextAtCursor("- ", "");
        break;
      case "number":
        insertTextAtCursor("1. ", "");
        break;
      case "quote":
        insertTextAtCursor("> ", "");
        break;
      case "code":
        insertTextAtCursor("```js\n", "\n```");
        break;
      case "link":
        insertTextAtCursor("[", "](url)");
        break;
      case "image":
        insertTextAtCursor("![Alt description](", ")");
        break;
      case "video":
        insertTextAtCursor(':::video\n{\n  "url": "', '",\n  "title": "Video title"\n}\n:::');
        break;
      case "file":
        insertTextAtCursor(':::file\n{\n  "s3Url": "', '",\n  "originalName": "file.pdf",\n  "fileType": "document"\n}\n:::');
        break;
      case "table":
        insertTextAtCursor("\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n");
        break;
    }
  };

  // Keyboard shortcut keys listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const hasModifier = isMac ? e.metaKey : e.ctrlKey;

    if (hasModifier && e.key.toLowerCase() === "b") {
      e.preventDefault();
      handleToolbarAction("bold");
    }
    if (hasModifier && e.key.toLowerCase() === "i") {
      e.preventDefault();
      handleToolbarAction("italic");
    }
    if (hasModifier && e.key.toLowerCase() === "k") {
      e.preventDefault();
      handleToolbarAction("link");
    }
    if (hasModifier && e.shiftKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      handleToolbarAction("code");
    }
  };

  const toolbarButtons = [
    { icon: <Bold className="h-3.5 w-3.5" />, action: "bold", tooltip: "Bold (Ctrl+B)" },
    { icon: <Italic className="h-3.5 w-3.5" />, action: "italic", tooltip: "Italic (Ctrl+I)" },
    { icon: <Heading1 className="h-3.5 w-3.5" />, action: "h1", tooltip: "Heading 1" },
    { icon: <Heading2 className="h-3.5 w-3.5" />, action: "h2", tooltip: "Heading 2" },
    { icon: <List className="h-3.5 w-3.5" />, action: "bullet", tooltip: "Unordered List" },
    { icon: <ListOrdered className="h-3.5 w-3.5" />, action: "number", tooltip: "Ordered List" },
    { icon: <Quote className="h-3.5 w-3.5" />, action: "quote", tooltip: "Blockquote" },
    { icon: <Table className="h-3.5 w-3.5" />, action: "table", tooltip: "Table" },
    { icon: <Terminal className="h-3.5 w-3.5" />, action: "code", tooltip: "Code Block (Ctrl+Shift+C)" },
    { icon: <LinkIcon className="h-3.5 w-3.5" />, action: "link", tooltip: "Insert Link (Ctrl+K)" },
    { icon: <ImageIcon className="h-3.5 w-3.5" />, action: "image", tooltip: "Insert Image" },
    { icon: <Video className="h-3.5 w-3.5" />, action: "video", tooltip: "Embed Video Card" },
    { icon: <File className="h-3.5 w-3.5" />, action: "file", tooltip: "Embed File Attachment" },
  ];

  return (
    <div className={cn("space-y-3 flex flex-col h-full min-h-[500px]", className)}>
      {/* Editor Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-2 bg-muted/20">
        <div className="flex flex-wrap items-center gap-1">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.action}
              type="button"
              onClick={() => handleToolbarAction(btn.action)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title={btn.tooltip}
              aria-label={btn.tooltip}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 border border-border/80 p-0.5 rounded bg-background select-none font-mono text-[9px] uppercase">
          <button
            type="button"
            onClick={() => setViewMode("write")}
            className={cn("px-2 py-1 flex items-center gap-1.5 transition-colors", 
              viewMode === "write" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Code className="h-3 w-3" /> write
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={cn("px-2 py-1 flex items-center gap-1.5 transition-colors", 
              viewMode === "preview" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Eye className="h-3 w-3" /> preview
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={cn("px-2 py-1 flex items-center gap-1.5 transition-colors hidden md:flex", 
              viewMode === "split" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Columns className="h-3 w-3" /> split
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex min-h-[400px] h-full gap-3">
        {/* Write Pane */}
        {(viewMode === "write" || viewMode === "split") && (
          <div className="flex-1 flex flex-col min-w-0">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[400px] font-mono text-sm leading-relaxed p-4 outline-none resize-none border border-border focus-visible:ring-1 focus-visible:ring-primary bg-background"
              placeholder="Start drafting in markdown (supports markdown-to-jsx block widgets)..."
              aria-label="Markdown editor input"
            />
            {/* Keyboard shortcut hints */}
            <div className="mt-1 flex items-center gap-3 font-mono text-[9px] text-muted-foreground">
              <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> hints:</span>
              <span><kbd className="border border-border/80 px-1">Ctrl+B</kbd> Bold</span>
              <span><kbd className="border border-border/80 px-1">Ctrl+I</kbd> Italic</span>
              <span><kbd className="border border-border/80 px-1">Ctrl+K</kbd> Link</span>
              <span><kbd className="border border-border/80 px-1">Ctrl+Shift+C</kbd> Code Block</span>
            </div>
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="flex-1 flex flex-col min-w-0 max-h-[600px] overflow-y-auto">
            <Card className="flex-1 p-6 bg-background/50 border border-border/60 overflow-y-auto h-full">
              {value.trim() ? (
                <div className="prose dark:prose-invert max-w-none">
                  <MarkdownCell content={value} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center font-mono text-xs uppercase text-muted-foreground">
                  Nothing to preview
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
