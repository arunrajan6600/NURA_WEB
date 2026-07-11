"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const auth_service_1 = require("../services/auth.service");
const error_middleware_1 = require("./error.middleware");
const authMiddleware = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.AppError('Authentication required', 401);
        }
        const token = authHeader.substring(7);
        const user = await auth_service_1.authService.verifyToken(token);
        // Attach verified user to request object
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            return next(error);
        }
        // Capture expired or malformed JWT errors
        const errorMessage = error.name === 'TokenExpiredError'
            ? 'Token expired'
            : 'Invalid token';
        next(new error_middleware_1.AppError(errorMessage, 401));
    }
};
exports.authMiddleware = authMiddleware;
