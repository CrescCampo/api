ALTER TABLE "cultures" ADD COLUMN "farm_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "harvests" ADD COLUMN "farm_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "cultures" ADD CONSTRAINT "cultures_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "culture_farm_idx" ON "cultures" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "harvest_farm_idx" ON "harvests" USING btree ("farm_id");