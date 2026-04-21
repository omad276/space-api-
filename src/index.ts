import fs from 'fs';
import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { initSocket } from './socket.js';

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

    // Create HTTP server and initialize Socket.IO
    const server = http.createServer(app);
    initSocket(server);

    // Start server
    server.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🏠  SPACE PLATFORM API                                 ║
║                                                          ║
║   Status:      Running                                   ║
║   Port:        ${String(config.port).padEnd(42)}║
║   Environment: ${config.nodeEnv.padEnd(42)}║
║   WebSocket:   Enabled                                   ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   ENDPOINTS                                              ║
║                                                          ║
║   Auth:                                                  ║
║   ├─ POST   /api/auth/register                           ║
║   ├─ POST   /api/auth/login                              ║
║   ├─ GET    /api/auth/verify-email                       ║
║   ├─ POST   /api/auth/forgot-password                    ║
║   ├─ POST   /api/auth/reset-password                     ║
║   ├─ GET    /api/auth/me                                 ║
║   └─ ...more                                             ║
║                                                          ║
║   Properties & Spaces:                                   ║
║   ├─ GET    /api/properties                              ║
║   ├─ POST   /api/properties                              ║
║   └─ ...more                                             ║
║                                                          ║
║   WebSocket Events:                                      ║
║   ├─ notification (user events)                          ║
║   └─ property_update (real-time)                         ║
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
