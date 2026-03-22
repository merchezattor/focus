UPDATE "projects" SET "kind" = 'group' WHERE "kind" = 'container';--> statement-breakpoint
ALTER TYPE "public"."project_kind" RENAME VALUE 'container' TO 'group';