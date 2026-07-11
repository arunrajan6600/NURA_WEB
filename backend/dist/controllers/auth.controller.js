"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const error_middleware_1 = require("../middleware/error.middleware");
const loginSchema = zod_1.z.object({
    username: zod_1.z.string({ required_error: 'Username is required' }).min(1, 'Username is required'),
    password: zod_1.z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});
class AuthController {
    /**
     * Handles admin login request.
     */
    login = async (req, res, next) => {
        try {
            const parseResult = loginSchema.safeParse(req.body);
            if (!parseResult.success) {
                // Return 400 Bad Request for malformed input
                const issues = parseResult.error.issues.map((i) => i.message).join(', ');
                throw new error_middleware_1.AppError(issues || 'Invalid request body', 400);
            }
            const { username, password } = parseResult.data;
            const token = await auth_service_1.authService.login(username, password);
            if (!token) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                });
                return;
            }
            res.status(200).json({
                success: true,
                token,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Handles verify token request.
     * Returns exact format required by the frontend client.
     */
    verify = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ valid: false });
                return;
            }
            const token = authHeader.substring(7);
            try {
                const user = await auth_service_1.authService.verifyToken(token);
                res.status(200).json({
                    valid: true,
                    user,
                });
            }
            catch {
                res.status(401).json({ valid: false });
            }
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
