CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'review', 'done');--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "priority" SET DEFAULT 'p4'::"public"."priority";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo'::"public"."task_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE "public"."task_status" USING "status"::"public"."task_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "actor_type" "actor_type" DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "goal_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "parent_project_id" text;--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "content" TO "title";--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_tasks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actions_entity_id_entity_type_created_at_idx" ON "actions" USING btree ("entity_id","entity_type","created_at");--> statement-breakpoint
CREATE INDEX "actions_user_id_is_read_created_at_idx" ON "actions" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "comments_task_id_idx" ON "comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "goals_user_id_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_project_id_idx" ON "tasks" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_priority_created_at_idx" ON "tasks" USING btree ("user_id","priority","created_at");--> statement-breakpoint
CREATE INDEX "tasks_user_id_due_date_idx" ON "tasks" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "tasks_user_id_status_idx" ON "tasks" USING btree ("user_id","status");--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "parent_type";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "completed";