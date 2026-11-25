-- Safe, non-destructive migration for Celebre Catering
-- Feature: Edit Factory Orders with Factory Payments (Deposits / Installments / Settlements)
-- Target: public.factory_payments.paymentType (and idempotent verification of factory_orders/factory_payments columns)
-- Preserves all existing bookings, customer payments, factory orders (including FO-2026-109 & CLB-2026-5131), and audit logs without reset or deletion.

-- 1. Add paymentType column to factory_payments if not exists
ALTER TABLE "factory_payments"
  ADD COLUMN IF NOT EXISTS "paymentType" TEXT NOT NULL DEFAULT 'GENERAL';

-- 2. Backfill any legacy NULL rows safely
UPDATE "factory_payments"
  SET "paymentType" = 'GENERAL'
  WHERE "paymentType" IS NULL;

-- 3. Ensure supporting columns exist non-destructively
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "factoryCostTotal" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "remainingAmount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "factory_orders" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'UNPAID';

ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;
ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "recordedBy" TEXT DEFAULT 'الإدارة';
ALTER TABLE "factory_payments" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'VALID';
