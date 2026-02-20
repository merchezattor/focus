CREATE TYPE "public"."action_type" AS ENUM('create', 'update', 'delete', 'complete', 'uncomplete');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('user', 'agent', 'system');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('task', 'project', 'goal');--> statement-breakpoint
CREATE TABLE "actions" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"actor_id" text NOT NULL,
	"actor_type" "actor_type" DEFAULT 'user' NOT NULL,
	"action_type" "action_type" NOT NULL,
	"changes" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_goal_id_goals_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD COLUMN "name" text DEFAULT 'Default Token' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "parent_type" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "goal_id";