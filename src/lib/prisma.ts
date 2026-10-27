import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { logServerError } from '../server/safeLogger';

export const SUPABASE_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`;

export function getCaCertPath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'data', 'supabase-ca.pem'),
    path.resolve(process.cwd(), 'certs', 'supabase-ca.pem'),
    path.resolve('/tmp', 'supabase-ca.pem'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  const tmpPath = path.resolve('/tmp', 'supabase-ca.pem');
  try {
    fs.writeFileSync(tmpPath, SUPABASE_ROOT_CA, 'utf8');
    return tmpPath;
  } catch {
    return possiblePaths[0];
  }
}

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
        url.searchParams.set('connect_timeout', '15');
      }
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }
      if (!url.searchParams.has('sslrootcert')) {
        const caPath = getCaCertPath();
        url.searchParams.set('sslrootcert', caPath);
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
