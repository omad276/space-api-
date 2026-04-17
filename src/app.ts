import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors'; // Handle async errors automatically

import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import { apiLimiter } from './middleware/rateLimit.js';

// ============================================
// Create Express Application
// ============================================

const app = express();

// Trust proxy for Render deployment (needed for rate limiting and secure cookies)
app.set('trust proxy', 1);

// ============================================
// Security Middleware
// ============================================

// Enable CORS - must be before helmet
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // In development, allow all localhost origins
      if (config.isDevelopment && origin.includes('localhost')) {
        return callback(null, true);
      }

      // In production, allow configured origins or Vercel preview URLs
      const allowedOrigins = config.cors.origins;
      if (allowedOrigins.some((allowed) => origin === allowed || origin.includes('vercel.app'))) {
        return callback(null, true);
      }

      // Log rejected origin for debugging
      console.log(`CORS rejected origin: ${origin}, allowed: ${allowedOrigins.join(', ')}`);

      // Return false instead of error to avoid 500
      callback(null, false);
    },
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Set security HTTP headers (after CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ============================================
// Request Parsing
// ============================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Logging
// ============================================

// HTTP request logging
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// Static Files
// ============================================

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ============================================
// Rate Limiting
// ============================================

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// ============================================
// API Routes
// ============================================

// Mount all routes under /api
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
  });
});

// ============================================
// Error Handling
// ============================================

// Handle 404 - Route not found
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
