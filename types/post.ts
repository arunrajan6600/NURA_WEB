import { PostType } from "@/lib/constants";

export interface ResearchMetadata {
  publicationYear?: string;
  authors?: string;
  venue?: string;
  abstract?: string;
  keywords?: string[];
  externalLinks?: { label: string; url: string }[];
  pdfAttachment?: string;
  researchCategory?: string;
}

export interface ProjectSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ProjectMetadata {
  // Basic project info
  subtitle?: string;
  category?: string;
  role?: string;
  client?: string;
  teamMembers?: string;
  // Timeline
  year?: string;
  duration?: string;
  // Links
  repoLink?: string;
  demoLink?: string;
  docLink?: string;
  // Media / exhibition
  medium?: string;
  collaborators?: string;
  tools?: string[];
  technologies?: string[];
  institution?: string;
  exhibition?: string;
  publication?: string;
  researchArea?: string;
  credits?: {
    performers?: string;
    cinematography?: string;
    music?: string;
    sound?: string;
    editing?: string;
    institutions?: string;
    acknowledgements?: string;
  };
  references?: { title: string; url?: string }[];
  sections?: ProjectSection[];
}

export interface Post {
  title: string;
  slug?: string;
  cells: Cell[];
  thumbnail?: ImageContent;
  status: "published" | "draft";
  featured: boolean;
  pinned?: boolean;
  archived?: boolean;
  tags?: string[];
  researchMetadata?: ResearchMetadata;
  projectMetadata?: ProjectMetadata;
  type: PostType;
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  excerpt?: string;
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
  displayType?: "inline" | "attachment" | "gallery";
  caption?: string;
  fileType?: "image" | "video" | "audio" | "document";
  originalName?: string;
  size?: number;
}
