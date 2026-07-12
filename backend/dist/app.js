"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
// Secure Express headers with Helmet
app.use((0, helmet_1.default)());
// Configure CORS policy
app.use((0, cors_1.default)({
    origin: env_1.env.ALLOWED_ORIGIN === '*' ? true : env_1.env.ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));
// HTTP request logging middleware
const logFormat = env_1.env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use((0, morgan_1.default)(logFormat));
// Request body parsers
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Mount API routes
app.use('/', routes_1.default);
// Catch 404 and forward to error handler
app.use((req, _res, next) => {
    next(new error_middleware_1.AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});
// Register global error handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
