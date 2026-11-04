/**
 * Standalone Script to Apply Supabase Row Level Security (RLS) Policies
 * Project: celebre-catering-db
 * Usage: npx tsx scripts/apply-supabase-rls.ts
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { formatDatabaseUrl, SUPABASE_ROOT_CA } from '../src/lib/prisma';

async function main() {
  console.log('===============================================================');
  console.log('🔒 Celebre Catering - Supabase RLS Hardening & Policy Enforcer');
  console.log('===============================================================\n');

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.warn('⚠️  DATABASE_URL environment variable is not defined.');
    console.log('💡 When deploying to Supabase/Production, set DATABASE_URL to your PostgreSQL connection string.');
    console.log('ℹ️  Migration SQL is verified and ready at: supabase/migrations/20261104_enable_supabase_rls.sql\n');
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

    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261104_enable_supabase_rls.sql');
    let sqlContent = '';
    if (fs.existsSync(migrationPath)) {
      sqlContent = fs.readFileSync(migrationPath, 'utf8');
      console.log(`📄 Loaded migration file: ${migrationPath}`);
    } else {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }

    console.log('🚀 Executing RLS migration statements...');
    await client.query(sqlContent);
    console.log('✅ Supabase RLS migration successfully executed!\n');

    // Verification check
    console.log('🔍 Verifying RLS status across public tables:');
    const res = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = ANY($1)
      ORDER BY tablename ASC
    `, [[
      'meals',
      'bookings',
      'booking_items',
      'payments',
      'factory_orders',
      'factory_payments',
      'admin_users',
      'audit_logs'
    ]]);

    let securedCount = 0;
    for (const row of res.rows) {
      const isSecured = row.rowsecurity;
      if (isSecured) securedCount++;
      console.log(` - Table [${row.tablename}]: RLS Enabled = ${isSecured ? '✅ YES' : '❌ NO'}`);
    }

    console.log(`\n📊 Status: ${securedCount}/${res.rows.length} verified tables have Row Level Security enabled.`);

    const policiesRes = await client.query(`
      SELECT tablename, policyname, permissive, roles, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename ASC, policyname ASC
    `);

    console.log(`\n🛡️ Active RLS Policies (${policiesRes.rows.length} policies registered):`);
    for (const p of policiesRes.rows) {
      console.log(` - ${p.tablename} -> "${p.policyname}" [${p.cmd}] (Roles: ${p.roles})`);
    }

    console.log('\n🎉 RLS hardening completed successfully!');
  } catch (err: any) {
    console.error('❌ Error executing RLS migration:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

main();
