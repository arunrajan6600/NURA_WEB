"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
class AuthService {
    /**
     * Validates user credentials and signs a JWT if credentials match.
     */
    async login(username, password) {
        if (username !== env_1.env.ADMIN_USERNAME || password !== env_1.env.ADMIN_PASSWORD) {
            return null;
        }
        const payload = {
            username,
            isAdmin: true,
        };
        // Sign the token with a 24-hour expiration
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: '24h',
            algorithm: 'HS256',
        });
    }
    /**
     * Verifies the authenticity and expiration of a JWT token.
     */
    async verifyToken(token) {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        if (!decoded.username || decoded.isAdmin !== true) {
            throw new Error('Invalid token payload');
        }
        return {
            username: decoded.username,
            role: 'admin',
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
