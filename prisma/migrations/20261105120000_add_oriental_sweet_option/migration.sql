-- Safe, non-destructive migration for Celebre Catering
-- Target: public.booking_items.orientalSweetOption
-- Preserves all existing data, bookings, payments, and factory orders without any reset.

-- 1. Add orientalSweetOption column to booking_items table if not exists
ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "orientalSweetOption" TEXT DEFAULT 'none';

-- 2. Populate existing rows with default 'none' if NULL to ensure consistency with Prisma Schema
UPDATE "booking_items" SET "orientalSweetOption" = 'none' WHERE "orientalSweetOption" IS NULL;

-- 3. Verify and add other non-breaking columns if missing
ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "drinkOption" TEXT DEFAULT 'standard';
ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "mealId" TEXT;
ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "baseFactoryPrice" DOUBLE PRECISION;
ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "unitFactoryPrice" DOUBLE PRECISION;
ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "totalFactoryPrice" DOUBLE PRECISION;

-- 4. Verify bookings table columns
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customerWhatsapp" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "preferredContact" TEXT NOT NULL DEFAULT 'whatsapp';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "statusNotes" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "totalFactoryPrice" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "profitMargin" DOUBLE PRECISION;

-- 5. Verify payments table columns
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;

-- 6. Verify factory orders and payments columns
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "packagingNotes" TEXT;
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "factoryCostTotal" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "remainingAmount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'UNPAID';

ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;
ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "recordedBy" TEXT DEFAULT 'الإدارة';
ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'VALID';
ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelledBy" TEXT;
ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
