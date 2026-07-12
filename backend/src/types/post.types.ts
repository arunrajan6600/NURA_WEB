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

export interface ProjectMetadataInput {
  year?: string;
  duration?: string;
  medium?: string;
  collaborators?: string;
  tools?: string[];
  technologies?: string[];
  institution?: string;
  exhibition?: string;
  publication?: string;
  researchArea?: string;
  credits?: any;
  references?: any;
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
  cells?: PostCell[];
  researchMetadata?: ResearchMetadataInput;
  projectMetadata?: ProjectMetadataInput;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {}

export interface PostFilters {
  status?: PostStatus;
  type?: PostType;
  featured?: boolean;
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
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  cells: CellApiResponse[];
  researchMetadata?: any;
  projectMetadata?: any;
}
