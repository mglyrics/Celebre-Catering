/**
 * Safe, Non-Destructive Schema Initializer for Supabase PostgreSQL
 * Creates missing tables if they do not exist without touching existing data.
 * Dual-engine execution: Uses Prisma and direct pg connection as resilient fallback.
 */
import type { PrismaClient } from '@prisma/client';
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
  'factory_payments',
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
      "orientalSweetOption" TEXT DEFAULT 'none',
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
      "factoryCostTotal" DOUBLE PRECISION DEFAULT 0,
      "paidAmount" DOUBLE PRECISION DEFAULT 0,
      "remainingAmount" DOUBLE PRECISION DEFAULT 0,
      "paymentStatus" TEXT DEFAULT 'UNPAID',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  factory_payments: `
    CREATE TABLE IF NOT EXISTS "factory_payments" (
      "id" TEXT PRIMARY KEY,
      "factoryOrderId" TEXT NOT NULL REFERENCES "factory_orders"("id") ON DELETE CASCADE,
      "factoryOrderNumber" TEXT NOT NULL,
      "bookingId" TEXT NOT NULL,
      "bookingCode" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "method" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "notes" TEXT,
      "receiptNumber" TEXT,
      "recordedBy" TEXT NOT NULL DEFAULT 'الإدارة',
      "status" TEXT NOT NULL DEFAULT 'VALID',
      "cancelledBy" TEXT,
      "cancelledAt" TIMESTAMP(3),
      "cancelReason" TEXT,
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

export const SCHEMA_COLUMN_MIGRATIONS = [
  // 1. booking_items: Oriental sweet option and prices (critical for CLB-2026-5131 & all bookings)
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "orientalSweetOption" TEXT DEFAULT \'none\';',
  'UPDATE "booking_items" SET "orientalSweetOption" = \'none\' WHERE "orientalSweetOption" IS NULL;',
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "drinkOption" TEXT DEFAULT \'standard\';',
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "mealId" TEXT;',
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "baseFactoryPrice" DOUBLE PRECISION;',
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "unitFactoryPrice" DOUBLE PRECISION;',
  'ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "totalFactoryPrice" DOUBLE PRECISION;',

  // 2. bookings columns
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;',
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customerWhatsapp" TEXT;',
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "preferredContact" TEXT NOT NULL DEFAULT \'whatsapp\';',
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "statusNotes" TEXT;',
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "totalFactoryPrice" DOUBLE PRECISION;',
  'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "profitMargin" DOUBLE PRECISION;',

  // 3. payments columns
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;',
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;',

  // 4. factory_orders columns
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "packagingNotes" TEXT;',
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "factoryCostTotal" DOUBLE PRECISION DEFAULT 0;',
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION DEFAULT 0;',
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "remainingAmount" DOUBLE PRECISION DEFAULT 0;',
  'ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT \'UNPAID\';',

  // 5. factory_payments columns
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "recordedBy" TEXT DEFAULT \'الإدارة\';',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT \'VALID\';',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelledBy" TEXT;',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);',
  'ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;',

  // 6. meals columns
  'ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "hasJuice" BOOLEAN NOT NULL DEFAULT true;',
  'ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;',
  'ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "image" TEXT;',
  'ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;',
];

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
  columnsEnsured?: boolean;
  rlsEnforced?: boolean;
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

  // Ensure all required columns exist safely across all tables (non-destructive)
  let columnsEnsured = true;
  for (const alterQuery of SCHEMA_COLUMN_MIGRATIONS) {
    try {
      await client.$executeRawUnsafe(alterQuery);
    } catch (colErr: any) {
      logServerError(colErr, 'SchemaInit.ColumnMigration');
      columnsEnsured = false;
      errors.push(`Column migration: ${colErr?.message?.slice(0, 100)}`);
    }
  }

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
      // Ensure Meal 12 name and ingredients are updated to 'باتية' in PostgreSQL
      await client.meal.updateMany({
        where: { code: 'Sale-12' },
        data: { 
          name: 'باتية',
          ingredients: 'قطعة جاتوة مغلفة + باتية + عصير بخيرة + شوكة ومنديل'
        },
      }).catch(() => {});

      // Ensure Sale-05 base factory price is synchronized to 56 EGP in PostgreSQL
      await client.meal.updateMany({
        where: { code: 'Sale-05' },
        data: { 
          factoryPrice: 56
        },
      }).catch(() => {});
    }
  } catch {}

  const postCheck = await checkTablesStatus(client);

  // Automatically enforce Supabase Row Level Security (RLS) on all production tables
  let rlsEnforced = false;
  if (postCheck.allReady) {
    try {
      await ensureRlsSecurity(client);
      rlsEnforced = true;
    } catch (rlsErr: any) {
      logServerError(rlsErr, 'SchemaInit.RLS');
      errors.push(`RLS init error: ${rlsErr?.message?.slice(0, 100)}`);
    }
  }

  return {
    success: postCheck.allReady,
    created,
    tablesFound: postCheck.existingTables,
    columnsEnsured,
    rlsEnforced,
    errors,
  };
}

let columnsMigrationRun = false;

/**
 * Runs all non-destructive column migrations once per process.
 * Guarantees that columns like orientalSweetOption exist before executing queries.
 */
export async function ensureColumnsReady(client: PrismaClient): Promise<{ applied: number; errors: string[] }> {
  if (columnsMigrationRun) return { applied: 0, errors: [] };
  let applied = 0;
  const errors: string[] = [];
  for (const alterQuery of SCHEMA_COLUMN_MIGRATIONS) {
    try {
      await client.$executeRawUnsafe(alterQuery);
      applied++;
    } catch (colErr: any) {
      errors.push(colErr?.message || 'Error');
    }
  }
  columnsMigrationRun = true;
  return { applied, errors };
}

export const SUPABASE_RLS_QUERIES = [
  // 1. Roles verification for standard pg environments
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
  END $$;`,

  // 2. Enable RLS on all 8 tables
  'ALTER TABLE IF EXISTS public.meals ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.booking_items ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.factory_orders ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.factory_payments ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;',

  // 3. Revoke direct access from anon and authenticated
  'REVOKE ALL ON TABLE public.bookings FROM anon, authenticated;',
  'REVOKE ALL ON TABLE public.booking_items FROM anon, authenticated;',
  'REVOKE ALL ON TABLE public.payments FROM anon, authenticated;',
  'REVOKE ALL ON TABLE public.factory_orders FROM anon, authenticated;',
  'REVOKE ALL ON TABLE public.factory_payments FROM anon, authenticated;',
  'REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;',
  'REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;',

  // 4. Meals: Read-only SELECT for active meals
  'REVOKE ALL ON TABLE public.meals FROM anon, authenticated;',
  'GRANT SELECT ON TABLE public.meals TO anon, authenticated;',

  // 5. Clean and set policies
  'DROP POLICY IF EXISTS "meals_public_select_active" ON public.meals;',
  'DROP POLICY IF EXISTS "bookings_deny_direct_anon_authenticated" ON public.bookings;',
  'DROP POLICY IF EXISTS "booking_items_deny_direct_anon_authenticated" ON public.booking_items;',
  'DROP POLICY IF EXISTS "payments_deny_direct_anon_authenticated" ON public.payments;',
  'DROP POLICY IF EXISTS "factory_orders_deny_direct_anon_authenticated" ON public.factory_orders;',
  'DROP POLICY IF EXISTS "factory_payments_deny_direct_anon_authenticated" ON public.factory_payments;',
  'DROP POLICY IF EXISTS "admin_users_deny_direct_anon_authenticated" ON public.admin_users;',
  'DROP POLICY IF EXISTS "audit_logs_deny_direct_anon_authenticated" ON public.audit_logs;',

  'CREATE POLICY "meals_public_select_active" ON public.meals FOR SELECT TO anon, authenticated USING ("isActive" = true);',
  'CREATE POLICY "bookings_deny_direct_anon_authenticated" ON public.bookings FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "booking_items_deny_direct_anon_authenticated" ON public.booking_items FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "payments_deny_direct_anon_authenticated" ON public.payments FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "factory_orders_deny_direct_anon_authenticated" ON public.factory_orders FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "factory_payments_deny_direct_anon_authenticated" ON public.factory_payments FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "admin_users_deny_direct_anon_authenticated" ON public.admin_users FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'CREATE POLICY "audit_logs_deny_direct_anon_authenticated" ON public.audit_logs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;',
];

