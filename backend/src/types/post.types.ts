export type PostType = string;
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
  publicationYear?: string | null;
  authors?: string | null;
  venue?: string | null;
  abstract?: string | null;
  keywords?: string[];
  externalLinks?: any;
  pdfAttachment?: string | null;
  researchCategory?: string | null;
}

export interface ProjectSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export type ProjectLinkType =
  | 'publication' | 'repository' | 'demo' | 'documentation'
  | 'website' | 'dataset' | 'presentation' | 'video' | 'doi' | 'other';

export interface ProjectLink {
  id: string;
  type: ProjectLinkType;
  title: string;
  url: string;
  description?: string | null;
  order: number;
}

export type ProjectCreditRole =
  | 'developer' | 'contributor' | 'advisor' | 'supervisor' | 'mentor'
  | 'institution' | 'organization' | 'client' | 'sponsor' | 'funding'
  | 'research_lab' | 'designer' | 'tester' | 'reviewer' | 'other';

export interface ProjectCredit {
  id: string;
  role: ProjectCreditRole;
  name: string;
  organization?: string | null;
  url?: string | null;
  description?: string | null;
  order: number;
}

export interface ProjectMetadataInput {
  // Basic project info
  subtitle?: string | null;
  category?: string | null;
  role?: string | null;
  client?: string | null;
  teamMembers?: string | null;
  // Timeline
  year?: string | null;
  duration?: string | null;
  // Legacy single-value links (kept for backward compat)
  repoLink?: string | null;
  demoLink?: string | null;
  docLink?: string | null;
  // Media / exhibition
  medium?: string | null;
  collaborators?: string | null;
  institution?: string | null;
  exhibition?: string | null;
  publication?: string | null;
  researchArea?: string | null;
  projectCreationDate?: string | null;
  // Arrays
  tools?: string[];
  technologies?: string[];
  // Structured data (new repeatable collections)
  links?: ProjectLink[] | null;
  credits?: ProjectCredit[] | any; // any for backward compat with old flat object format
  references?: any;
  sections?: ProjectSection[] | null;
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
  contentCreationDate?: string | null;
  researchMetadata?: ResearchMetadataInput | null;
  projectMetadata?: ProjectMetadataInput | null;
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
  pinned?: boolean;
  archived?: boolean;
  excerpt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  contentCreationDate?: string | null;
  viewCount: number;
  likeCount: number;
  cells: CellApiResponse[];
  researchMetadata?: any;
  projectMetadata?: any;
}
