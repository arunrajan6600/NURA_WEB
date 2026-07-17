import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { postsService } from '../services/posts.service';
import { authService } from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';

const cellSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['markdown', 'image', 'video', 'file']),
  content: z.any(),
  orderIndex: z.number().int(),
});

// Converts null/undefined/empty-string to null; otherwise trims and validates as string
const nullableString = z.preprocess((val: any) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  return typeof val === 'string' ? val.trim() : String(val).trim();
}, z.string().nullable().optional());

// Converts null/undefined to []; normalises comma-strings and arrays of values
const optionalArray = z.preprocess((val: any) => {
  if (val === null || val === undefined) return [];
  if (typeof val === 'string') {
    return val.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(val)) {
    return val.map((s: any) => String(s).trim()).filter(Boolean);
  }
  return [];
}, z.array(z.string()));

const thumbnailSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return null;
  if (!val.url || (typeof val.url === 'string' && val.url.trim() === '')) {
    return null;
  }
  return {
    url: val.url.trim(),
    alt: typeof val.alt === 'string' ? val.alt.trim() : '',
  };
}, z.object({
  url: z.string().url('Thumbnail must be a valid URL'),
  alt: z.string().default(''),
}).nullable());

const researchMetadataSchema = z.object({
  publicationYear: nullableString,
  authors: nullableString,
  venue: nullableString,
  abstract: nullableString,
  keywords: optionalArray,
  externalLinks: z.any().nullable().optional(),
  pdfAttachment: nullableString,
  researchCategory: nullableString,
});

const projectSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  order: z.number().int(),
});

const projectMetadataSchema = z.object({
  // Basic project info
  subtitle: nullableString,
  category: nullableString,
  role: nullableString,
  client: nullableString,
  teamMembers: nullableString,
  // Timeline
  year: nullableString,
  duration: nullableString,
  // Links
  repoLink: nullableString,
  demoLink: nullableString,
  docLink: nullableString,
  // Media / exhibition
  medium: nullableString,
  collaborators: nullableString,
  institution: nullableString,
  exhibition: nullableString,
  publication: nullableString,
  researchArea: nullableString,
  // Project creation date (actual work date, NOT CMS publish date)
  projectCreationDate: nullableString,
  // Arrays
  tools: optionalArray,
  technologies: optionalArray,
  // Structured data
  credits: z.any().nullable().optional(),
  references: z.any().nullable().optional(),
  sections: z.preprocess((val: any) => {
    if (val === null || val === undefined) return null;
    return val;
  }, z.array(projectSectionSchema).nullable().optional()),
});

const createPostSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  type: z.enum(['project', 'blog', 'paper', 'article', 'story', 'general']).default('blog'),
  featured: z.boolean().default(false),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  excerpt: nullableString,
  thumbnail: thumbnailSchema.nullable().optional(),
  authorId: z.string().optional(),
  tags: optionalArray,
  cells: z.array(cellSchema).optional(),
  researchMetadata: researchMetadataSchema.nullable().optional(),
  projectMetadata: projectMetadataSchema.nullable().optional(),
});

const updatePostSchema = createPostSchema.partial();

const querySchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  type: z.enum(['project', 'blog', 'paper', 'article', 'story', 'general']).optional(),
  featured: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  tags: z.string().optional(), // comma-separated list
  limit: z.coerce.number().int().positive().optional(),
});

export class PostsController {
  /**
   * GET /posts
   */
  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = querySchema.safeParse(req.query);

      if (!parseResult.success) {
        throw new AppError('Invalid query parameters', 400);
      }

      // Check admin status to filter drafts
      let isAdmin = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          await authService.verifyToken(token);
          isAdmin = true;
        } catch {
          // Token is invalid/expired
        }
      }

      const queryData = parseResult.data;

      // Restrict drafts
      if (!isAdmin) {
        if (queryData.status === 'draft') {
          throw new AppError('Authentication required to view drafts', 401);
        }
        // Force status to published if not specified
        if (!queryData.status) {
          queryData.status = 'published';
        }
      }

      // Parse comma-separated tags into array
      const filters: any = {
        status: queryData.status,
        type: queryData.type,
        featured: queryData.featured,
        limit: queryData.limit,
      };
      if (queryData.tags) {
        filters.tags = queryData.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }

      const posts = await postsService.listPosts(filters);

      res.status(200).json({
        success: true,
        data: posts,
        count: posts.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /posts/:id
   */
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.params.id;

      if (!identifier) {
        throw new AppError('Post ID or slug is required', 400);
      }

      const post = await postsService.getPost(identifier);

      if (!post) {
        res.status(404).json({
          success: false,
          error: 'Post not found',
        });
        return;
      }

      // Restrict drafts in getById
      if (post.status === 'draft') {
        let isAdmin = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          try {
            await authService.verifyToken(token);
            isAdmin = true;
          } catch {
            // Token is invalid/expired
          }
        }

        if (!isAdmin) {
          res.status(404).json({
            success: false,
            error: 'Post not found',
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /posts
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createPostSchema.safeParse(req.body);

      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        throw new AppError(issues || 'Invalid request body', 400);
      }

      const newPost = await postsService.createPost(parseResult.data);

      res.status(201).json({
        success: true,
        data: newPost,
        message: 'Post created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /posts/:id
   */
  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = req.params.id;

      if (!postId) {
        throw new AppError('Post ID is required', 400);
      }

      const parseResult = updatePostSchema.safeParse(req.body);

      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        throw new AppError(issues || 'Invalid request body', 400);
      }

      const updatedPost = await postsService.updatePost(postId, parseResult.data);

      res.status(200).json({
        success: true,
        data: updatedPost,
        message: 'Post updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /posts/:id
   */
  public remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = req.params.id;

      if (!postId) {
        throw new AppError('Post ID is required', 400);
      }

      const result = await postsService.deletePost(postId);

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const postsController = new PostsController();
