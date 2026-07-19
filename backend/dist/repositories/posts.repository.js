"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsRepository = exports.PostsRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class PostsRepository {
    /**
     * Finds all posts matching the filter criteria.
     */
    async findAll(filters) {
        const where = {};
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.featured !== undefined) {
            where.featured = filters.featured;
        }
        // Filter by tags — post must contain ALL specified tags
        if (filters.tags && filters.tags.length > 0) {
            where.tags = {
                hasEvery: filters.tags,
            };
        }
        return prisma_1.default.post.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: filters.limit,
            include: {
                cells: {
                    orderBy: {
                        orderIndex: 'asc',
                    },
                },
                researchMetadata: true,
                projectMetadata: true,
            },
        });
    }
    /**
     * Finds a post by its ID.
     */
    async findById(id) {
        return prisma_1.default.post.findUnique({
            where: { id },
            include: {
                cells: {
                    orderBy: {
                        orderIndex: 'asc',
                    },
                },
                researchMetadata: true,
                projectMetadata: true,
            },
        });
    }
    /**
     * Finds a post by its unique slug.
     */
    async findBySlug(slug) {
        return prisma_1.default.post.findUnique({
            where: { slug },
            include: {
                cells: {
                    orderBy: {
                        orderIndex: 'asc',
                    },
                },
                researchMetadata: true,
                projectMetadata: true,
            },
        });
    }
    /**
     * Creates a post along with cells and optional metadata in a transaction.
     */
    async create(data) {
        const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const now = new Date();
        return prisma_1.default.$transaction(async (tx) => {
            const post = await tx.post.create({
                data: {
                    id: data.id,
                    title: data.title,
                    slug,
                    status: data.status || 'draft',
                    type: data.type || 'blog',
                    featured: data.featured || false,
                    pinned: data.pinned || false,
                    archived: data.archived || false,
                    excerpt: data.excerpt,
                    thumbnailUrl: data.thumbnail?.url || null,
                    thumbnailAlt: data.thumbnail?.alt || null,
                    authorId: data.authorId || '00000000-0000-0000-0000-000000000001',
                    tags: data.tags || [],
                    publishedAt: data.status === 'published' ? now : null,
                    viewCount: 0,
                    likeCount: 0,
                },
            });
            // Insert cells
            if (data.cells && data.cells.length > 0) {
                const cellsData = data.cells.map((cell, index) => ({
                    postId: post.id,
                    type: cell.type,
                    content: typeof cell.content === 'string' ? cell.content : JSON.stringify(cell.content),
                    orderIndex: cell.orderIndex ?? (index + 1),
                }));
                await tx.cell.createMany({
                    data: cellsData,
                });
            }
            // Insert research metadata
            if (data.researchMetadata) {
                await tx.researchMetadata.create({
                    data: {
                        postId: post.id,
                        ...data.researchMetadata,
                    },
                });
            }
            if (data.projectMetadata) {
                const { sections, links, credits, ...restMeta } = data.projectMetadata;
                await tx.projectMetadata.create({
                    data: {
                        postId: post.id,
                        ...restMeta,
                        sections: sections ? sections : undefined,
                        links: links ? links : undefined,
                        credits: credits ? credits : undefined,
                    },
                });
            }
            // Fetch the fully created post
            return tx.post.findUniqueOrThrow({
                where: { id: post.id },
                include: {
                    cells: {
                        orderBy: {
                            orderIndex: 'asc',
                        },
                    },
                    researchMetadata: true,
                    projectMetadata: true,
                },
            });
        });
    }
    /**
     * Updates a post and its relationships inside a transaction.
     */
    async update(id, data) {
        return prisma_1.default.$transaction(async (tx) => {
            const existing = await tx.post.findUniqueOrThrow({ where: { id } });
            const slug = data.slug !== undefined
                ? data.slug
                : data.title !== undefined
                    ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    : existing.slug;
            const updateData = {};
            if (data.title !== undefined)
                updateData.title = data.title;
            if (slug !== undefined)
                updateData.slug = slug;
            if (data.status !== undefined) {
                updateData.status = data.status;
                if (data.status === 'published' && !existing.publishedAt) {
                    updateData.publishedAt = new Date();
                }
            }
            if (data.type !== undefined)
                updateData.type = data.type;
            if (data.featured !== undefined)
                updateData.featured = data.featured;
            if (data.pinned !== undefined)
                updateData.pinned = data.pinned;
            if (data.archived !== undefined)
                updateData.archived = data.archived;
            if (data.excerpt !== undefined)
                updateData.excerpt = data.excerpt;
            if (data.thumbnail !== undefined) {
                updateData.thumbnailUrl = data.thumbnail?.url || null;
                updateData.thumbnailAlt = data.thumbnail?.alt || null;
            }
            if (data.authorId !== undefined)
                updateData.authorId = data.authorId;
            if (data.tags !== undefined)
                updateData.tags = data.tags;
            await tx.post.update({
                where: { id },
                data: updateData,
            });
            // Handle cell replacement if provided
            if (data.cells !== undefined) {
                // Delete all old cells
                await tx.cell.deleteMany({
                    where: { postId: id },
                });
                // Insert new cells
                if (data.cells.length > 0) {
                    const cellsData = data.cells.map((cell, index) => ({
                        postId: id,
                        type: cell.type,
                        content: typeof cell.content === 'string' ? cell.content : JSON.stringify(cell.content),
                        orderIndex: cell.orderIndex ?? (index + 1),
                    }));
                    await tx.cell.createMany({
                        data: cellsData,
                    });
                }
            }
            // Handle research metadata updates
            if (data.researchMetadata !== undefined) {
                await tx.researchMetadata.deleteMany({ where: { postId: id } });
                if (data.researchMetadata) {
                    await tx.researchMetadata.create({
                        data: {
                            postId: id,
                            ...data.researchMetadata,
                        },
                    });
                }
            }
            if (data.projectMetadata !== undefined) {
                await tx.projectMetadata.deleteMany({ where: { postId: id } });
                if (data.projectMetadata) {
                    const { sections, links, credits, ...restMeta } = data.projectMetadata;
                    await tx.projectMetadata.create({
                        data: {
                            postId: id,
                            ...restMeta,
                            sections: sections ? sections : undefined,
                            links: links ? links : undefined,
                            credits: credits ? credits : undefined,
                        },
                    });
                }
            }
            return tx.post.findUniqueOrThrow({
                where: { id },
                include: {
                    cells: {
                        orderBy: {
                            orderIndex: 'asc',
                        },
                    },
                    researchMetadata: true,
                    projectMetadata: true,
                },
            });
        });
    }
    /**
     * Deletes a post. Relationships are cascade-deleted at the DB level.
     */
    async delete(id) {
        const post = await prisma_1.default.post.findUniqueOrThrow({ where: { id } });
        await prisma_1.default.post.delete({
            where: { id },
        });
        return post;
    }
    /**
     * Atomically increments the view count of a post.
     */
    async incrementViewCount(id) {
        return prisma_1.default.post.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });
    }
}
exports.PostsRepository = PostsRepository;
exports.postsRepository = new PostsRepository();
