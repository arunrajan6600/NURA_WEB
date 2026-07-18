"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CitationBlockProps {
  title: string;
  authors?: string | null;
  year?: string | null;
  venue?: string | null;
  url?: string | null;
}

export function CitationBlock({ title, authors, year, venue, url }: CitationBlockProps) {
  const [activeTab, setActiveTab] = useState<"bibtex" | "apa" | "mla" | "chicago">("bibtex");
  const [copied, setCopied] = useState(false);

  const cleanAuthors = (authors || "Arun Nura").trim();
  const cleanTitle = title.trim();
  const cleanVenue = venue?.trim() || "NuraWeb";
  const cleanYear = (year || new Date().getFullYear().toString()).trim();
  const cleanUrl = url?.trim() || "";

  // Formats
  const bibtex = `@article{nura${cleanYear}${cleanTitle.toLowerCase().split(" ")[0] || "work"},\n  author = {${cleanAuthors}},\n  title = {${cleanTitle}},\n  journal = {${cleanVenue}},\n  year = {${cleanYear}}${cleanUrl ? `,\n  url = {${cleanUrl}}` : ""}\n}`;
  const apa = `${cleanAuthors}. (${cleanYear}). ${cleanTitle}. ${cleanVenue}.${cleanUrl ? ` Retrieved from ${cleanUrl}` : ""}`;
  const mla = `${cleanAuthors}. "${cleanTitle}." ${cleanVenue}, ${cleanYear}${cleanUrl ? `, ${cleanUrl}` : ""}.`;
  const chicago = `${cleanAuthors}. "${cleanTitle}." ${cleanVenue} (${cleanYear})${cleanUrl ? `. ${cleanUrl}` : ""}.`;

  const citationText = {
    bibtex,
    apa,
    mla,
    chicago,
  }[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy citation:", err);
    }
  };

  return (
    <div className="border border-border bg-card/40 p-5 font-display text-[11px] uppercase tracking-wide space-y-4 rounded-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <span className="text-muted-foreground text-xs font-semibold lowercase">[ citation format ]</span>
        <div className="flex flex-wrap gap-2">
          {(["bibtex", "apa", "mla", "chicago"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 border rounded-sm transition-colors text-[10px] ${
                activeTab === tab
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              [{tab}]
            </button>
          ))}
        </div>
      </div>

      <div className="relative bg-muted/20 p-4 border border-border/40 font-display text-[11px] lowercase tracking-normal normal-case overflow-x-auto select-all max-h-48 whitespace-pre-wrap leading-relaxed text-foreground/80">
        {citationText}
      </div>

      <div className="flex justify-end pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="font-display text-[10px] uppercase h-7 px-3 flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-success" />
              <span>copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>copy citation</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
