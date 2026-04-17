import fs from 'fs';
import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';

// ============================================
// Ensure Upload Directories Exist
// ============================================

fs.mkdirSync('uploads/maps', { recursive: true });
fs.mkdirSync('uploads/properties', { recursive: true });

// ============================================
// Server Startup
// ============================================

async function startServer(): Promise<void> {
  try {
    // Try to connect to MongoDB (optional for now)
    try {
      await connectDatabase();
    } catch {
      console.warn('⚠️  MongoDB not available - running without database');
    }

    // Start Express server
    app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🏠  UPGREAT API SERVER                                 ║
║                                                          ║
║   Status:      Running                                   ║
║   Port:        ${String(config.port).padEnd(42)}║
║   Environment: ${config.nodeEnv.padEnd(42)}║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   ENDPOINTS                                              ║
║                                                          ║
║   Auth:                                                  ║
║   ├─ POST   /api/auth/register                           ║
║   ├─ POST   /api/auth/login                              ║
║   ├─ POST   /api/auth/refresh                            ║
║   ├─ POST   /api/auth/logout                             ║
║   ├─ GET    /api/auth/me                                 ║
║   ├─ PATCH  /api/auth/me                                 ║
║   ├─ POST   /api/auth/change-password                    ║
║   └─ DELETE /api/auth/me                                 ║
║                                                          ║
║   Properties:                                            ║
║   ├─ GET    /api/properties                              ║
║   ├─ GET    /api/properties/featured                     ║
║   ├─ GET    /api/properties/stats                        ║
║   ├─ GET    /api/properties/my                           ║
║   ├─ GET    /api/properties/:id                          ║
║   ├─ POST   /api/properties                              ║
║   ├─ PATCH  /api/properties/:id                          ║
║   └─ DELETE /api/properties/:id                          ║
║                                                          ║
║   Favorites:                                             ║
║   ├─ GET    /api/favorites                               ║
║   ├─ POST   /api/favorites                               ║
║   ├─ DELETE /api/favorites/:propertyId                   ║
║   ├─ PATCH  /api/favorites/:propertyId/notes             ║
║   ├─ PATCH  /api/favorites/:propertyId/collection        ║
║   ├─ GET    /api/favorites/check/:propertyId             ║
║   ├─ POST   /api/favorites/collections                   ║
║   ├─ PATCH  /api/favorites/collections/:id               ║
║   ├─ DELETE /api/favorites/collections/:id               ║
║   └─ GET    /api/favorites/shared/:shareLink             ║
║                                                          ║
║   Maps & Measurements:                                   ║
║   ├─ POST   /api/projects/:id/maps (upload)              ║
║   ├─ GET    /api/maps/:id                                ║
║   ├─ POST   /api/maps/:id/measurements                   ║
║   └─ GET    /api/maps/:id/measurements                   ║
║                                                          ║
║   Health: GET /api/health                                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================
// Graceful Shutdown
// ============================================

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
