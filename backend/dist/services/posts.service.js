"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsService = exports.PostsService = void 0;
const posts_repository_1 = require("../repositories/posts.repository");
class PostsService {
    /**
     * Lists all posts based on filtering options.
     */
    async listPosts(filters) {
        const posts = await posts_repository_1.postsRepository.findAll(filters);
        return posts.map(post => this.transformPost(post));
    }
    /**
     * Retrieves a single post by ID or Slug.
     * Increments view count if the post is published.
     */
    async getPost(identifier) {
        let post = null;
        // Try lookup by ID first
        post = await posts_repository_1.postsRepository.findById(identifier);
        // Fallback to lookup by slug if not found by ID
        if (!post) {
            post = await posts_repository_1.postsRepository.findBySlug(identifier);
        }
        if (!post) {
            return null;
        }
        // Increment view count if published
        if (post.status === 'published') {
            await posts_repository_1.postsRepository.incrementViewCount(post.id);
            post.viewCount += 1;
        }
        return this.transformPost(post);
    }
    /**
     * Creates a post in the database.
     */
    async createPost(data) {
        const post = await posts_repository_1.postsRepository.create(data);
        return this.transformPost(post);
    }
    /**
     * Updates a post and its relationships.
     */
    async updatePost(id, data) {
        const post = await posts_repository_1.postsRepository.update(id, data);
        return this.transformPost(post);
    }
    /**
     * Deletes a post from the database.
     */
    async deletePost(id) {
        const deletedPost = await posts_repository_1.postsRepository.delete(id);
        return {
            id: deletedPost.id,
            title: deletedPost.title,
        };
    }
    /**
     * Transforms raw Prisma database post models into the exact API contract shape.
     */
    transformPost(post) {
        const cells = (post.cells || []).map((cell) => {
            let content = cell.content;
            if (typeof cell.content === 'string') {
                try {
                    content = JSON.parse(cell.content);
                }
                catch {
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
exports.PostsService = PostsService;
exports.postsService = new PostsService();
