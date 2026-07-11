"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const server = app_1.default.listen(env_1.env.PORT, () => {
    console.log(`🚀 Server successfully started in ${env_1.env.NODE_ENV} mode on port ${env_1.env.PORT}`);
    console.log(`🔗 Health Check Endpoint: http://localhost:${env_1.env.PORT}/health`);
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => {
        process.exit(1);
    });
});
