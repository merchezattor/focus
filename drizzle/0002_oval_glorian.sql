ALTER TYPE "public"."action_type" ADD VALUE 'reviewed';--> statement-breakpoint
ALTER TYPE "public"."action_type" ADD VALUE 'groomed';--> statement-breakpoint
ALTER TYPE "public"."action_type" ADD VALUE 'processed';--> statement-breakpoint
ALTER TYPE "public"."action_type" ADD VALUE 'pending';--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "comment" text;