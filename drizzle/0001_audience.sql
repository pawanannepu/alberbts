CREATE TYPE "public"."audience" AS ENUM('women', 'men', 'unisex');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "audience" "audience" DEFAULT 'unisex' NOT NULL;