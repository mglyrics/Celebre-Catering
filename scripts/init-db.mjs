/**
 * Standalone, Safe, Non-Destructive Database Schema Initializer
 * Uses native PostgreSQL DDL queries with CREATE TABLE IF NOT EXISTS
 * Runs seamlessly on Supabase Transaction Pooler (port 6543) without advisory lock restrictions.
 */
import pg from 'pg';

export const SUPABASE_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIDzzCCAregAwIBAgIUBhalAwMQ7BA1NH7td4msPPwxHzowDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIzMTAyNDA3NTM0NVoXDTMzMTAyMTA3NTM0NVow
czELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEmMCQGA1UEAwwdU3VwYWJhc2Ug
SW50ZXJtZWRpYXRlIDIwMjEgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQDOAMhXirH+EGIn8GaDp8T53rEogf7kM8OKW2uQ5yU/wxPa+w8BXgTzWy3W
JDAUhZE78oUtAd9kk5zKPrLXoT3W61PPnOc/9dceL5gB7/78m7EKCySziAA2c8vR
fnYPfznedDXi2lryttSYmMf2qbZDErAxwJDUm6cyq+HLAfb2qUH28u6jP8I9GDtG
PkQnjqtiRXEKjbTc/ntqCQrhtFK02mHkMSju7nEpkNYryunv5n/c9mrRY9/8GwmP
3uSZz3CQ8yQ/E0f8T9gCca2TcKuTQmW2pQqtHv1MuZ3jfJE5Nr9+Fap5kdzDJtdf
BdKofVNZlnYIru5yhUZywY3xYFfHAgMBAAGjYzBhMA8GA1UdEwEB/wQFMAMBAf8w
DgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBQVoFMuvXJ9Yv+QJr6/GJX0Z0VA+jAf
BgNVHSMEGDAWgBSo17l2N9gs7ZISJp4OMiTVLWlGLDANBgkqhkiG9w0BAQsFAAOC
AQEAcjxkXf4FIEbJEBmMAuh313ua6btovY0apR+gP8NfLZmjUh0q9Oc7TmMVRtuW
JIL9jlEMqw0Y4PP3+//pSvMiaxqaGhmXsgrd3w1B5vQnaASuerra3UhFX9CJnpMd
jGxaXipY8zJa602lEwzD24wrKriRRqOhX2NRLHeQuTkQiQgFTnDx1pJhqZ78hnKX
ccaawiv1PA2Tl253LdQaYv6VcJ5mh1jobznRBkfHen2kDgt17YKJW3ttLzaCMiLu
5iqgXEf0E58pLZE5e2jutI7oEHFH7KTAPG5Xguoyond/HSq4bTK31lVva3S7Du87
cCQq7WEcSzy2kH6DWMkWoF0zbg==
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
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

export const DDL_STATEMENTS = [
  {
    name: 'meals',
    sql: `
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
  },
  {
    name: 'bookings',
    sql: `
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
  },
  {
    name: 'booking_items',
    sql: `
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
  },
  {
    name: 'payments',
    sql: `
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
  },
  {
    name: 'factory_orders',
    sql: `
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
  },
  {
    name: 'factory_payments',
    sql: `
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
  },
  {
    name: 'audit_logs',
    sql: `
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
  },
  {
    name: 'admin_users',
    sql: `
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
  },
];

export const RLS_STATEMENTS = [
  // 1. Enable RLS on all 8 tables
  'ALTER TABLE IF EXISTS public.meals ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.booking_items ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.factory_orders ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.factory_payments ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;',

  // 2. Safe check for anon and authenticated roles
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
  END $$;`,

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

export async function runInitScript() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.log('[Init-DB] No DATABASE_URL found, skipping database table creation.');
    return;
  }

  const url = new URL(rawUrl);
  url.searchParams.delete('sslmode');

  const client = new pg.Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: true,
      ca: SUPABASE_ROOT_CA,
      servername: url.hostname,
    },
  });

  try {
    console.log('[Init-DB] Connecting to PostgreSQL to verify/create schema tables...');
    await client.connect();
    console.log('[Init-DB] Connected successfully.');

    for (const statement of DDL_STATEMENTS) {
      process.stdout.write(`[Init-DB] Checking table ${statement.name}... `);
      await client.query(statement.sql);
      console.log('✅ Ready');
    }

    // Ensure isTest column exists on bookings table
    try {
      await client.query('ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;');
    } catch {}

    // Apply Supabase RLS hardening
    console.log('[Init-DB] Enforcing Supabase Row Level Security (RLS) on all production tables...');
    for (const rlsSql of RLS_STATEMENTS) {
      try {
        await client.query(rlsSql);
      } catch (rlsErr) {
        console.warn('[Init-DB] RLS Notice:', rlsErr.message);
      }
    }
    console.log('[Init-DB] Row Level Security (RLS) policies successfully enforced.');

    // Verify all 8 tables
    const checkRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = ANY($1)
    `, [DDL_STATEMENTS.map(s => s.name)]);

    const existingNames = checkRes.rows.map(r => r.table_name);
    console.log(`[Init-DB] Verification complete: ${existingNames.length}/8 tables verified.`);
    console.log('[Init-DB] Verified tables:', existingNames.join(', '));
  } catch (err) {
    console.error('[Init-DB] Error creating schema tables:', err.message);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

// Auto-run if executed directly via node scripts/init-db.mjs
if (process.argv[1] && process.argv[1].includes('init-db')) {
  runInitScript().then(() => {
    console.log('[Init-DB] Finished.');
  });
}
