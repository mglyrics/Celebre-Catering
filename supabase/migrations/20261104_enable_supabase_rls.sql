-- =============================================================================
-- CELEBRE CATERING - SUPABASE ROW LEVEL SECURITY (RLS) MIGRATION
-- Project: celebre-catering-db
-- Target: Hardening public schema tables against unauthorized direct access
-- =============================================================================

-- 0. ENSURE ROLES EXIST (Supports both Supabase and standard PostgreSQL environments)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL 8 PRODUCTION TABLES
ALTER TABLE IF EXISTS public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.factory_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.factory_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- If Prisma migrations tracking table exists, enable RLS on it as well
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '_prisma_migrations') THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. REVOKE DIRECT TABLE-LEVEL PERMISSIONS FROM anon AND authenticated ROLES
-- Visitors and clients must NEVER access sensitive tables directly via PostgREST / Supabase API
REVOKE ALL ON TABLE public.bookings FROM anon, authenticated;
REVOKE ALL ON TABLE public.booking_items FROM anon, authenticated;
REVOKE ALL ON TABLE public.payments FROM anon, authenticated;
REVOKE ALL ON TABLE public.factory_orders FROM anon, authenticated;
REVOKE ALL ON TABLE public.factory_payments FROM anon, authenticated;
REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;

-- For meals: Allow ONLY SELECT to anon and authenticated for public menu viewing
REVOKE ALL ON TABLE public.meals FROM anon, authenticated;
GRANT SELECT ON TABLE public.meals TO anon, authenticated;

-- If _prisma_migrations exists, revoke all from anon and authenticated
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '_prisma_migrations') THEN
    EXECUTE 'REVOKE ALL ON TABLE public._prisma_migrations FROM anon, authenticated;';
  END IF;
END $$;

-- 3. DROP ANY INSECURE / LEGACY POLICIES
DROP POLICY IF EXISTS "allow_all" ON public.bookings;
DROP POLICY IF EXISTS "allow_anon" ON public.bookings;
DROP POLICY IF EXISTS "public_read_bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_deny_direct_anon_authenticated" ON public.bookings;
DROP POLICY IF EXISTS "booking_items_deny_direct_anon_authenticated" ON public.booking_items;
DROP POLICY IF EXISTS "payments_deny_direct_anon_authenticated" ON public.payments;
DROP POLICY IF EXISTS "factory_orders_deny_direct_anon_authenticated" ON public.factory_orders;
DROP POLICY IF EXISTS "factory_payments_deny_direct_anon_authenticated" ON public.factory_payments;
DROP POLICY IF EXISTS "admin_users_deny_direct_anon_authenticated" ON public.admin_users;
DROP POLICY IF EXISTS "audit_logs_deny_direct_anon_authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "meals_public_select_active" ON public.meals;
DROP POLICY IF EXISTS "meals_public_select" ON public.meals;
DROP POLICY IF EXISTS "meals_read_policy" ON public.meals;
DROP POLICY IF EXISTS "allow_all_meals" ON public.meals;

-- 4. CREATE EXPLICIT LEAST-PRIVILEGE RLS POLICIES
-- A. MEALS: Public SELECT allowed ONLY for active meals. All writes forbidden.
CREATE POLICY "meals_public_select_active" ON public.meals
  FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

-- B. SENSITIVE PRODUCTION TABLES: Explicit deny policies for anon and authenticated
-- All customer operations pass securely through the trusted Node.js server via Prisma
CREATE POLICY "bookings_deny_direct_anon_authenticated" ON public.bookings
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "booking_items_deny_direct_anon_authenticated" ON public.booking_items
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "payments_deny_direct_anon_authenticated" ON public.payments
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "factory_orders_deny_direct_anon_authenticated" ON public.factory_orders
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "factory_payments_deny_direct_anon_authenticated" ON public.factory_payments
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "admin_users_deny_direct_anon_authenticated" ON public.admin_users
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "audit_logs_deny_direct_anon_authenticated" ON public.audit_logs
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 5. SECURE DEFAULT PRIVILEGES FOR ANY FUTURE TABLES IN SCHEMA public
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
