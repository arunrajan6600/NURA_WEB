import prisma from '../config/prisma';
import { PostCell } from '../types/post.types';

export class CellsRepository {
  /**
   * Deletes all cells associated with a post.
   */
  public async deleteByPostId(postId: string): Promise<void> {
    await prisma.cell.deleteMany({
      where: { postId },
    });
  }

  /**
   * Bulk inserts cells for a post.
   */
  public async createMany(postId: string, cells: PostCell[]): Promise<void> {
    if (!cells || cells.length === 0) return;

    const data = cells.map((cell, index) => ({
      postId,
      type: cell.type,
      content: typeof cell.content === 'string' ? cell.content : JSON.stringify(cell.content),
      orderIndex: cell.orderIndex ?? (index + 1),
    }));

    await prisma.cell.createMany({
      data,
    });
  }
}

export const cellsRepository = new CellsRepository();
