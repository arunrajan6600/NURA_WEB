import { Post, Cell } from "@/types/post";
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
  excerpt?: string;
  thumbnail?: {
    url: string;
    alt: string;
  };
  cells?: Array<{
    type: "markdown" | "image" | "video" | "file";
    content: unknown;
  }>;
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id?: string;
}

export interface PostFilters {
  status?: "draft" | "published";
  type?: PostType;
  featured?: boolean;
  limit?: number;
}

class PostsApi {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  }

  // Utility to fix escaped newlines in post content
  private processPostContent(post: Post): Post {
    if (!post || !post.cells) return post;

    return {
      ...post,
      cells: post.cells.map((cell: Cell) => {
        if (cell.type === "markdown" && typeof cell.content === "string") {
          let content = cell.content;

          // Remove outer quotes if they exist (double JSON encoding issue)
          if (content.startsWith('"') && content.endsWith('"')) {
            content = content.slice(1, -1);
          }

          // Convert escaped characters back to actual characters
          content = content
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"');

          return {
            ...cell,
            content,
          };
        }
        return cell;
      }),
    };
  }

  // Process array of posts
  private processPostsArray(posts: Post[]): Post[] {
    return posts.map((post) => this.processPostContent(post));
  }

  // Static method to process posts data (for use with static imports)
  static processStaticPosts(posts: Post[]): Post[] {
    return posts.map((post) => {
      if (!post || !post.cells) return post;

      return {
        ...post,
        cells: post.cells.map((cell: Cell) => {
          if (cell.type === "markdown" && typeof cell.content === "string") {
            let content = cell.content;

            // Remove outer quotes if they exist (double JSON encoding issue)
            if (content.startsWith('"') && content.endsWith('"')) {
              content = content.slice(1, -1);
            }

            // Convert escaped characters back to actual characters
            content = content
              .replace(/\\n/g, "\n")
              .replace(/\\t/g, "\t")
              .replace(/\\"/g, '"');

            return {
              ...cell,
              content,
            };
          }
          return cell;
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
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
    const response = await this.makeRequest(`/posts/${id}`);

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

  // Create a new post (requires authentication)
  async createPost(postData: CreatePostData): Promise<PostsApiResponse> {
    const response = await this.makeRequest("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
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
    const response = await this.makeRequest(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
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
    return this.makeRequest(`/posts/${id}`, {
      method: "DELETE",
    });
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
}

// Create a singleton instance
export const postsApi = new PostsApi();

// Export the class for static methods
export { PostsApi };

// Export for use in components
export default postsApi;
