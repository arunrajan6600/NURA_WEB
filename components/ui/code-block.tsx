"use client";

import React from "react";
import { highlightCode } from "@/lib/highlight-code";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "javascript" }: CodeBlockProps) {
  // Normalize language
  const normalizedLanguage = language.toLowerCase();

  // Get pre-highlighted HTML from our utility
  const highlightedCode = highlightCode(code, normalizedLanguage);

  return (
    <pre
      style={{
        backgroundColor: "#0a0a0a",
        padding: "1.25rem 1.5rem",
        margin: "1.5rem 0",
        borderRadius: "0.5rem",
        overflow: "auto",
      }}
    >
      <code
        style={{
          whiteSpace: "pre",
          display: "block",
          overflowX: "auto",
          color: "#e6e6e6",
          fontSize: "0.875rem",
          fontFamily: "monospace",
        }}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
}
