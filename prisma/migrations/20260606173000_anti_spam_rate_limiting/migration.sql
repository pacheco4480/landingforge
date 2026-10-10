CREATE TYPE "SecurityEventType" AS ENUM ('rate_limit', 'spam_detected', 'turnstile_failed', 'honeypot_triggered', 'upload_blocked', 'auth_blocked');

CREATE TABLE "security_settings" (
  "id" UUID NOT NULL,
  "turnstile_enabled" BOOLEAN NOT NULL DEFAULT false,
  "turnstile_site_key" TEXT,
  "honeypot_enabled" BOOLEAN NOT NULL DEFAULT true,
  "duplicate_cooldown_seconds" INTEGER NOT NULL DEFAULT 60,
  "login_limit_per_minute" INTEGER NOT NULL DEFAULT 5,
  "password_reset_limit_per_hour" INTEGER NOT NULL DEFAULT 3,
  "form_limit_per_minute" INTEGER NOT NULL DEFAULT 5,
  "upload_limit_per_minute" INTEGER NOT NULL DEFAULT 10,
  "api_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "security_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_events" (
  "id" UUID NOT NULL,
  "type" "SecurityEventType" NOT NULL,
  "scope" TEXT NOT NULL,
  "key_hash" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "security_events_type_created_at_idx"
  ON "security_events"("type", "created_at");

CREATE INDEX "security_events_scope_created_at_idx"
  ON "security_events"("scope", "created_at");

CREATE INDEX "security_events_key_hash_scope_created_at_idx"
  ON "security_events"("key_hash", "scope", "created_at");
