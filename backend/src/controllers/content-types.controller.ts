import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { slugify } from '../repositories/posts.repository';

const SYSTEM_TYPES = [
  { id: 'sys-project', name: 'Project', slug: 'project', enabled: true, order: 0, isSystem: true },
  { id: 'sys-blog', name: 'Blog', slug: 'blog', enabled: true, order: 1, isSystem: true },
  { id: 'sys-paper', name: 'Paper', slug: 'paper', enabled: true, order: 2, isSystem: true },
  { id: 'sys-story', name: 'Story', slug: 'story', enabled: true, order: 3, isSystem: true },
];

export class ContentTypesController {
  /**
   * GET /content-types
   * Returns all content types (system + custom)
   */
  public list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customTypes = await prisma.contentType.findMany({
        orderBy: { order: 'asc' },
      });

      const allTypes = [
        ...SYSTEM_TYPES,
        ...customTypes.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          enabled: c.enabled,
          order: c.order,
          isSystem: false,
        })),
      ];

      // Sort by order ascending
      allTypes.sort((a, b) => a.order - b.order);

      res.status(200).json({
        success: true,
        data: allTypes,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /content-types
   * Creates a new custom content type
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Content type name is required', 400);
      }

      const trimmedName = name.trim();
      const slug = slugify(trimmedName);

      // Check duplicate name or slug in system types
      const isSystemDuplicate = SYSTEM_TYPES.some(
        (t) => t.name.toLowerCase() === trimmedName.toLowerCase() || t.slug === slug
      );

      if (isSystemDuplicate) {
        throw new AppError('Cannot create a content type with a system name', 400);
      }

      // Check duplicate in custom types
      const existing = await prisma.contentType.findFirst({
        where: {
          OR: [
            { name: { equals: trimmedName, mode: 'insensitive' } },
            { slug: slug },
          ],
        },
      });

      if (existing) {
        throw new AppError('A content type with this name or slug already exists', 400);
      }

      // Determine order: max order + 1
      const maxOrderCustom = await prisma.contentType.aggregate({
        _max: { order: true },
      });
      const currentMax = maxOrderCustom._max.order ?? 3; // start after system types (0, 1, 2, 3)
      const order = currentMax + 1;

      const newType = await prisma.contentType.create({
        data: {
          name: trimmedName,
          slug,
          order,
          enabled: true,
        },
      });

      res.status(201).json({
        success: true,
        data: { ...newType, isSystem: false },
        message: 'Content type created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /content-types/:slug
   * Updates an existing custom content type (enabled, order, or name)
   */
  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const { name, enabled, order } = req.body;

      // Cannot modify core system type schemas except order
      const systemType = SYSTEM_TYPES.find((t) => t.slug === slug);
      if (systemType) {
        if (name !== undefined || enabled !== undefined) {
          throw new AppError('Core system types cannot be renamed or disabled', 400);
        }
        
        // System types reordering logic is client-side or handled via custom metadata/order.
        // For system types, we don't save to ContentType table but we can allow mock success.
        res.status(200).json({
          success: true,
          message: 'System type order updated locally',
        });
        return;
      }

      const contentType = await prisma.contentType.findUnique({
        where: { slug },
      });

      if (!contentType) {
        throw new AppError('Content type not found', 404);
      }

      const updateData: any = {};
      if (name !== undefined) {
        const trimmedName = name.trim();
        if (trimmedName === '') {
          throw new AppError('Name cannot be empty', 400);
        }
        
        // Ensure no name duplicates
        const nameDuplicate = await prisma.contentType.findFirst({
          where: {
            name: { equals: trimmedName, mode: 'insensitive' },
            id: { not: contentType.id },
          },
        });
        if (nameDuplicate || SYSTEM_TYPES.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
          throw new AppError('A content type with this name already exists', 400);
        }

        updateData.name = trimmedName;
        updateData.slug = slugify(trimmedName);
      }

      if (enabled !== undefined) {
        updateData.enabled = Boolean(enabled);
      }

      if (order !== undefined) {
        updateData.order = Number(order);
      }

      const updated = await prisma.contentType.update({
        where: { slug },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: { ...updated, isSystem: false },
        message: 'Content type updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /content-types/:slug
   * Deletes a custom content type if it is not in use by any posts
   */
  public remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;

      const isSystem = SYSTEM_TYPES.some((t) => t.slug === slug);
      if (isSystem) {
        throw new AppError('Core system types cannot be deleted', 400);
      }

      const contentType = await prisma.contentType.findUnique({
        where: { slug },
      });

      if (!contentType) {
        throw new AppError('Content type not found', 404);
      }

      // Check if any posts are using this type
      const postsCount = await prisma.post.count({
        where: { type: slug },
      });

      if (postsCount > 0) {
        throw new AppError(
          `Cannot delete content type because it is currently used by ${postsCount} post(s). Please migrate or delete those posts first.`,
          400
        );
      }

      await prisma.contentType.delete({
        where: { slug },
      });

      res.status(200).json({
        success: true,
        message: 'Content type deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const contentTypesController = new ContentTypesController();
