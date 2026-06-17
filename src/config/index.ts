import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Default values for development
const defaults = {
  MONGODB_URI: 'mongodb://localhost:27017/upgreat',
  JWT_SECRET: 'dev-jwt-secret-change-in-production',
  JWT_REFRESH_SECRET: 'dev-refresh-secret-change-in-production',
};

// Production MongoDB Atlas URI (fallback if MONGODB_URI env var not set)
const PRODUCTION_MONGODB_URI =
  'mongodb+srv://esmailabdelrazig_db_user:KNz2Q7OgrIdTg2m6@cluster0.eqomo3a.mongodb.net/upgreat?retryWrites=true&w=majority&appName=Cluster0';

// Production CORS origins
const PRODUCTION_CORS_ORIGINS = [
  'https://upgreat-frontend.vercel.app',
  'https://upgreat-frontend-omad276s-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
];

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // MongoDB configuration - use production Atlas URI in production
  mongoUri:
    process.env.MONGODB_URI ||
    (process.env.NODE_ENV === 'production' ? PRODUCTION_MONGODB_URI : defaults.MONGODB_URI),
  mongodb: {
    uri:
      process.env.MONGODB_URI ||
      (process.env.NODE_ENV === 'production' ? PRODUCTION_MONGODB_URI : defaults.MONGODB_URI),
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || defaults.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || defaults.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS configuration - use production origins in production
  cors: {
    origins:
      process.env.CORS_ORIGINS?.split(',') ||
      (process.env.NODE_ENV === 'production'
        ? PRODUCTION_CORS_ORIGINS
        : [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:3000',
          ]),
    credentials: true,
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Bcrypt configuration
  bcrypt: {
    saltRounds: 12,
  },
} as const;

export default config;
