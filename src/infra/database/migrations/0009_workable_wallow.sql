ALTER TABLE "farmers" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "farmers" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_googleId_unique" UNIQUE("google_id");