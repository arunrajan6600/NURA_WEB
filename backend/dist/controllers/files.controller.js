"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesController = exports.FilesController = void 0;
const zod_1 = require("zod");
const storage_service_1 = require("../services/storage.service");
const error_middleware_1 = require("../middleware/error.middleware");
const presignedUrlSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1, 'filename is required'),
    contentType: zod_1.z.string().min(1, 'contentType is required'),
    size: zod_1.z.coerce.number().int().positive('size must be positive'),
});
const ALLOWED_TYPES = [
    'image/',
    'video/',
    'audio/',
    'application/pdf',
    'text/',
];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const validateFileAttrs = (contentType, size) => {
    if (size > MAX_SIZE) {
        throw new error_middleware_1.AppError(`File size exceeds 50MB limit`, 400);
    }
    const isAllowed = ALLOWED_TYPES.some((type) => contentType.startsWith(type));
    if (!isAllowed) {
        throw new error_middleware_1.AppError(`File type ${contentType} not allowed`, 400);
    }
};
class FilesController {
    /**
     * GET /files
     */
    list = async (_req, res, next) => {
        try {
            const files = await storage_service_1.storageService.list();
            res.status(200).json(files);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /files/upload
     */
    upload = async (req, res, next) => {
        try {
            if (!req.file) {
                throw new error_middleware_1.AppError('No file uploaded', 400);
            }
            const file = req.file;
            const username = req.user?.username || 'admin';
            // Validate mimetype & size
            validateFileAttrs(file.mimetype, file.size);
            // Perform upload
            const result = await storage_service_1.storageService.upload(file.buffer, file.originalname, file.mimetype, username);
            res.status(201).json({
                message: 'Files uploaded successfully',
                files: [result],
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /files/presigned-url
     */
    getPresignedUrl = async (req, res, next) => {
        try {
            const parseResult = presignedUrlSchema.safeParse(req.body);
            if (!parseResult.success) {
                const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
                throw new error_middleware_1.AppError(issues || 'Invalid request body', 400);
            }
            const { filename, contentType, size } = parseResult.data;
            const username = req.user?.username || 'admin';
            // Validate
            validateFileAttrs(contentType, size);
            // Generate url
            const result = await storage_service_1.storageService.createSignedUploadUrl(filename, contentType, size, username);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * DELETE /files/:id
     */
    remove = async (req, res, next) => {
        try {
            const fileId = req.params.id;
            if (!fileId) {
                throw new error_middleware_1.AppError('File ID is required', 400);
            }
            await storage_service_1.storageService.delete(fileId);
            res.status(200).json({
                message: 'File deleted successfully',
                fileId: fileId,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /files/:id/rename
     */
    rename = async (req, res, next) => {
        try {
            const fileId = req.params.id;
            const { newName } = req.body;
            if (!fileId) {
                throw new error_middleware_1.AppError('File ID is required', 400);
            }
            if (!newName || typeof newName !== 'string') {
                throw new error_middleware_1.AppError('newName string is required', 400);
            }
            await storage_service_1.storageService.rename(fileId, newName);
            res.status(200).json({
                success: true,
                message: 'File renamed successfully',
                fileId,
                newName
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.FilesController = FilesController;
exports.filesController = new FilesController();
