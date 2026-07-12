import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import router from './routes';
import { errorHandler, AppError } from './middleware/error.middleware';

const app = express();

// Secure Express headers with Helmet
app.use(helmet());

// Configure CORS policy
app.use(
  cors({
    origin: env.ALLOWED_ORIGIN === '*' ? true : env.ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  })
);

// HTTP request logging middleware
const logFormat = env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(morgan(logFormat));

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/', router);

// Catch 404 and forward to error handler
app.use((req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// Register global error handler
app.use(errorHandler);

export default app;
