import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'ayushXsisi_production_secret_key_2026_secure';
const TOKEN_EXPIRY = '7d';

// In-Memory Sliding Window Rate Limiter
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitBucket>();

export function rateLimiter(maxRequests: number, windowMs: number, keyPrefix = 'rl') {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const bucket = rateLimits.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= maxRequests) {
      const retrySecs = Math.ceil((bucket.resetAt - now) / 1000);
      db.logSecurity('order_blocked', `Rate limit exceeded for IP: ${ip} on ${req.originalUrl}`, ip);
      return res.status(429).json({
        success: false,
        error: `Too many requests. Please try again in ${retrySecs} seconds.`
      });
    }

    bucket.count += 1;
    next();
  };
}

// Clean up stale rate limits every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimits.entries()) {
    if (now > bucket.resetAt) {
      rateLimits.delete(key);
    }
  }
}, 10 * 60 * 1000);

// JWT Token Operations
export interface TokenPayload {
  adminId: string;
  username: string;
  role: string;
}

export function generateAdminToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyAdminToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Admin Auth Middleware
export interface AuthenticatedRequest extends Request {
  admin?: TokenPayload;
}

export function adminAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No valid authorization token found.'
    });
  }

  const token = authHeader.split(' ')[1];
  const verified = verifyAdminToken(token);
  if (!verified) {
    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid token. Please log in again.'
    });
  }

  const adminUser = db.getAdminById(verified.adminId);
  if (!adminUser) {
    return res.status(401).json({
      success: false,
      error: 'Admin user no longer exists.'
    });
  }

  req.admin = verified;
  next();
}

// Lightweight Math Anti-Spam Challenge
interface CaptchaStoreItem {
  answer: number;
  expiresAt: number;
}
const captchaMap = new Map<string, CaptchaStoreItem>();

export function generateCaptchaChallenge() {
  const num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const num2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
  const answer = num1 + num2;
  const token = crypto.randomBytes(16).toString('hex');

  captchaMap.set(token, {
    answer,
    expiresAt: Date.now() + 10 * 60 * 1000 // valid for 10 minutes
  });

  return {
    question: `What is ${num1} + ${num2}?`,
    token
  };
}

export function verifyCaptchaAnswer(token: string, answer: number): boolean {
  if (!token || typeof answer !== 'number') return false;
  const stored = captchaMap.get(token);
  if (!stored) return false;

  const isValid = stored.answer === answer && Date.now() <= stored.expiresAt;
  captchaMap.delete(token); // one-time use
  return isValid;
}

// Input validation helpers
export function validateTransactionId(txnId: string): boolean {
  if (!txnId) return false;
  const clean = txnId.trim();
  // Most Indian UPI UTR / Txn IDs are 10-22 alphanumeric characters
  return clean.length >= 6 && clean.length <= 40 && /^[A-Za-z0-9\-_#]+$/.test(clean);
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // remove direct script tags
    .trim();
}
