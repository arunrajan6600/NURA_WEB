export type PostType = 'project' | 'blog' | 'paper' | 'article' | 'story' | 'general';
export type PostStatus = 'draft' | 'published';

export interface PostCell {
  id?: string;
  type: 'markdown' | 'image' | 'video' | 'file';
  content?: any; // Stored parsed in the service layer, but client sends it as object/array/string
  orderIndex: number;
}

export interface ThumbnailData {
  url: string;
  alt: string;
}

export interface ResearchMetadataInput {
  publicationYear?: string;
  authors?: string;
  venue?: string;
  abstract?: string;
  keywords?: string[];
  externalLinks?: any;
  pdfAttachment?: string;
  researchCategory?: string;
}

export interface ProjectSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ProjectMetadataInput {
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
  institution?: string;
  exhibition?: string;
  publication?: string;
  researchArea?: string;
  // Arrays
  tools?: string[];
  technologies?: string[];
  // Structured data
  credits?: any;
  references?: any;
  sections?: ProjectSection[];
}

export interface CreatePostInput {
  id?: string;
  title: string;
  slug?: string;
  status?: PostStatus;
  type?: PostType;
  featured?: boolean;
  pinned?: boolean;
  archived?: boolean;
  excerpt?: string | null;
  thumbnail?: ThumbnailData | null;
  authorId?: string;
  tags?: string[];
  cells?: PostCell[];
  researchMetadata?: ResearchMetadataInput;
  projectMetadata?: ProjectMetadataInput;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {}

export interface PostFilters {
  status?: PostStatus;
  type?: PostType;
  featured?: boolean;
  tags?: string[];
  limit?: number;
}

// Exact API Response structure returned to the client
export interface CellApiResponse {
  id: string;
  type: string;
  content: any;
  order: number;
}

export interface PostApiResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  type: string;
  thumbnail?: ThumbnailData;
  excerpt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  cells: CellApiResponse[];
  researchMetadata?: any;
  projectMetadata?: any;
}
