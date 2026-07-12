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

const thumbnailSchema = z.object({
  url: z.string().url('Thumbnail must be a valid URL'),
  alt: z.string().default(''),
});

const researchMetadataSchema = z.object({
  publicationYear: z.string().optional(),
  authors: z.string().optional(),
  venue: z.string().optional(),
  abstract: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  externalLinks: z.any().optional(),
  pdfAttachment: z.string().optional(),
  researchCategory: z.string().optional(),
});

const projectMetadataSchema = z.object({
  year: z.string().optional(),
  duration: z.string().optional(),
  medium: z.string().optional(),
  collaborators: z.string().optional(),
  tools: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  institution: z.string().optional(),
  exhibition: z.string().optional(),
  publication: z.string().optional(),
  researchArea: z.string().optional(),
  credits: z.any().optional(),
  references: z.any().optional(),
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
  excerpt: z.string().nullable().optional(),
  thumbnail: thumbnailSchema.nullable().optional(),
  authorId: z.string().optional(),
  cells: z.array(cellSchema).optional(),
  researchMetadata: researchMetadataSchema.optional(),
  projectMetadata: projectMetadataSchema.optional(),
});

const updatePostSchema = createPostSchema.partial();

const querySchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  type: z.enum(['project', 'blog', 'paper', 'article', 'story', 'general']).optional(),
  featured: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
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

      const posts = await postsService.listPosts(queryData);

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
