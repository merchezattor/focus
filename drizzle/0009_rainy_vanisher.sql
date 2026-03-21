CREATE TYPE "public"."project_kind" AS ENUM('project', 'container');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "kind" "project_kind" DEFAULT 'project' NOT NULL;