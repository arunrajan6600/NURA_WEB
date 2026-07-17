import { PostType } from "@/lib/constants";

export interface ResearchMetadata {
  publicationYear?: string | null;
  authors?: string | null;
  venue?: string | null;
  abstract?: string | null;
  keywords?: string[];
  externalLinks?: { label: string; url: string }[] | null;
  pdfAttachment?: string | null;
  researchCategory?: string | null;
}

export interface ProjectSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ProjectMetadata {
  // Basic project info
  subtitle?: string | null;
  category?: string | null;
  role?: string | null;
  client?: string | null;
  teamMembers?: string | null;
  // Timeline
  year?: string | null;
  duration?: string | null;
  // Links
  repoLink?: string | null;
  demoLink?: string | null;
  docLink?: string | null;
  // Media / exhibition
  medium?: string | null;
  collaborators?: string | null;
  tools?: string[];
  technologies?: string[];
  institution?: string | null;
  exhibition?: string | null;
  publication?: string | null;
  researchArea?: string | null;
  projectCreationDate?: string | null;
  credits?: {
    performers?: string | null;
    cinematography?: string | null;
    music?: string | null;
    sound?: string | null;
    editing?: string | null;
    institutions?: string | null;
    acknowledgements?: string | null;
  } | null;
  references?: { title: string; url?: string }[] | null;
  sections?: ProjectSection[] | null;
}

export interface Post {
  title: string;
  slug?: string;
  cells: Cell[];
  thumbnail?: ImageContent | null;
  status: "published" | "draft";
  featured: boolean;
  pinned?: boolean;
  archived?: boolean;
  tags?: string[];
  researchMetadata?: ResearchMetadata | null;
  projectMetadata?: ProjectMetadata | null;
  type: PostType;
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  excerpt?: string | null;
  viewCount?: number;
  likeCount?: number;
}

export interface Cell {
  id: string;
  type: "markdown" | "image" | "video" | "file";
  content: string | ImageContent | VideoContent | FileContent;
  order?: number;
  orderIndex?: number;
}

export interface ImageContent {
  url: string;
  alt: string;
}

export interface VideoContent {
  url: string;
  title: string;
  provider?: "youtube" | "vimeo" | "direct";
}

export interface FileContent {
  s3Url: string;
  originalName: string;
  mimeType: string;
  size: number;
}
