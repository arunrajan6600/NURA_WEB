// Post type definitions with labels for UI
export const POST_TYPES = [
  { value: "project" as const, label: "Project" },
  { value: "blog" as const, label: "Blog" },
  { value: "paper" as const, label: "Paper" },
  { value: "article" as const, label: "Article" },
  { value: "story" as const, label: "Story" },
  { value: "general" as const, label: "General" },
] as const;

// For filter dropdowns that include "all" option
export const POST_FILTER_TYPES = [
  { value: "all" as const, label: "All Types" },
  ...POST_TYPES,
] as const;

// Extract just the type values for TypeScript
export type PostType = (typeof POST_TYPES)[number]["value"];
