CREATE TYPE "LegalDocumentType" AS ENUM ('privacy_policy', 'cookie_policy', 'terms', 'legal_notice');

ALTER TABLE "forms"
  ADD COLUMN "gdpr_consent_required" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "gdpr_consent_label" TEXT NOT NULL DEFAULT 'Li e aceito a Politica de Privacidade.',
  ADD COLUMN "gdpr_consent_version" TEXT NOT NULL DEFAULT '1.0';

ALTER TABLE "form_submissions"
  ADD COLUMN "consent_given" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consent_version" TEXT,
  ADD COLUMN "consent_given_at" TIMESTAMP(3),
  ADD COLUMN "consent_source" TEXT;

ALTER TABLE "leads"
  ADD COLUMN "consent_given" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consent_version" TEXT,
  ADD COLUMN "consent_given_at" TIMESTAMP(3),
  ADD COLUMN "consent_source" TEXT;

CREATE TABLE "legal_settings" (
  "id" UUID NOT NULL,
  "site_setting_id" UUID NOT NULL,
  "consent_version" TEXT NOT NULL DEFAULT '1.0',
  "cookie_banner_enabled" BOOLEAN NOT NULL DEFAULT true,
  "analytics_cookies_enabled" BOOLEAN NOT NULL DEFAULT false,
  "marketing_cookies_enabled" BOOLEAN NOT NULL DEFAULT false,
  "privacy_page_id" UUID,
  "cookie_page_id" UUID,
  "terms_page_id" UUID,
  "retention_days" INTEGER NOT NULL DEFAULT 365,
  "data_controller_name" TEXT,
  "data_controller_email" TEXT,
  "updated_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "legal_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_document_versions" (
  "id" UUID NOT NULL,
  "page_id" UUID NOT NULL,
  "type" "LegalDocumentType" NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "content" JSONB NOT NULL DEFAULT '{}',
  "created_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "legal_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cookie_consents" (
  "id" UUID NOT NULL,
  "consent_id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "necessary" BOOLEAN NOT NULL DEFAULT true,
  "analytics" BOOLEAN NOT NULL DEFAULT false,
  "marketing" BOOLEAN NOT NULL DEFAULT false,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cookie_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legal_settings_site_setting_id_key" ON "legal_settings"("site_setting_id");
CREATE INDEX "legal_settings_updated_by_user_id_idx" ON "legal_settings"("updated_by_user_id");
CREATE UNIQUE INDEX "legal_document_versions_page_id_version_key" ON "legal_document_versions"("page_id", "version");
CREATE INDEX "legal_document_versions_type_created_at_idx" ON "legal_document_versions"("type", "created_at");
CREATE INDEX "legal_document_versions_created_by_user_id_idx" ON "legal_document_versions"("created_by_user_id");
CREATE UNIQUE INDEX "cookie_consents_consent_id_key" ON "cookie_consents"("consent_id");
CREATE INDEX "cookie_consents_version_created_at_idx" ON "cookie_consents"("version", "created_at");
CREATE INDEX "cookie_consents_analytics_marketing_idx" ON "cookie_consents"("analytics", "marketing");
CREATE INDEX "form_submissions_consent_given_consent_given_at_idx" ON "form_submissions"("consent_given", "consent_given_at");
CREATE INDEX "leads_consent_given_consent_given_at_idx" ON "leads"("consent_given", "consent_given_at");

ALTER TABLE "legal_settings" ADD CONSTRAINT "legal_settings_site_setting_id_fkey" FOREIGN KEY ("site_setting_id") REFERENCES "site_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legal_settings" ADD CONSTRAINT "legal_settings_privacy_page_id_fkey" FOREIGN KEY ("privacy_page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_settings" ADD CONSTRAINT "legal_settings_cookie_page_id_fkey" FOREIGN KEY ("cookie_page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_settings" ADD CONSTRAINT "legal_settings_terms_page_id_fkey" FOREIGN KEY ("terms_page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_settings" ADD CONSTRAINT "legal_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
