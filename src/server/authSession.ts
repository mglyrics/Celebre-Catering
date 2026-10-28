/**
 * Secure Server-Side Session Manager for CÉLÈBRE Catering Admin Platform
 * Enforces 15-minute inactivity timeout, HttpOnly cookies, and server-side revocation.
 */
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AdminUser } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'celebre-catering-jwt-super-secret-key-2026';
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity

export interface AdminSession {
  sessionId: string;
  userId: string;
  username: string;
  role: 'super_admin' | 'admin' | 'factory';
  name: string;
  createdAt: number;
  lastActivityAt: number;
}

// In-memory server-authoritative session registry (fast, non-blocking, zero-latency)
const activeSessions = new Map<string, AdminSession>();

// Cleanup stale sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sid, session] of activeSessions.entries()) {
    if (now - session.lastActivityAt > INACTIVITY_TIMEOUT_MS * 2) {
      activeSessions.delete(sid);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates an active server-side session and sets HttpOnly cookie
 */
export function createAdminSession(user: AdminUser, res?: Response): { token: string; sessionId: string; session: AdminSession } {
  const sessionId = crypto.randomUUID();
  const now = Date.now();

  const session: AdminSession = {
    sessionId,
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    createdAt: now,
    lastActivityAt: now,
  };

  activeSessions.set(sessionId, session);

  const token = jwt.sign(
    {
      id: user.id,
      sessionId,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '2h' } // Hard expiration cap (while inactivity enforces 15 mins)
  );

  if (res && typeof res.cookie === 'function') {
    res.cookie('celebre_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: INACTIVITY_TIMEOUT_MS,
      path: '/',
    });
  }

  return { token, sessionId, session };
}

/**
 * Validates session, enforces 15-minute inactivity timeout, and updates activity timestamp
 */
export function validateAdminSession(req: Request, res?: Response): {
  valid: boolean;
  user?: AdminUser;
  session?: AdminSession;
  error?: string;
  code?: 'UNAUTHORIZED' | 'SESSION_REVOKED' | 'SESSION_INACTIVITY_TIMEOUT' | 'INVALID_TOKEN';
} {
  // Extract token from Bearer Authorization header OR from secure cookie
  let token: string | undefined = undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.celebre_admin_session) {
    token = req.cookies.celebre_admin_session;
  }

  if (!token) {
    return {
      valid: false,
      error: 'غير مصرح: يلزم تسجيل الدخول للوصول إلى لوحة الإدارة',
      code: 'UNAUTHORIZED',
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const sessionId = decoded.sessionId;

    if (!sessionId) {
      return {
        valid: false,
        error: 'جلسة قديمة أو غير صالحة، يرجى تسجيل الدخول مجدداً',
        code: 'INVALID_TOKEN',
      };
    }

    const session = activeSessions.get(sessionId);

    // Check if session was revoked on server
    if (!session) {
      if (res && typeof res.clearCookie === 'function') {
        res.clearCookie('celebre_admin_session', { path: '/' });
      }
      return {
        valid: false,
        error: 'جلسة الدخول ملغاة أو منتهية، يرجى تسجيل الدخول مجدداً',
        code: 'SESSION_REVOKED',
      };
    }

    // Check server-enforced 15-minute inactivity timeout
    const now = Date.now();
    if (now - session.lastActivityAt > INACTIVITY_TIMEOUT_MS) {
      activeSessions.delete(sessionId);
      if (res && typeof res.clearCookie === 'function') {
        res.clearCookie('celebre_admin_session', { path: '/' });
      }
      return {
        valid: false,
        error: 'انتهت الجلسة بسبب عدم النشاط (15 دقيقة)',
        code: 'SESSION_INACTIVITY_TIMEOUT',
      };
    }

    // Refresh activity timestamp upon every authenticated admin request
    session.lastActivityAt = now;

    // Refresh cookie expiration
    if (res && typeof res.cookie === 'function') {
      res.cookie('celebre_admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: INACTIVITY_TIMEOUT_MS,
        path: '/',
      });
    }

    const user: AdminUser = {
      id: session.userId,
      username: session.username,
      email: decoded.email || `${session.username}@celebre-eg.com`,
      role: session.role,
      name: session.name,
    };

    return {
      valid: true,
      user,
      session,
    };
  } catch (err: any) {
    if (res && typeof res.clearCookie === 'function') {
      res.clearCookie('celebre_admin_session', { path: '/' });
    }
    return {
      valid: false,
      error: 'جلسة الدخول منتهية أو غير صالحة',
      code: 'INVALID_TOKEN',
    };
  }
}

/**
 * Revokes a single session (Logout)
 */
export function revokeAdminSession(sessionId: string, res?: Response) {
  activeSessions.delete(sessionId);
  if (res && typeof res.clearCookie === 'function') {
    res.clearCookie('celebre_admin_session', { path: '/' });
  }
}

/**
 * Revokes all active sessions for a user (after password change)
 */
export function revokeAllUserSessions(userId: string, res?: Response) {
  for (const [sid, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      activeSessions.delete(sid);
    }
  }
  if (res && typeof res.clearCookie === 'function') {
    res.clearCookie('celebre_admin_session', { path: '/' });
  }
}
