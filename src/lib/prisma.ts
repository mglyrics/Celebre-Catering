import { PrismaClient } from '@prisma/client';
import { logServerError } from '../server/safeLogger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | null = null;
let prismaInitFailed = false;

export function formatDatabaseUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // If connecting to Supabase pooler (port 6543 or hostname has pooler.supabase.com)
    if (url.port === '6543' || url.hostname.includes('pooler.supabase.com')) {
      if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
      }
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '10');
      }
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function getSafeConnectionMetadata(): {
  configured: boolean;
  host?: string;
  port?: string;
  database?: string;
  userPrefix?: string;
  isPoolerPort?: boolean;
  hasPgbouncer?: boolean;
  hasSslmode?: boolean;
  sslmodeValue?: string;
  error?: string;
} {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return { configured: false };
  }
  try {
    const url = new URL(raw);
    const username = url.username || '';
    const maskedUser = username.length > 12 
      ? `${username.slice(0, 10)}...${username.slice(-3)}` 
      : username;

    return {
      configured: true,
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace(/^\//, '') || 'postgres',
      userPrefix: maskedUser || 'unknown',
      isPoolerPort: url.port === '6543',
      hasPgbouncer: url.searchParams.has('pgbouncer'),
      hasSslmode: url.searchParams.has('sslmode'),
      sslmodeValue: url.searchParams.get('sslmode') || 'default',
    };
  } catch {
    return { configured: true, error: 'invalid_url_syntax' };
  }
}

export function getPrismaClient(): PrismaClient | null {
  // Use existing cached singleton if available
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (prismaInstance) {
    return prismaInstance;
  }

  // Do not initialize Prisma if DATABASE_URL is not set
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return null;
  }

  // If previous initialization threw a fatal error, prevent repeated crash loops
  if (prismaInitFailed) {
    return null;
  }

  try {
    const formattedUrl = formatDatabaseUrl(rawUrl);
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: formattedUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }

    return prismaInstance;
  } catch (err: any) {
    prismaInitFailed = true;
    logServerError(err, 'Prisma.Client.Initialization');
    return null;
  }
}

// Resilient proxy: callers can use `prisma.booking...` without causing top-level cold-start crashes.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      if (prop === '$connect') {
        return async () => {
          throw new Error('DATABASE_URL is not configured or Prisma client initialization failed');
        };
      }
      if (prop === '$disconnect') {
        return async () => {};
      }
      throw new Error(`PrismaClient unavailable (DATABASE_URL missing or engine init failed)`);
    }

    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});
