CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"farmer_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"ttl_minutes" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"request_ip" text,
	"user_agent" text,
	CONSTRAINT "password_reset_tokens_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"farmer_id" text NOT NULL,
	"replaced_by_id" text,
	"family_id" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	CONSTRAINT "refresh_tokens_id_unique" UNIQUE("id"),
	CONSTRAINT "refresh_tokens_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE INDEX "prt_farmer_idx" ON "password_reset_tokens" USING btree ("farmer_id");--> statement-breakpoint
CREATE INDEX "rt_family_idx" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "rt_farmer_idx" ON "refresh_tokens" USING btree ("farmer_id");