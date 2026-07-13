CREATE TABLE "transaction_tombstones" (
	"id" text PRIMARY KEY NOT NULL,
	"farm_id" text NOT NULL,
	"deleted_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "transaction_tombstones" ADD CONSTRAINT "transaction_tombstones_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_tombstone_farm_idx" ON "transaction_tombstones" USING btree ("farm_id");