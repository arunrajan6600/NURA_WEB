"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const posts_controller_1 = require("../controllers/posts.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', posts_controller_1.postsController.list);
router.get('/:id', posts_controller_1.postsController.getById);
// Protected routes requiring authentication
router.post('/', auth_middleware_1.authMiddleware, posts_controller_1.postsController.create);
router.put('/:id', auth_middleware_1.authMiddleware, posts_controller_1.postsController.update);
router.delete('/:id', auth_middleware_1.authMiddleware, posts_controller_1.postsController.remove);
exports.default = router;
