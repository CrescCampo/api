CREATE TABLE "feedbacks" (
	"id" text PRIMARY KEY NOT NULL,
	"farmer_id" text NOT NULL,
	"rating" integer NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_farmer_idx" ON "feedbacks" USING btree ("farmer_id");