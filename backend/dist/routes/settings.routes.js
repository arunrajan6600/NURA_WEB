"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /settings - Publicly accessible
router.get('/', settings_controller_1.settingsController.get);
// PUT /settings - Protected by JWT Auth
router.put('/', auth_middleware_1.authMiddleware, settings_controller_1.settingsController.update);
exports.default = router;
