"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsController = exports.PostsController = void 0;
const zod_1 = require("zod");
const posts_service_1 = require("../services/posts.service");
const auth_service_1 = require("../services/auth.service");
const error_middleware_1 = require("../middleware/error.middleware");
const cellSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    type: zod_1.z.enum(['markdown', 'image', 'video', 'file']),
    content: zod_1.z.any(),
    orderIndex: zod_1.z.number().int(),
});
const thumbnailSchema = zod_1.z.object({
    url: zod_1.z.string().url('Thumbnail must be a valid URL'),
    alt: zod_1.z.string().default(''),
});
const researchMetadataSchema = zod_1.z.object({
    publicationYear: zod_1.z.string().optional(),
    authors: zod_1.z.string().optional(),
    venue: zod_1.z.string().optional(),
    abstract: zod_1.z.string().optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    externalLinks: zod_1.z.any().optional(),
    pdfAttachment: zod_1.z.string().optional(),
    researchCategory: zod_1.z.string().optional(),
});
const projectSectionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    content: zod_1.z.string(),
    order: zod_1.z.number().int(),
});
const projectMetadataSchema = zod_1.z.object({
    // Basic project info
    subtitle: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
    client: zod_1.z.string().optional(),
    teamMembers: zod_1.z.string().optional(),
    // Timeline
    year: zod_1.z.string().optional(),
    duration: zod_1.z.string().optional(),
    // Links
    repoLink: zod_1.z.string().optional(),
    demoLink: zod_1.z.string().optional(),
    docLink: zod_1.z.string().optional(),
    // Media / exhibition
    medium: zod_1.z.string().optional(),
    collaborators: zod_1.z.string().optional(),
    institution: zod_1.z.string().optional(),
    exhibition: zod_1.z.string().optional(),
    publication: zod_1.z.string().optional(),
    researchArea: zod_1.z.string().optional(),
    // Arrays
    tools: zod_1.z.array(zod_1.z.string()).optional(),
    technologies: zod_1.z.array(zod_1.z.string()).optional(),
    // Structured data
    credits: zod_1.z.any().optional(),
    references: zod_1.z.any().optional(),
    sections: zod_1.z.array(projectSectionSchema).optional(),
});
const createPostSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    title: zod_1.z.string().min(1, 'Title is required'),
    slug: zod_1.z.string().optional(),
    status: zod_1.z.enum(['draft', 'published']).default('draft'),
    type: zod_1.z.enum(['project', 'blog', 'paper', 'article', 'story', 'general']).default('blog'),
    featured: zod_1.z.boolean().default(false),
    pinned: zod_1.z.boolean().default(false),
    archived: zod_1.z.boolean().default(false),
    excerpt: zod_1.z.string().nullable().optional(),
    thumbnail: thumbnailSchema.nullable().optional(),
    authorId: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string().trim()).optional().default([]),
    cells: zod_1.z.array(cellSchema).optional(),
    researchMetadata: researchMetadataSchema.optional(),
    projectMetadata: projectMetadataSchema.optional(),
});
const updatePostSchema = createPostSchema.partial();
const querySchema = zod_1.z.object({
    status: zod_1.z.enum(['draft', 'published']).optional(),
    type: zod_1.z.enum(['project', 'blog', 'paper', 'article', 'story', 'general']).optional(),
    featured: zod_1.z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    tags: zod_1.z.string().optional(), // comma-separated list
    limit: zod_1.z.coerce.number().int().positive().optional(),
});
class PostsController {
    /**
     * GET /posts
     */
    list = async (req, res, next) => {
        try {
            const parseResult = querySchema.safeParse(req.query);
            if (!parseResult.success) {
                throw new error_middleware_1.AppError('Invalid query parameters', 400);
            }
            // Check admin status to filter drafts
            let isAdmin = false;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    await auth_service_1.authService.verifyToken(token);
                    isAdmin = true;
                }
                catch {
                    // Token is invalid/expired
                }
            }
            const queryData = parseResult.data;
            // Restrict drafts
            if (!isAdmin) {
                if (queryData.status === 'draft') {
                    throw new error_middleware_1.AppError('Authentication required to view drafts', 401);
                }
                // Force status to published if not specified
                if (!queryData.status) {
                    queryData.status = 'published';
                }
            }
            // Parse comma-separated tags into array
            const filters = {
                status: queryData.status,
                type: queryData.type,
                featured: queryData.featured,
                limit: queryData.limit,
            };
            if (queryData.tags) {
                filters.tags = queryData.tags.split(',').map((t) => t.trim()).filter(Boolean);
            }
            const posts = await posts_service_1.postsService.listPosts(filters);
            res.status(200).json({
                success: true,
                data: posts,
                count: posts.length,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /posts/:id
     */
    getById = async (req, res, next) => {
        try {
            const identifier = req.params.id;
            if (!identifier) {
                throw new error_middleware_1.AppError('Post ID or slug is required', 400);
            }
            const post = await posts_service_1.postsService.getPost(identifier);
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
                        await auth_service_1.authService.verifyToken(token);
                        isAdmin = true;
                    }
                    catch {
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /posts
     */
    create = async (req, res, next) => {
        try {
            const parseResult = createPostSchema.safeParse(req.body);
            if (!parseResult.success) {
                const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
                throw new error_middleware_1.AppError(issues || 'Invalid request body', 400);
            }
            const newPost = await posts_service_1.postsService.createPost(parseResult.data);
            res.status(201).json({
                success: true,
                data: newPost,
                message: 'Post created successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PUT /posts/:id
     */
    update = async (req, res, next) => {
        try {
            const postId = req.params.id;
            if (!postId) {
                throw new error_middleware_1.AppError('Post ID is required', 400);
            }
            const parseResult = updatePostSchema.safeParse(req.body);
            if (!parseResult.success) {
                const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
                throw new error_middleware_1.AppError(issues || 'Invalid request body', 400);
            }
            const updatedPost = await posts_service_1.postsService.updatePost(postId, parseResult.data);
            res.status(200).json({
                success: true,
                data: updatedPost,
                message: 'Post updated successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * DELETE /posts/:id
     */
    remove = async (req, res, next) => {
        try {
            const postId = req.params.id;
            if (!postId) {
                throw new error_middleware_1.AppError('Post ID is required', 400);
            }
            const result = await posts_service_1.postsService.deletePost(postId);
            res.status(200).json({
                success: true,
                message: 'Post deleted successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PostsController = PostsController;
exports.postsController = new PostsController();
