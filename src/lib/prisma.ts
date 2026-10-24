import { PrismaClient } from '@prisma/client';
import { logServerError } from '../server/safeLogger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | null = null;
let prismaInitFailed = false;

export function getPrismaClient(): PrismaClient | null {
  // Use existing cached singleton if available
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (prismaInstance) {
    return prismaInstance;
  }

  // Do not initialize Prisma if DATABASE_URL is not set
  if (!process.env.DATABASE_URL) {
    return null;
  }

  // If previous initialization threw a fatal error, prevent repeated crash loops
  if (prismaInitFailed) {
    return null;
  }

  try {
    prismaInstance = new PrismaClient({
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
