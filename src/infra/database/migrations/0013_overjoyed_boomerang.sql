CREATE TYPE "public"."farm_access_status" AS ENUM('courtesy', 'suspended');--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "access_status" "farm_access_status" DEFAULT 'courtesy' NOT NULL;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "invite_id" text;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_invite_id_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."invites"("id") ON DELETE no action ON UPDATE no action;