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
// Converts null/undefined/empty-string to null; otherwise trims and validates as string
const nullableString = zod_1.z.preprocess((val) => {
    if (val === null || val === undefined)
        return null;
    if (typeof val === 'string' && val.trim() === '')
        return null;
    return typeof val === 'string' ? val.trim() : String(val).trim();
}, zod_1.z.string().nullable().optional());
// Converts null/undefined to []; normalises comma-strings and arrays of values
const optionalArray = zod_1.z.preprocess((val) => {
    if (val === null || val === undefined)
        return [];
    if (typeof val === 'string') {
        return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(val)) {
        return val.map((s) => String(s).trim()).filter(Boolean);
    }
    return [];
}, zod_1.z.array(zod_1.z.string()));
const thumbnailSchema = zod_1.z.preprocess((val) => {
    if (!val || typeof val !== 'object')
        return null;
    if (!val.url || (typeof val.url === 'string' && val.url.trim() === '')) {
        return null;
    }
    return {
        url: val.url.trim(),
        alt: typeof val.alt === 'string' ? val.alt.trim() : '',
    };
}, zod_1.z.object({
    url: zod_1.z.string().url('Thumbnail must be a valid URL'),
    alt: zod_1.z.string().default(''),
}).nullable());
const researchMetadataSchema = zod_1.z.object({
    publicationYear: nullableString,
    authors: nullableString,
    venue: nullableString,
    abstract: nullableString,
    keywords: optionalArray,
    externalLinks: zod_1.z.any().nullable().optional(),
    pdfAttachment: nullableString,
    researchCategory: nullableString,
});
const projectSectionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    content: zod_1.z.string(),
    order: zod_1.z.number().int(),
});
const linkItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['publication', 'repository', 'demo', 'documentation', 'website', 'dataset', 'presentation', 'video', 'doi', 'other']),
    title: zod_1.z.string().min(1, 'Link title is required'),
    url: zod_1.z.string().url('Link must be a valid URL'),
    description: zod_1.z.string().nullable().optional(),
    order: zod_1.z.number().int(),
});
const creditItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    role: zod_1.z.enum(['developer', 'contributor', 'advisor', 'supervisor', 'mentor', 'institution', 'organization', 'client', 'sponsor', 'funding', 'research_lab', 'designer', 'tester', 'reviewer', 'other']),
    name: zod_1.z.string().min(1, 'Credit name is required'),
    organization: zod_1.z.string().nullable().optional(),
    url: zod_1.z.string().url('Credit URL must be valid').nullable().optional().or(zod_1.z.literal('')),
    description: zod_1.z.string().nullable().optional(),
    order: zod_1.z.number().int(),
});
const projectMetadataSchema = zod_1.z.object({
    // Basic project info
    subtitle: nullableString,
    category: nullableString,
    role: nullableString,
    client: nullableString,
    teamMembers: nullableString,
    // Timeline
    year: nullableString,
    duration: nullableString,
    // Legacy single-value links (backward compat)
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
    // Structured repeatable collections
    links: zod_1.z.preprocess((val) => {
        if (val === null || val === undefined)
            return null;
        return val;
    }, zod_1.z.array(linkItemSchema).nullable().optional()),
    credits: zod_1.z.preprocess((val) => {
        if (val === null || val === undefined)
            return null;
        return val;
    }, zod_1.z.union([zod_1.z.array(creditItemSchema), zod_1.z.record(zod_1.z.any())]).nullable().optional()),
    references: zod_1.z.any().nullable().optional(),
    sections: zod_1.z.preprocess((val) => {
        if (val === null || val === undefined)
            return null;
        return val;
    }, zod_1.z.array(projectSectionSchema).nullable().optional()),
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
    excerpt: nullableString,
    thumbnail: thumbnailSchema.nullable().optional(),
    authorId: zod_1.z.string().optional(),
    tags: optionalArray,
    cells: zod_1.z.array(cellSchema).optional(),
    researchMetadata: researchMetadataSchema.nullable().optional(),
    projectMetadata: projectMetadataSchema.nullable().optional(),
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
