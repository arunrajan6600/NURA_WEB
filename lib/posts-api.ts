import { Post, Cell, ProjectMetadata, ResearchMetadata } from "@/types/post";
import { PostType } from "@/lib/constants";

export interface PostsApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface CreatePostData {
  title: string;
  type?: PostType;
  status?: "draft" | "published";
  featured?: boolean;
  pinned?: boolean;
  archived?: boolean;
  excerpt?: string | null;
  tags?: string[];
  slug?: string;
  thumbnail?: {
    url: string;
    alt: string;
  } | null;
  cells?: Array<{
    id?: string;
    type: "markdown" | "image" | "video" | "file";
    content: unknown;
    orderIndex?: number;
  }>;
  contentCreationDate?: string | null;
  projectMetadata?: ProjectMetadata | null;
  researchMetadata?: ResearchMetadata | null;
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id?: string;
}

export interface PostFilters {
  status?: "draft" | "published";
  type?: PostType;
  featured?: boolean;
  tags?: string[];
  limit?: number;
}

class PostsApi {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:3001";
  }

  private processPostContent(post: Post): Post {
    if (!post || !post.cells) return post;

    return {
      ...post,
      cells: post.cells.map((cell: Cell, index: number) => {
        const normalizedCell = {
          ...cell,
          orderIndex: cell.orderIndex ?? cell.order ?? index,
        };
        if (normalizedCell.type === "markdown" && typeof normalizedCell.content === "string") {
          let content = normalizedCell.content;

          // Remove outer quotes if they exist (double JSON encoding issue)
          if (content.startsWith('"') && content.endsWith('"')) {
            content = content.slice(1, -1);
          }

          // Convert escaped characters back to actual characters
          content = content
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"');

          normalizedCell.content = content;
        }
        return normalizedCell;
      }),
    };
  }

  // Process array of posts
  private processPostsArray(posts: Post[]): Post[] {
    return posts.map((post) => this.processPostContent(post));
  }

  static processStaticPosts(posts: Post[]): Post[] {
    return posts.map((post) => {
      if (!post || !post.cells) return post;

      return {
        ...post,
        cells: post.cells.map((cell: Cell, index: number) => {
          const normalizedCell = {
            ...cell,
            orderIndex: cell.orderIndex ?? cell.order ?? index,
          };
          if (normalizedCell.type === "markdown" && typeof normalizedCell.content === "string") {
            let content = normalizedCell.content;

            // Remove outer quotes if they exist (double JSON encoding issue)
            if (content.startsWith('"') && content.endsWith('"')) {
              content = content.slice(1, -1);
            }

            // Convert escaped characters back to actual characters
            content = content
              .replace(/\\n/g, "\n")
              .replace(/\\t/g, "\t")
              .replace(/\\"/g, '"');

            normalizedCell.content = content;
          }
          return normalizedCell;
        }),
      };
    });
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<PostsApiResponse<T>> {
    try {
      // GET requests must never be served from Next.js server-side or client-side fetch cache.
      // We always want live data from the Render backend.
      const isGet = !options.method || options.method.toUpperCase() === "GET";
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        cache: isGet ? "no-store" : options.cache,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // List posts with optional filters
  async listPosts(filters?: PostFilters): Promise<PostsApiResponse> {
    const queryParams = new URLSearchParams();

    if (filters?.status) queryParams.set("status", filters.status);
    if (filters?.type) queryParams.set("type", filters.type);
    if (filters?.featured !== undefined)
      queryParams.set("featured", filters.featured.toString());
    if (filters?.limit) queryParams.set("limit", filters.limit.toString());
    if (filters?.tags && filters.tags.length > 0)
      queryParams.set("tags", filters.tags.join(","));

    const queryString = queryParams.toString();
    const endpoint = `/posts${queryString ? `?${queryString}` : ""}`;

    const response = await this.makeRequest(endpoint);

    // Process the posts to fix escaped newlines
    if (response.success && Array.isArray(response.data)) {
      response.data = this.processPostsArray(response.data as Post[]);
    }

    return response;
  }

  // Get a single post by ID or slug
  async getPost(id: string): Promise<PostsApiResponse> {
    const response = await this.makeRequest(`/posts/${encodeURIComponent(id)}`);

    // Process the post to fix escaped newlines
    if (
      response.success &&
      response.data &&
      typeof response.data === "object" &&
      "cells" in response.data
    ) {
      response.data = this.processPostContent(response.data as Post);
    }

    return response;
  }

  private sanitizeThumbnail(thumbnail: any) {
    if (thumbnail === null || thumbnail === undefined) {
      return null;
    }
    if (typeof thumbnail === "object" && (!thumbnail.url || typeof thumbnail.url !== "string" || !thumbnail.url.trim())) {
      return null;
    }
    return {
      url: thumbnail.url.trim(),
      alt: typeof thumbnail.alt === "string" ? thumbnail.alt.trim() : "",
    };
  }

  // Create a new post (requires authentication)
  async createPost(postData: CreatePostData): Promise<PostsApiResponse> {
    const sanitizedPostData = {
      ...postData,
      thumbnail: postData.thumbnail !== undefined ? this.sanitizeThumbnail(postData.thumbnail) : undefined,
      cells: postData.cells?.map((cell, index) => ({
        ...cell,
        orderIndex: index
      }))
    };
    const response = await this.makeRequest("/posts", {
      method: "POST",
      body: JSON.stringify(sanitizedPostData),
    });

    // Process the created post to fix escaped newlines
    if (
      response.success &&
      response.data &&
      typeof response.data === "object" &&
      "cells" in response.data
    ) {
      response.data = this.processPostContent(response.data as Post);
    }

    return response;
  }

  // Update an existing post (requires authentication)
  async updatePost(
    id: string,
    updateData: UpdatePostData
  ): Promise<PostsApiResponse> {
    const sanitizedUpdateData = {
      ...updateData,
      thumbnail: updateData.thumbnail !== undefined ? this.sanitizeThumbnail(updateData.thumbnail) : undefined,
      cells: updateData.cells?.map((cell, index) => ({
        ...cell,
        orderIndex: index
      }))
    };
    const response = await this.makeRequest(`/posts/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(sanitizedUpdateData),
    });

    // Process the updated post to fix escaped newlines
    if (
      response.success &&
      response.data &&
      typeof response.data === "object" &&
      "cells" in response.data
    ) {
      response.data = this.processPostContent(response.data as Post);
    }

    return response;
  }

  // Delete a post (requires authentication)
  async deletePost(id: string): Promise<PostsApiResponse> {
    return this.makeRequest(`/posts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // Rename a file (requires authentication)
  async renameFile(id: string, newName: string): Promise<PostsApiResponse> {
    return this.makeRequest(`/files/${id}/rename`, {
      method: "PATCH",
      body: JSON.stringify({ newName }),
    });
  }

  // Get site settings (public)
  async getSettings(): Promise<PostsApiResponse<Record<string, string>>> {
    return this.makeRequest("/settings");
  }

  // Update site settings (requires authentication)
  async updateSettings(settingsData: Record<string, string>): Promise<PostsApiResponse<Record<string, string>>> {
    return this.makeRequest("/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    });
  }

  // Get active CV/Resume (public)
  async getResume(): Promise<PostsApiResponse> {
    return this.makeRequest("/resume");
  }

  // Upload CV/Resume (requires authentication)
  async uploadResume(file: File): Promise<PostsApiResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const headers = this.getHeaders();
    // Fetch automatically sets the multipart boundary when we omit the Content-Type header
    const { "Content-Type": _, ...restHeaders } = headers as any;

    try {
      const response = await fetch(`${this.baseUrl}/resume`, {
        method: "POST",
        headers: restHeaders,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
      return data;
    } catch (error) {
      console.error("Upload resume error:", error);
      throw error;
    }
  }

  // Convenience methods for common operations
  async getPublishedPosts(limit?: number): Promise<PostsApiResponse> {
    return this.listPosts({
      status: "published",
      limit,
    });
  }

  async getFeaturedPosts(limit?: number): Promise<PostsApiResponse> {
    return this.listPosts({
      status: "published",
      featured: true,
      limit,
    });
  }

  async getPostsByType(
    type: PostFilters["type"],
    limit?: number
  ): Promise<PostsApiResponse> {
    return this.listPosts({
      status: "published",
      type,
      limit,
    });
  }

  async getDraftPosts(): Promise<PostsApiResponse> {
    return this.listPosts({
      status: "draft",
    });
  }

  // ─── Content Types ──────────────────────────────────────────────────────────

  async listContentTypes(): Promise<PostsApiResponse> {
    return this.makeRequest("/content-types");
  }

  async createContentType(name: string): Promise<PostsApiResponse> {
    return this.makeRequest("/content-types", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async updateContentType(
    slug: string,
    data: { name?: string; enabled?: boolean; order?: number }
  ): Promise<PostsApiResponse> {
    return this.makeRequest(`/content-types/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteContentType(slug: string): Promise<PostsApiResponse> {
    return this.makeRequest(`/content-types/${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
  }
}

// Create a singleton instance
export const postsApi = new PostsApi();

// Export the class for static methods
export { PostsApi };

// Export for use in components
export default postsApi;
