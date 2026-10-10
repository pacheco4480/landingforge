-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN "city" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "region" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "country" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "postal_code" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "site_settings" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "site_settings" ADD COLUMN "opening_hours" TEXT;
