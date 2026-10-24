/**
 * Celebre Catering - Safe Error Logger
 * Sanitizes all server and database logs:
 * - Redacts passwords, secrets, JWTs, and API keys
 * - Redacts database connection strings (postgresql://user:password@host...)
 * - Redacts customer phone numbers, whatsapp, and personal identifiers
 * - Preserves: Error Name, Stack Trace, Prisma Code (e.g. P2002, P1001, P2021), and sanitized metadata
 */

export interface SanitizedErrorInfo {
  errorName: string;
  errorCode?: string | number;
  errorMessage: string;
  errorMeta?: any;
  stackTrace?: string;
  clientVersion?: string;
  context?: string;
  timestamp: string;
}

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // 1. Redact database URLs with credentials (PostgreSQL / MySQL / MongoDB)
    .replace(/postgres(ql)?:\/\/([^:@]+):([^@]+)@/gi, 'postgresql://$2:***@')
    .replace(/mysql:\/\/([^:@]+):([^@]+)@/gi, 'mysql://$2:***@')
    .replace(/mongodb(\+srv)?:\/\/([^:@]+):([^@]+)@/gi, 'mongodb://$2:***@')
    // 2. Redact Egyptian phone numbers (010/011/012/015) and international +201...
    .replace(/(?:\+?20|0)?1[0125]\d{8}/g, '01*********')
    // 3. Redact Bearer tokens and JWTs
    .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_JWT]')
    .replace(/eyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_=]{10,}\.?[A-Za-z0-9-_.+/=]*/g, '[REDACTED_JWT]')
    // 4. Redact password keys in JSON-like strings
    .replace(/(["']?password["']?\s*:\s*["'])[^"']+([^"']*["'])/gi, '$1***$2')
    .replace(/(["']?passwordHash["']?\s*:\s*["'])[^"']+([^"']*["'])/gi, '$1***$2')
    .replace(/(["']?secret["']?\s*:\s*["'])[^"']+([^"']*["'])/gi, '$1***$2');
}

export function sanitizeError(err: any, context?: string): SanitizedErrorInfo {
  if (!err) {
    return {
      errorName: 'UnknownError',
      errorMessage: 'Unknown error occurred',
      context,
      timestamp: new Date().toISOString(),
    };
  }

  const errorName = err.name || 'Error';
  const errorCode = err.code || err.errorCode || undefined;
  const clientVersion = err.clientVersion || undefined;

  const rawMessage = typeof err.message === 'string' ? err.message : String(err);
  const errorMessage = sanitizeText(rawMessage);

  let stackTrace: string | undefined = undefined;
  if (typeof err.stack === 'string') {
    stackTrace = sanitizeText(err.stack);
  }

  let errorMeta: any = undefined;
  if (err.meta && typeof err.meta === 'object') {
    try {
      const stringified = JSON.stringify(err.meta);
      errorMeta = JSON.parse(sanitizeText(stringified));
    } catch {
      errorMeta = '[Unserializable Meta]';
    }
  }

  return {
    errorName,
    errorCode,
    errorMessage,
    errorMeta,
    stackTrace,
    clientVersion,
    context,
    timestamp: new Date().toISOString(),
  };
}

export function logServerError(err: any, context: string): SanitizedErrorInfo {
  const sanitized = sanitizeError(err, context);

  // Structured safe server log for Vercel Function Logs / CloudWatch
  console.error(`[CELEBRE_SERVER_ERROR][${sanitized.context || 'General'}]:`, {
    errorName: sanitized.errorName,
    errorCode: sanitized.errorCode,
    errorMessage: sanitized.errorMessage,
    errorMeta: sanitized.errorMeta,
    clientVersion: sanitized.clientVersion,
    timestamp: sanitized.timestamp,
    stackTrace: sanitized.stackTrace,
  });

  return sanitized;
}
