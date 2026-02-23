-- Add comment column to actions table (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'actions' AND column_name = 'comment') THEN
    ALTER TABLE "actions" ADD COLUMN "comment" text;
  END IF;
END $$;
--> statement-breakpoint
-- Add reviewed to action_type enum (idempotent)
DO $$
BEGIN
  ALTER TYPE "action_type" ADD VALUE 'reviewed';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add groomed to action_type enum (idempotent)
DO $$
BEGIN
  ALTER TYPE "action_type" ADD VALUE 'groomed';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add processed to action_type enum (idempotent)
DO $$
BEGIN
  ALTER TYPE "action_type" ADD VALUE 'processed';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
