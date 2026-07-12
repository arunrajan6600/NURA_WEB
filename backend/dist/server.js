"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const storage_service_1 = require("./services/storage.service");
const prisma_1 = __importDefault(require("./config/prisma"));
let server;
async function startServer() {
    // 1. Run startup checks (e.g. ensure Supabase storage bucket is created)
    await storage_service_1.storageService.initializeBucket();
    // 2. Start listening
    server = app_1.default.listen(env_1.env.PORT, () => {
        console.log(`🚀 Server successfully started in ${env_1.env.NODE_ENV} mode on port ${env_1.env.PORT}`);
        console.log(`🔗 Health Check Endpoint: http://localhost:${env_1.env.PORT}/health`);
    });
    // Handle unhandled promise rejections inside the running application context
    process.on('unhandledRejection', (err) => {
        console.error('💥 UNHANDLED REJECTION! Shutting down...', err);
        gracefulShutdown();
    });
}
// Graceful shutdown handler
async function gracefulShutdown() {
    console.log('💤 Gracefully shutting down application...');
    if (server) {
        server.close(async () => {
            console.log('🛑 Express HTTP server closed.');
            try {
                await prisma_1.default.$disconnect();
                console.log('🔌 Prisma database client disconnected.');
                process.exit(0);
            }
            catch (err) {
                console.error('❌ Error while disconnecting Prisma:', err);
                process.exit(1);
            }
        });
    }
    else {
        process.exit(0);
    }
}
// System lifecycle listeners
process.on('SIGTERM', () => {
    console.log('📋 SIGTERM received. Starting graceful shutdown.');
    gracefulShutdown();
});
process.on('SIGINT', () => {
    console.log('📋 SIGINT received. Starting graceful shutdown.');
    gracefulShutdown();
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
});
// Start Express server
startServer().catch((err) => {
    console.error('💥 CRITICAL SERVER STARTUP FAILURE:', err);
    process.exit(1);
});
