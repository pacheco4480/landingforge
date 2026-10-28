CREATE TYPE "client_status" AS ENUM (
  'lead', 'qualified', 'proposal_sent', 'negotiation', 'approved',
  'in_progress', 'review', 'delivered', 'maintenance', 'archived'
);

CREATE TYPE "project_status" AS ENUM (
  'briefing', 'content_collection', 'planning', 'development', 'review',
  'approved', 'delivered', 'maintenance', 'archived'
);

CREATE TYPE "project_priority" AS ENUM ('low', 'normal', 'high');

CREATE TYPE "project_service_type" AS ENUM (
  'template_adaptation', 'structural_change', 'new_template', 'maintenance'
);

CREATE TYPE "project_delivery_mode" AS ENUM ('landing_only', 'landing_with_cms');

CREATE TYPE "project_party" AS ENUM (
  'landingforge', 'client', 'shared', 'not_applicable'
);

CREATE TYPE "maintenance_plan" AS ENUM ('none', 'on_demand', 'contracted');

CREATE TABLE "clients" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "business_name" TEXT NOT NULL,
  "industry" TEXT,
  "website" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "vat_number" TEXT,
  "internal_notes" TEXT,
  "status" "client_status" NOT NULL DEFAULT 'lead',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "service_type" "project_service_type" NOT NULL DEFAULT 'template_adaptation',
  "status" "project_status" NOT NULL DEFAULT 'briefing',
  "priority" "project_priority" NOT NULL DEFAULT 'normal',
  "industry_id" UUID,
  "template_id" UUID,
  "template_variant_id" UUID,
  "template_version" TEXT,
  "delivery_mode" "project_delivery_mode" NOT NULL DEFAULT 'landing_only',
  "site_management_owner" "project_party" NOT NULL DEFAULT 'landingforge',
  "hosting_owner" "project_party" NOT NULL DEFAULT 'client',
  "domain_owner" "project_party" NOT NULL DEFAULT 'client',
  "content_owner" "project_party" NOT NULL DEFAULT 'client',
  "publishing_owner" "project_party" NOT NULL DEFAULT 'landingforge',
  "maintenance_plan" "maintenance_plan" NOT NULL DEFAULT 'none',
  "maintenance_scope" TEXT,
  "maintenance_channel" TEXT,
  "maintenance_window" TEXT,
  "start_date" DATE,
  "delivery_date" DATE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_assignments" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "assigned_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clients_status_updated_at_idx" ON "clients"("status", "updated_at");
CREATE INDEX "clients_business_name_idx" ON "clients"("business_name");
CREATE INDEX "clients_email_idx" ON "clients"("email");
CREATE INDEX "projects_client_id_status_idx" ON "projects"("client_id", "status");
CREATE INDEX "projects_status_priority_updated_at_idx" ON "projects"("status", "priority", "updated_at");
CREATE INDEX "projects_industry_id_idx" ON "projects"("industry_id");
CREATE INDEX "projects_template_id_template_variant_id_idx" ON "projects"("template_id", "template_variant_id");
CREATE UNIQUE INDEX "project_assignments_project_id_user_id_key" ON "project_assignments"("project_id", "user_id");
CREATE INDEX "project_assignments_user_id_project_id_idx" ON "project_assignments"("user_id", "project_id");

ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_industry_id_fkey"
  FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_template_variant_id_fkey"
  FOREIGN KEY ("template_variant_id") REFERENCES "template_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_assigned_by_user_id_fkey"
  FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
