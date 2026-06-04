CREATE TYPE "public"."status" AS ENUM('PENDING', 'PROCESSED', 'FAILED');--> statement-breakpoint
CREATE TABLE "audio_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"jid" varchar(100),
	"status" "status" NOT NULL,
	"fail_reason" text,
	"error" text,
	"processed_at" timestamp,
	"s3_url" text NOT NULL
);
