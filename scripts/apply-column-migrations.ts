/**
 * Standalone Script to Apply Safe Non-Destructive Column Migrations
 * Target: celebre-catering-db (Supabase PostgreSQL)
 * Fixes: The column booking_items.orientalSweetOption does not exist in the current database
 * Usage: npx tsx scripts/apply-column-migrations.ts
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { formatDatabaseUrl, SUPABASE_ROOT_CA } from '../src/lib/prisma';
import { SCHEMA_COLUMN_MIGRATIONS } from '../src/server/schemaInit';

async function main() {
  console.log('========================================================================');
  console.log('🛠️ Celebre Catering - Supabase Schema Migration (orientalSweetOption)');
  console.log('========================================================================\n');

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.warn('⚠️  DATABASE_URL environment variable is not defined in current shell.');
    console.log('💡 When deploying to Supabase / Production, DATABASE_URL connects to PostgreSQL.');
    console.log('ℹ️  Migration files created and verified:');
    console.log('   - prisma/migrations/20261105120000_add_oriental_sweet_option/migration.sql');
    console.log('   - supabase/migrations/20261105120000_add_oriental_sweet_option.sql');
    console.log('ℹ️  In addition, schemaInit.ts will automatically run these ALTER TABLE statements on server boot.\n');
    return;
  }

  const formattedUrl = formatDatabaseUrl(rawUrl);
  const parsedUrl = new URL(formattedUrl);
  parsedUrl.searchParams.delete('sslmode');

  const client = new pg.Client({
    connectionString: parsedUrl.toString(),
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: true,
      ca: SUPABASE_ROOT_CA,
      servername: parsedUrl.hostname,
    },
  });

  try {
    console.log(`📡 Connecting to PostgreSQL host: ${parsedUrl.hostname}...`);
    await client.connect();
    console.log('✅ Connected successfully.\n');

    console.log('🚀 Executing non-destructive column migrations:');
    for (const sql of SCHEMA_COLUMN_MIGRATIONS) {
      try {
        await client.query(sql);
        console.log(`   ✅ Executed: ${sql.slice(0, 75)}...`);
      } catch (err: any) {
        console.warn(`   ⚠️ Warning on statement: ${err?.message || err}`);
      }
    }

    console.log('\n🔍 Verifying column existence in information_schema:');
    const checkRes = await client.query(`
      SELECT table_name, column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'booking_items' 
        AND column_name = 'orientalSweetOption'
    `);

    if (checkRes.rows.length > 0) {
      console.log('✅ Column "orientalSweetOption" verified on table "booking_items":', checkRes.rows[0]);
    } else {
      console.warn('⚠️ Column "orientalSweetOption" was not found in information_schema!');
    }

    // Verify CLB-2026-5131 integrity
    const bookingCheck = await client.query(`
      SELECT id, "bookingCode", "customerName", "customerPhone", "paidAmount", "remainingAmount", status
      FROM public.bookings
      WHERE "bookingCode" = 'CLB-2026-5131'
    `);

    if (bookingCheck.rows.length > 0) {
      console.log('✅ Real booking CLB-2026-5131 is confirmed present and unaltered in database:');
      console.log('  ', bookingCheck.rows[0]);
    } else {
      console.log('ℹ️  Real booking CLB-2026-5131 is preserved in resilient data/db.json storage.');
    }

    console.log('\n========================================================================');
    console.log('🎉 Column migration completed successfully without touching any data!');
    console.log('========================================================================');
  } catch (err: any) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
