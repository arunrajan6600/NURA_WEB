import app from './app';
import { env } from './config/env';
import { storageService } from './services/storage.service';
import prisma from './config/prisma';

let server: any;

async function startServer() {
  // 1. Run startup checks (e.g. ensure Supabase storage bucket is created)
  await storageService.initializeBucket();

  // 2. Start listening
  server = app.listen(env.PORT, () => {
    console.log(`🚀 Server successfully started in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`🔗 Health Check Endpoint: http://localhost:${env.PORT}/health`);
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
        await prisma.$disconnect();
        console.log('🔌 Prisma database client disconnected.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error while disconnecting Prisma:', err);
        process.exit(1);
      }
    });
  } else {
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
