CREATE TABLE "cultures" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harvests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"culture_id" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"revenue" double precision NOT NULL,
	"expenses" double precision NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"entity" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"harvest_id" text NOT NULL,
	"category_id" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"amount" double precision NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"farm_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_culture_id_cultures_id_fk" FOREIGN KEY ("culture_id") REFERENCES "public"."cultures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_harvest_id_harvests_id_fk" FOREIGN KEY ("harvest_id") REFERENCES "public"."harvests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_harvest_idx" ON "transactions" USING btree ("harvest_id");--> statement-breakpoint
CREATE INDEX "transaction_category_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transaction_category_farm_idx" ON "transaction_categories" USING btree ("farm_id");