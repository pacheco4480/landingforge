CREATE TYPE "DeploymentMode" AS ENUM ('internal_demo', 'client');

CREATE TYPE "DeploymentEnvironment" AS ENUM ('local', 'preview', 'production');

CREATE TYPE "DeploymentStatus" AS ENUM ('not_started', 'configuring', 'ready', 'live', 'blocked');

CREATE TYPE "DomainStatus" AS ENUM ('not_configured', 'pending', 'connected', 'error');

CREATE TYPE "SslStatus" AS ENUM ('not_configured', 'pending', 'active', 'error');

ALTER TABLE "client_settings"
  ADD COLUMN "deployment_mode" "DeploymentMode" NOT NULL DEFAULT 'client',
  ADD COLUMN "deployment_environment" "DeploymentEnvironment" NOT NULL DEFAULT 'local',
  ADD COLUMN "deployment_status" "DeploymentStatus" NOT NULL DEFAULT 'not_started',
  ADD COLUMN "domain_status" "DomainStatus" NOT NULL DEFAULT 'not_configured',
  ADD COLUMN "ssl_status" "SslStatus" NOT NULL DEFAULT 'not_configured',
  ADD COLUMN "ready_for_delivery" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "delivery_checklist" JSONB,
  ADD COLUMN "last_deployment_check_at" TIMESTAMP(3);

CREATE INDEX "client_settings_deployment_status_idx" ON "client_settings"("deployment_status");
