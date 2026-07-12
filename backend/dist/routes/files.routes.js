"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const files_controller_1 = require("../controllers/files.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Multer memory storage configuration
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});
// Protect all files endpoints using JWT auth middleware
router.use(auth_middleware_1.authMiddleware);
// Routes
router.get('/', files_controller_1.filesController.list);
router.post('/upload', upload.single('file'), files_controller_1.filesController.upload);
router.post('/presigned-url', files_controller_1.filesController.getPresignedUrl);
router.delete('/:id', files_controller_1.filesController.remove);
router.patch('/:id/rename', files_controller_1.filesController.rename);
exports.default = router;
