// Core system post type definitions with labels for UI
export const POST_TYPES = [
  { value: "project" as const, label: "Project" },
  { value: "blog" as const, label: "Blog" },
  { value: "paper" as const, label: "Paper" },
  { value: "story" as const, label: "Story" },
] as const;

// For filter dropdowns that include "all" option
export const POST_FILTER_TYPES = [
  { value: "all" as const, label: "All Types" },
  ...POST_TYPES,
] as const;

// PostType is open — supports both system types and dynamic custom content types
export type PostType = string;

