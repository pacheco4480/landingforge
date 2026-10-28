CREATE TYPE "prospect_status" AS ENUM (
  'new', 'needs_review', 'ready_to_contact', 'contacted',
  'manual_follow_up', 'interested', 'not_interested', 'do_not_contact',
  'converted', 'archived'
);

CREATE TYPE "prospect_source_type" AS ENUM ('manual', 'csv', 'assisted');
CREATE TYPE "prospect_suppression_type" AS ENUM ('email', 'domain');

CREATE TABLE "prospects" (
  "id" UUID NOT NULL,
  "business_name" VARCHAR(160) NOT NULL,
  "contact_name" VARCHAR(120),
  "email" VARCHAR(254),
  "normalized_email" VARCHAR(254),
  "phone" VARCHAR(50),
  "industry" VARCHAR(80),
  "locality" VARCHAR(120),
  "website" VARCHAR(500),
  "normalized_domain" VARCHAR(253),
  "public_profile_url" VARCHAR(500),
  "source_type" "prospect_source_type" NOT NULL DEFAULT 'manual',
  "source_url" VARCHAR(1000),
  "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified_at" TIMESTAMP(3),
  "business_signals" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "factual_notes" VARCHAR(3000),
  "qualification_reason" VARCHAR(1000),
  "next_follow_up_at" DATE,
  "status" "prospect_status" NOT NULL DEFAULT 'new',
  "created_by_id" UUID NOT NULL,
  "assigned_to_id" UUID,
  "converted_client_id" UUID,
  "last_meaningful_contact_at" DATE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prospect_suppressions" (
  "id" UUID NOT NULL,
  "type" "prospect_suppression_type" NOT NULL,
  "value" VARCHAR(254) NOT NULL,
  "normalized_value" VARCHAR(254) NOT NULL,
  "reason" VARCHAR(300) NOT NULL,
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prospect_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prospect_email_templates" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "industry" VARCHAR(80),
  "purpose" VARCHAR(300) NOT NULL,
  "locale" VARCHAR(10) NOT NULL DEFAULT 'pt-PT',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prospect_email_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prospect_email_template_versions" (
  "id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "subject" VARCHAR(300) NOT NULL,
  "body" VARCHAR(12000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prospect_email_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prospect_outreach_drafts" (
  "id" UUID NOT NULL,
  "prospect_id" UUID NOT NULL,
  "template_id" UUID,
  "template_version_id" UUID,
  "author_id" UUID NOT NULL,
  "recipient" VARCHAR(254),
  "subject_snapshot" VARCHAR(300) NOT NULL,
  "body_snapshot" VARCHAR(12000) NOT NULL,
  "manual_exported_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prospect_outreach_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prospects_normalized_email_key" ON "prospects"("normalized_email");
CREATE UNIQUE INDEX "prospects_normalized_domain_key" ON "prospects"("normalized_domain");
CREATE UNIQUE INDEX "prospects_converted_client_id_key" ON "prospects"("converted_client_id");
CREATE INDEX "prospects_status_updated_at_idx" ON "prospects"("status", "updated_at");
CREATE INDEX "prospects_industry_locality_idx" ON "prospects"("industry", "locality");
CREATE INDEX "prospects_source_type_collected_at_idx" ON "prospects"("source_type", "collected_at");
CREATE INDEX "prospects_assigned_to_id_status_idx" ON "prospects"("assigned_to_id", "status");
CREATE UNIQUE INDEX "prospect_suppressions_normalized_value_key" ON "prospect_suppressions"("normalized_value");
CREATE INDEX "prospect_suppressions_type_created_at_idx" ON "prospect_suppressions"("type", "created_at");
CREATE INDEX "prospect_email_templates_is_active_industry_idx" ON "prospect_email_templates"("is_active", "industry");
CREATE UNIQUE INDEX "prospect_email_template_versions_template_id_version_key" ON "prospect_email_template_versions"("template_id", "version");
CREATE INDEX "prospect_email_template_versions_template_id_created_at_idx" ON "prospect_email_template_versions"("template_id", "created_at");
CREATE INDEX "prospect_outreach_drafts_prospect_id_updated_at_idx" ON "prospect_outreach_drafts"("prospect_id", "updated_at");
CREATE INDEX "prospect_outreach_drafts_author_id_created_at_idx" ON "prospect_outreach_drafts"("author_id", "created_at");

ALTER TABLE "prospects" ADD CONSTRAINT "prospects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_converted_client_id_fkey" FOREIGN KEY ("converted_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prospect_suppressions" ADD CONSTRAINT "prospect_suppressions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prospect_email_templates" ADD CONSTRAINT "prospect_email_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prospect_email_template_versions" ADD CONSTRAINT "prospect_email_template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "prospect_email_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prospect_outreach_drafts" ADD CONSTRAINT "prospect_outreach_drafts_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prospect_outreach_drafts" ADD CONSTRAINT "prospect_outreach_drafts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "prospect_email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prospect_outreach_drafts" ADD CONSTRAINT "prospect_outreach_drafts_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "prospect_email_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prospect_outreach_drafts" ADD CONSTRAINT "prospect_outreach_drafts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "key", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'prospects.read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'prospects.write', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'api_request';

