import { PostType } from "@/lib/constants";

export interface Post {
  title: string;
  slug?: string;
  cells: Cell[];
  thumbnail?: ImageContent;
  status: "published" | "draft";
  featured: boolean;
  type: PostType;
  id: string;
  createdAt: string;
  updatedAt: string;
  excerpt?: string;
  viewCount?: number;
}

export interface Cell {
  id: string;
  type: "markdown" | "image" | "video" | "file";
  content: string | ImageContent | VideoContent | FileContent;
  order?: number;
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
