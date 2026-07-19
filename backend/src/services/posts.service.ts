import { postsRepository } from '../repositories/posts.repository';
import { CreatePostInput, UpdatePostInput, PostFilters, PostApiResponse } from '../types/post.types';

export class PostsService {
  /**
   * Lists all posts based on filtering options.
   */
  public async listPosts(filters: PostFilters): Promise<PostApiResponse[]> {
    const posts = await postsRepository.findAll(filters);
    return posts.map(post => this.transformPost(post));
  }

  /**
   * Retrieves a single post by ID or Slug.
   * Increments view count if the post is published.
   */
  public async getPost(identifier: string): Promise<PostApiResponse | null> {
    let post = null;

    // Try lookup by ID first
    post = await postsRepository.findById(identifier);
    
    // Fallback to lookup by slug if not found by ID
    if (!post) {
      post = await postsRepository.findBySlug(identifier);
    }

    // Try decoding in case identifier was URL encoded in the request
    if (!post) {
      try {
        const decoded = decodeURIComponent(identifier);
        if (decoded !== identifier) {
          post = await postsRepository.findBySlug(decoded);
        }
      } catch {
        // Ignore malformed URI errors
      }
    }

    if (!post) {
      return null;
    }

    // Increment view count if published
    if (post.status === 'published') {
      await postsRepository.incrementViewCount(post.id);
      post.viewCount += 1;
    }

    return this.transformPost(post);
  }

  /**
   * Creates a post in the database.
   */
  public async createPost(data: CreatePostInput): Promise<PostApiResponse> {
    const post = await postsRepository.create(data);
    return this.transformPost(post);
  }

  /**
   * Updates a post and its relationships.
   */
  public async updatePost(id: string, data: UpdatePostInput): Promise<PostApiResponse> {
    const post = await postsRepository.update(id, data);
    return this.transformPost(post);
  }

  /**
   * Deletes a post from the database.
   */
  public async deletePost(id: string): Promise<{ id: string; title: string }> {
    const deletedPost = await postsRepository.delete(id);
    return {
      id: deletedPost.id,
      title: deletedPost.title,
    };
  }

  /**
   * Transforms raw Prisma database post models into the exact API contract shape.
   */
  private transformPost(post: any): PostApiResponse {
    const cells = (post.cells || []).map((cell: any) => {
      let content = cell.content;
      if (typeof cell.content === 'string') {
        try {
          content = JSON.parse(cell.content);
        } catch {
          content = cell.content;
        }
      }
      // Normalize legacy { text: '...' } format for markdown cells to plain strings
      if (cell.type === 'markdown' && content !== null && typeof content === 'object' && typeof content.text === 'string') {
        content = content.text;
      }
      return {
        id: cell.id,
        type: cell.type,
        content,
        order: cell.orderIndex,
      };
    });

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      featured: post.featured,
      type: post.type,
      thumbnail: post.thumbnailUrl
        ? {
            url: post.thumbnailUrl,
            alt: post.thumbnailAlt || '',
          }
        : undefined,
      excerpt: post.excerpt,
      tags: post.tags || [],
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      contentCreationDate: post.contentCreationDate ?? null,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      cells,
      ...(post.researchMetadata && {
        researchMetadata: {
          publicationYear: post.researchMetadata.publicationYear,
          authors: post.researchMetadata.authors,
          venue: post.researchMetadata.venue,
          abstract: post.researchMetadata.abstract,
          keywords: post.researchMetadata.keywords,
          externalLinks: post.researchMetadata.externalLinks,
          pdfAttachment: post.researchMetadata.pdfAttachment,
          researchCategory: post.researchMetadata.researchCategory,
        },
      }),
      ...(post.projectMetadata && {
        projectMetadata: {
          // Basic info
          subtitle: post.projectMetadata.subtitle,
          category: post.projectMetadata.category,
          role: post.projectMetadata.role,
          client: post.projectMetadata.client,
          teamMembers: post.projectMetadata.teamMembers,
          // Timeline
          year: post.projectMetadata.year,
          duration: post.projectMetadata.duration,
          // Links (legacy scalar fields kept for backward compat)
          repoLink: post.projectMetadata.repoLink,
          demoLink: post.projectMetadata.demoLink,
          docLink: post.projectMetadata.docLink,
          // Media / exhibition
          medium: post.projectMetadata.medium,
          collaborators: post.projectMetadata.collaborators,
          tools: post.projectMetadata.tools,
          technologies: post.projectMetadata.technologies,
          institution: post.projectMetadata.institution,
          exhibition: post.projectMetadata.exhibition,
          publication: post.projectMetadata.publication,
          researchArea: post.projectMetadata.researchArea,
          projectCreationDate: post.projectMetadata.projectCreationDate,
          // Structured repeatable collections
          links: post.projectMetadata.links,
          credits: post.projectMetadata.credits,
          references: post.projectMetadata.references,
          sections: post.projectMetadata.sections,
        },
      }),
    };
  }
}

export const postsService = new PostsService();
