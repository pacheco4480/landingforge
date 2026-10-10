CREATE TYPE "SystemLogLevel" AS ENUM ('info', 'warning', 'error', 'critical');

CREATE TYPE "SystemLogSource" AS ENUM ('frontend', 'backend', 'api', 'database', 'auth', 'storage', 'email', 'cms', 'security', 'system');

CREATE TABLE "system_error_logs" (
    "id" UUID NOT NULL,
    "level" "SystemLogLevel" NOT NULL,
    "source" "SystemLogSource" NOT NULL,
    "message" TEXT NOT NULL,
    "fingerprint" TEXT,
    "user_id" UUID,
    "path" TEXT,
    "action" TEXT,
    "environment" TEXT NOT NULL,
    "request_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_error_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_error_logs_level_created_at_idx" ON "system_error_logs"("level", "created_at");

CREATE INDEX "system_error_logs_source_created_at_idx" ON "system_error_logs"("source", "created_at");

CREATE INDEX "system_error_logs_fingerprint_created_at_idx" ON "system_error_logs"("fingerprint", "created_at");

CREATE INDEX "system_error_logs_user_id_created_at_idx" ON "system_error_logs"("user_id", "created_at");

ALTER TABLE "system_error_logs" ADD CONSTRAINT "system_error_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
