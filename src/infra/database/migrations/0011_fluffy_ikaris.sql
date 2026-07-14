CREATE TABLE "email_verification_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"farmer_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"ttl_minutes" integer NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "farmers" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "farmers" SET "email_verified" = true;--> statement-breakpoint
CREATE INDEX "evc_farmer_idx" ON "email_verification_codes" USING btree ("farmer_id");