"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const router = (0, express_1.Router)();
// GET /health - basic system sanity check
router.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok'
    });
});
// Auth endpoints
router.use('/auth', auth_routes_1.default);
// Posts endpoints
const posts_routes_1 = __importDefault(require("./posts.routes"));
router.use('/posts', posts_routes_1.default);
// Files endpoints
const files_routes_1 = __importDefault(require("./files.routes"));
router.use('/files', files_routes_1.default);
// Settings endpoints
const settings_routes_1 = __importDefault(require("./settings.routes"));
router.use('/settings', settings_routes_1.default);
// Resume endpoints
const resume_routes_1 = __importDefault(require("./resume.routes"));
router.use('/resume', resume_routes_1.default);
exports.default = router;
