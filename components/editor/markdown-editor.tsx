"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownCell } from "../post/markdown-cell";
import { EyeIcon, CodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Some useful markdown templates for common elements
  const templates = [
    { label: "H1", template: "# Heading 1" },
    { label: "H2", template: "## Heading 2" },
    { label: "H3", template: "### Heading 3" },
    { label: "Bold", template: "**Bold text**" },
    { label: "Italic", template: "*Italic text*" },
    { label: "Link", template: "[Link text](https://example.com)" },
    { label: "Image", template: "![Alt text](https://example.com/image.jpg)" },
    { label: "List", template: "- Item 1\n- Item 2\n- Item 3" },
    {
      label: "Code",
      template: "```js\nconst hello = 'world';\nconsole.log(hello);\n```",
    },
    { label: "Info", template: ":::info\nThis is an info callout box.\n:::" },
    {
      label: "Warning",
      template: ":::warning\nThis is a warning callout box.\n:::",
    },
    {
      label: "Success",
      template: ":::success\nThis is a success callout box.\n:::",
    },
  ];

  const insertTemplate = (template: string) => {
    if (activeTab === "preview") {
      setActiveTab("write");
    }

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        value.substring(0, start) +
        (start > 0 && value.substring(start - 1, start) !== "\n" ? "\n" : "") +
        template +
        (end < value.length && value.substring(end, end + 1) !== "\n"
          ? "\n"
          : "") +
        value.substring(end);

      onChange(newValue);

      // Set cursor position after inserted template
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + template.length + 1;
        textarea.selectionEnd = start + template.length + 1;
      }, 0);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {templates.map((item) => (
          <Button
            key={item.label}
            variant="outline"
            size="sm"
            onClick={() => insertTemplate(item.template)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "write" | "preview")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-36 mb-2">
          <TabsTrigger value="write" className="flex items-center gap-2">
            <CodeIcon className="h-4 w-4" />
            Write
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <EyeIcon className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="mt-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[350px] font-mono text-sm"
            placeholder="Type markdown content here..."
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card className="p-4 min-h-[350px] overflow-auto bg-background">
            <MarkdownCell content={value} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
