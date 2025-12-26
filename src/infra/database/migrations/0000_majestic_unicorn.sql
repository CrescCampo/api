CREATE TABLE "farms" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farmers" (
	"id" text PRIMARY KEY NOT NULL,
	"farm_id" text NOT NULL,
	"email" text NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" date,
	"updated_at" date,
	CONSTRAINT "farmers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "farmer_email_idx" ON "farmers" USING btree ("email");