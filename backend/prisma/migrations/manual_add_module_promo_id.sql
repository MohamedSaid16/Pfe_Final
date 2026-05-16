-- ============================================================
-- Manual migration: add Module.promoId (additive, no data loss)
-- ============================================================
-- This SQL is hand-written because the auto-generated Prisma
-- migration tried to drop tables that exist in the live DB but
-- are missing from schema.prisma (audit_logs, request_workflow_history,
-- student_reclamation_documents). Those are pre-existing schema
-- drift, not caused by this change.
--
-- Apply this SQL only — it touches ONLY the modules table.
--
-- Run from PowerShell:
--   psql -U <user> -d university-db -f prisma/migrations/manual_add_module_promo_id.sql
-- Or from pgAdmin: open this file in the Query Tool and Run.
-- ============================================================

BEGIN;

-- 1. Add the new nullable column. Safe: no existing row is affected.
ALTER TABLE "modules"
  ADD COLUMN IF NOT EXISTS "promo_id" INTEGER;

-- 2. Foreign key to promos. ON DELETE SET NULL means deleting a promo
--    detaches its modules instead of cascading data loss.
ALTER TABLE "modules"
  ADD CONSTRAINT "modules_promo_id_fkey"
  FOREIGN KEY ("promo_id")
  REFERENCES "promos"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 3. Index for fast "modules in promo X" lookups (used by the
--    academic hierarchy resolver).
CREATE INDEX IF NOT EXISTS "modules_promo_id_idx"
  ON "modules"("promo_id");

COMMIT;
