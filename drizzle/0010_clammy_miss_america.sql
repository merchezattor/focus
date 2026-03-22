ALTER TABLE "projects" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "kind" SET DEFAULT 'project'::text;--> statement-breakpoint
DROP TYPE "public"."project_kind";--> statement-breakpoint
CREATE TYPE "public"."project_kind" AS ENUM('project', 'group');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "kind" SET DEFAULT 'project'::"public"."project_kind";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "kind" SET DATA TYPE "public"."project_kind" USING "kind"::"public"."project_kind";