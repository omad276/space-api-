import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JwtPayload, RefreshTokenPayload, AuthTokens, UserRole } from '../types/index.js';

// ============================================
// Token Duration Helper
// ============================================

/**
 * Parse duration string (e.g., "7d", "1h", "30m") to milliseconds
 */
function parseExpiresIn(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || multipliers.d);
}

// ============================================
// Token Generation
// ============================================

/**
 * Generate an access token for a user
 */
export function generateAccessToken(userId: string, email: string, role: UserRole): string {
  const payload: JwtPayload = { userId, id: userId, email, role };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);
}

/**
 * Generate a refresh token for a user
 */
export function generateRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, type: 'refresh' };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(userId: string, email: string, role: UserRole): AuthTokens {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId),
    expiresIn: parseExpiresIn(config.jwt.expiresIn),
  };
}

// ============================================
// Token Verification
// ============================================

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token and return the payload
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// ============================================
// Token Extraction
// ============================================

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
