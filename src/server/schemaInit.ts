/**
 * Safe, Non-Destructive Schema Initializer for Supabase PostgreSQL
 * Creates missing tables if they do not exist without touching existing data.
 * Dual-engine execution: Uses Prisma and direct pg connection as resilient fallback.
 */
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { logServerError } from './safeLogger';
import { INITIAL_MEALS } from '../data/defaultMeals';
import { formatDatabaseUrl, SUPABASE_ROOT_CA } from '../lib/prisma';

export const REQUIRED_TABLES = [
  'meals',
  'bookings',
  'booking_items',
  'payments',
  'factory_orders',
  'audit_logs',
  'admin_users',
];

export const TABLE_DDL_QUERIES: Record<string, string> = {
  meals: `
    CREATE TABLE IF NOT EXISTS "meals" (
      "id" TEXT PRIMARY KEY,
      "code" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "ingredients" TEXT NOT NULL,
      "distributorPrice" DOUBLE PRECISION NOT NULL,
      "factoryPrice" DOUBLE PRECISION NOT NULL,
      "hasJuice" BOOLEAN NOT NULL DEFAULT true,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "image" TEXT,
      "version" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  bookings: `
    CREATE TABLE IF NOT EXISTS "bookings" (
      "id" TEXT PRIMARY KEY,
      "bookingCode" TEXT UNIQUE NOT NULL,
      "securityCode" TEXT NOT NULL,
      "customerName" TEXT NOT NULL,
      "customerPhone" TEXT NOT NULL,
      "customerWhatsapp" TEXT,
      "preferredContact" TEXT NOT NULL DEFAULT 'whatsapp',
      "eventName" TEXT NOT NULL,
      "eventDate" TEXT NOT NULL,
      "deliveryTime" TEXT NOT NULL,
      "deliveryGovernorate" TEXT NOT NULL,
      "deliveryAddress" TEXT NOT NULL,
      "notes" TEXT,
      "totalMealsCount" INTEGER NOT NULL,
      "totalDistributorPrice" DOUBLE PRECISION NOT NULL,
      "totalFactoryPrice" DOUBLE PRECISION,
      "profitMargin" DOUBLE PRECISION,
      "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "remainingAmount" DOUBLE PRECISION NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'INITIAL',
      "statusNotes" TEXT,
      "isTest" BOOLEAN NOT NULL DEFAULT false,
      "version" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  booking_items: `
    CREATE TABLE IF NOT EXISTS "booking_items" (
      "id" TEXT PRIMARY KEY,
      "bookingId" TEXT NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "mealId" TEXT,
      "mealCode" TEXT NOT NULL,
      "mealName" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "ingredients" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "drinkOption" TEXT NOT NULL DEFAULT 'standard',
      "baseDistributorPrice" DOUBLE PRECISION NOT NULL,
      "unitDistributorPrice" DOUBLE PRECISION NOT NULL,
      "totalDistributorPrice" DOUBLE PRECISION NOT NULL,
      "baseFactoryPrice" DOUBLE PRECISION,
      "unitFactoryPrice" DOUBLE PRECISION,
      "totalFactoryPrice" DOUBLE PRECISION,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  payments: `
    CREATE TABLE IF NOT EXISTS "payments" (
      "id" TEXT PRIMARY KEY,
      "bookingId" TEXT NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "amount" DOUBLE PRECISION NOT NULL,
      "method" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "notes" TEXT,
      "receiptNumber" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  factory_orders: `
    CREATE TABLE IF NOT EXISTS "factory_orders" (
      "id" TEXT PRIMARY KEY,
      "orderNumber" TEXT UNIQUE NOT NULL,
      "bookingId" TEXT NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "bookingCode" TEXT NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "eventDate" TEXT NOT NULL,
      "deliveryTime" TEXT NOT NULL,
      "deliveryLocation" TEXT NOT NULL,
      "itemsJson" TEXT NOT NULL,
      "packagingNotes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  audit_logs: `
    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" TEXT PRIMARY KEY,
      "bookingId" TEXT REFERENCES "bookings"("id") ON DELETE SET NULL,
      "bookingCode" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "performedBy" TEXT NOT NULL,
      "details" TEXT NOT NULL,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  admin_users: `
    CREATE TABLE IF NOT EXISTS "admin_users" (
      "id" TEXT PRIMARY KEY,
      "username" TEXT UNIQUE NOT NULL,
      "email" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'admin',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
};

export async function checkTablesStatus(client: PrismaClient): Promise<{
  allReady: boolean;
  existingTables: string[];
  missingTables: string[];
}> {
  try {
    const rawTables: { table_name: string }[] = await client.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const existing = rawTables.map(t => t.table_name);
    const existingRequired = REQUIRED_TABLES.filter(t => existing.includes(t));
    const missing = REQUIRED_TABLES.filter(t => !existing.includes(t));

    return {
      allReady: missing.length === 0,
      existingTables: existingRequired,
      missingTables: missing,
    };
  } catch (err: any) {
    logServerError(err, 'SchemaInit.CheckTables');
    return {
      allReady: false,
      existingTables: [],
      missingTables: REQUIRED_TABLES,
    };
  }
}

export async function ensureSchemaReady(client: PrismaClient): Promise<{
  success: boolean;
  created: string[];
  tablesFound: string[];
  errors: string[];
}> {
  const status = await checkTablesStatus(client);
  const created: string[] = [];
  const errors: string[] = [];

  if (!status.allReady) {
    // 1. Try Prisma executeRawUnsafe
    for (const tableName of status.missingTables) {
      const ddl = TABLE_DDL_QUERIES[tableName];
      if (ddl) {
        try {
          await client.$executeRawUnsafe(ddl);
          created.push(tableName);
        } catch (err: any) {
          logServerError(err, `SchemaInit.Prisma.${tableName}`);
          errors.push(`Prisma ${tableName}: ${err?.message?.slice(0, 100)}`);
        }
      }
    }

    // 2. Fallback via direct pg client if any table is still missing
    const midCheck = await checkTablesStatus(client);
    if (!midCheck.allReady && process.env.DATABASE_URL) {
      const rawUrl = process.env.DATABASE_URL;
      const formattedUrl = formatDatabaseUrl(rawUrl);
      const pgUrl = new URL(formattedUrl);
      pgUrl.searchParams.delete('sslmode');

      const pgClient = new pg.Client({
        connectionString: pgUrl.toString(),
        connectionTimeoutMillis: 7000,
        ssl: {
          rejectUnauthorized: true,
          ca: SUPABASE_ROOT_CA,
          servername: pgUrl.hostname,
        },
      });

      try {
        await pgClient.connect();
        for (const tableName of midCheck.missingTables) {
          const ddl = TABLE_DDL_QUERIES[tableName];
          if (ddl) {
            try {
              await pgClient.query(ddl);
              if (!created.includes(tableName)) {
                created.push(tableName);
              }
            } catch (pgErr: any) {
              logServerError(pgErr, `SchemaInit.pgClient.${tableName}`);
              errors.push(`pg ${tableName}: ${pgErr?.message?.slice(0, 100)}`);
            }
          }
        }
      } catch (connErr: any) {
        errors.push(`pg connection: ${connErr?.message?.slice(0, 100)}`);
      } finally {
        try {
          await pgClient.end();
        } catch {}
      }
    }
  }

  // Ensure isTest column exists on bookings table
  try {
    await client.$executeRawUnsafe('ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;');
  } catch {}

  // Seed meals if meals table exists and is empty
  try {
    const mealCount = await client.meal.count();
    if (mealCount === 0) {
      for (const m of INITIAL_MEALS) {
        await client.meal.create({
          data: {
            id: `meal-${m.code}`,
            code: m.code,
            name: m.name,
            category: m.category,
            ingredients: m.ingredients,
            distributorPrice: m.distributorPrice,
            factoryPrice: m.factoryPrice ?? 0,
            hasJuice: m.hasJuice ?? true,
            isActive: m.isActive ?? true,
            image: m.image,
          },
        }).catch(() => {});
      }
    } else {
      // Ensure Meal 12 name is updated to 'باتية' in PostgreSQL
      await client.meal.updateMany({
        where: { code: 'Sale-12' },
        data: { name: 'باتية' },
      }).catch(() => {});
    }
  } catch {}

  const postCheck = await checkTablesStatus(client);
  return {
    success: postCheck.allReady,
    created,
    tablesFound: postCheck.existingTables,
    errors,
  };
}