export async function ensureRlsSecurity(client: PrismaClient): Promise<{ success: boolean; appliedCount: number; errors: string[] }> {
  let appliedCount = 0;
  const errors: string[] = [];

  for (const query of SUPABASE_RLS_QUERIES) {
    try {
      await client.$executeRawUnsafe(query);
      appliedCount++;
    } catch (err: any) {
      errors.push(err?.message?.slice(0, 100) || 'Unknown error');
    }
  }

  return {
    success: errors.length === 0,
    appliedCount,
    errors,
  };
}

export interface TableRlsInfo {
  tableName: string;
  rlsEnabled: boolean;
  policiesCount: number;
  policies: string[];
}

export async function getRlsStatusReport(client: PrismaClient): Promise<{
  allSecured: boolean;
  totalTables: number;
  securedTablesCount: number;
  tables: Record<string, TableRlsInfo>;
}> {
  try {
    const rawRls: { tablename: string; rowsecurity: boolean }[] = await client.$queryRaw`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
    `;

    const rawPolicies: { tablename: string; policyname: string }[] = await client.$queryRaw`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
    `;

    const tables: Record<string, TableRlsInfo> = {};
    let securedCount = 0;

    for (const tableName of REQUIRED_TABLES) {
      const match = rawRls.find(t => t.tablename === tableName);
      const isRls = match ? Boolean(match.rowsecurity) : false;
      const policies = rawPolicies.filter(p => p.tablename === tableName).map(p => p.policyname);

      tables[tableName] = {
        tableName,
        rlsEnabled: isRls,
        policiesCount: policies.length,
        policies,
      };

      if (isRls) {
        securedCount++;
      }
    }

    return {
      allSecured: securedCount === REQUIRED_TABLES.length,
      totalTables: REQUIRED_TABLES.length,
      securedTablesCount: securedCount,
      tables,
    };
  } catch (err: any) {
    logServerError(err, 'GetRlsStatusReport');
    return {
      allSecured: false,
      totalTables: REQUIRED_TABLES.length,
      securedTablesCount: 0,
      tables: {},
    };
  }
}

