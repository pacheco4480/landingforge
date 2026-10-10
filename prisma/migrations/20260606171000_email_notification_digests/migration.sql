CREATE TYPE "EmailType" AS ENUM ('password_reset', 'welcome', 'notification_digest');

CREATE TYPE "EmailDeliveryStatus" AS ENUM ('pending', 'sent', 'failed');

ALTER TABLE "client_settings"
  ADD COLUMN "email_digest_weekday" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "email_digest_last_sent_at" TIMESTAMP(3),
  ADD COLUMN "email_digest_last_status" "EmailDeliveryStatus";

CREATE INDEX "client_settings_email_digest_frequency_idx"
  ON "client_settings"("email_digest_frequency");

CREATE TABLE "email_logs" (
  "id" UUID NOT NULL,
  "type" "EmailType" NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'pending',
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "provider_id" TEXT,
  "error_message" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_type_status_created_at_idx"
  ON "email_logs"("type", "status", "created_at");

CREATE INDEX "email_logs_recipient_created_at_idx"
  ON "email_logs"("recipient", "created_at");
