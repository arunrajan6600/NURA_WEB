"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cellsRepository = exports.CellsRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class CellsRepository {
    /**
     * Deletes all cells associated with a post.
     */
    async deleteByPostId(postId) {
        await prisma_1.default.cell.deleteMany({
            where: { postId },
        });
    }
    /**
     * Bulk inserts cells for a post.
     */
    async createMany(postId, cells) {
        if (!cells || cells.length === 0)
            return;
        const data = cells.map((cell, index) => ({
            postId,
            type: cell.type,
            content: typeof cell.content === 'string' ? cell.content : JSON.stringify(cell.content),
            orderIndex: cell.orderIndex ?? (index + 1),
        }));
        await prisma_1.default.cell.createMany({
            data,
        });
    }
}
exports.CellsRepository = CellsRepository;
exports.cellsRepository = new CellsRepository();
