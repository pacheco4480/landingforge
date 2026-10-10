-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'invited', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('landing', 'legal', 'thank_you', 'custom');

-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'multi_select', 'date', 'file', 'hidden');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('received', 'processed', 'spam', 'failed');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'in_negotiation', 'converted', 'lost');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('low', 'normal', 'high');

-- CreateEnum
CREATE TYPE "EmailDigestFrequency" AS ENUM ('disabled', 'daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('manual', 'automatic', 'export');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL,
    "site_name" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "domain" TEXT,
    "default_language" TEXT NOT NULL DEFAULT 'pt-PT',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Lisbon',
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "address" TEXT,
    "whatsapp_url" TEXT,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "linkedin_url" TEXT,
    "primary_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL,
    "accent_color" TEXT NOT NULL,
    "logo_media_id" UUID,
    "favicon_media_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_settings" (
    "id" UUID NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'pt-PT',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Lisbon',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "date_format" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    "analytics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_message" TEXT,
    "email_digest_frequency" "EmailDigestFrequency" NOT NULL DEFAULT 'disabled',
    "email_digest_hour" INTEGER NOT NULL DEFAULT 9,
    "email_digest_recipient" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "industry_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_variants" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "primary_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL,
    "accent_color" TEXT NOT NULL,
    "background_color" TEXT NOT NULL,
    "surface_color" TEXT NOT NULL,
    "text_primary_color" TEXT NOT NULL,
    "text_secondary_color" TEXT NOT NULL,
    "heading_font" TEXT NOT NULL,
    "body_font" TEXT NOT NULL,
    "border_radius" TEXT NOT NULL,
    "shadow_style" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "template_id" UUID,
    "template_variant_id" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "PageStatus" NOT NULL DEFAULT 'draft',
    "page_type" "PageType" NOT NULL DEFAULT 'landing',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "demo_key" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "section_key" TEXT NOT NULL,
    "section_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_templates" (
    "id" UUID NOT NULL,
    "section_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "preview_image_media_id" UUID,
    "configuration_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" UUID NOT NULL,
    "page_id" UUID,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "success_message" TEXT NOT NULL,
    "error_message" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" UUID NOT NULL,
    "form_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FormFieldType" NOT NULL,
    "placeholder" TEXT,
    "help_text" TEXT,
    "default_value" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "conditional_logic" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" UUID NOT NULL,
    "form_id" UUID NOT NULL,
    "page_id" UUID,
    "data" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'received',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_files" (
    "id" UUID NOT NULL,
    "form_submission_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "form_submission_id" UUID,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "priority" "LeadPriority" NOT NULL DEFAULT 'normal',
    "assigned_to_user_id" UUID,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_contacted_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "lost_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "user_id" UUID,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_stages" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_folders" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "folder_id" UUID,
    "filename" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT,
    "storage_provider" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT,
    "tags" JSONB,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_settings" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "meta_title" TEXT NOT NULL,
    "meta_description" TEXT NOT NULL,
    "keywords" TEXT,
    "canonical_url" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image_media_id" UUID,
    "twitter_card_type" TEXT,
    "robots_index" BOOLEAN NOT NULL DEFAULT true,
    "robots_follow" BOOLEAN NOT NULL DEFAULT true,
    "schema_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirects" (
    "id" UUID NOT NULL,
    "from_path" TEXT NOT NULL,
    "to_path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "page_id" UUID,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_snapshots" (
    "id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "total_leads" INTEGER NOT NULL DEFAULT 0,
    "new_leads" INTEGER NOT NULL DEFAULT 0,
    "converted_leads" INTEGER NOT NULL DEFAULT 0,
    "lost_leads" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backups" (
    "id" UUID NOT NULL,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'pending',
    "storage_path" TEXT,
    "size_bytes" INTEGER,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_domain_key" ON "site_settings"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "industries_key_key" ON "industries"("key");

-- CreateIndex
CREATE INDEX "industries_is_active_idx" ON "industries"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "templates_key_key" ON "templates"("key");

-- CreateIndex
CREATE INDEX "templates_industry_id_idx" ON "templates"("industry_id");

-- CreateIndex
CREATE INDEX "templates_is_active_idx" ON "templates"("is_active");

-- CreateIndex
CREATE INDEX "template_variants_is_active_idx" ON "template_variants"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "template_variants_template_id_key_key" ON "template_variants"("template_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "themes_key_key" ON "themes"("key");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pages_demo_key_key" ON "pages"("demo_key");

-- CreateIndex
CREATE INDEX "pages_template_id_idx" ON "pages"("template_id");

-- CreateIndex
CREATE INDEX "pages_template_variant_id_idx" ON "pages"("template_variant_id");

-- CreateIndex
CREATE INDEX "pages_status_idx" ON "pages"("status");

-- CreateIndex
CREATE INDEX "pages_page_type_idx" ON "pages"("page_type");

-- CreateIndex
CREATE INDEX "pages_is_demo_idx" ON "pages"("is_demo");

-- CreateIndex
CREATE INDEX "page_sections_page_id_sort_order_idx" ON "page_sections"("page_id", "sort_order");

-- CreateIndex
CREATE INDEX "page_sections_section_type_idx" ON "page_sections"("section_type");

-- CreateIndex
CREATE UNIQUE INDEX "page_sections_page_id_section_key_key" ON "page_sections"("page_id", "section_key");

-- CreateIndex
CREATE INDEX "section_templates_preview_image_media_id_idx" ON "section_templates"("preview_image_media_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_templates_section_type_name_key" ON "section_templates"("section_type", "name");

-- CreateIndex
CREATE INDEX "forms_is_active_idx" ON "forms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "forms_page_id_key_key" ON "forms"("page_id", "key");

-- CreateIndex
CREATE INDEX "form_fields_form_id_sort_order_idx" ON "form_fields"("form_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_form_id_name_key" ON "form_fields"("form_id", "name");

-- CreateIndex
CREATE INDEX "form_submissions_form_id_created_at_idx" ON "form_submissions"("form_id", "created_at");

-- CreateIndex
CREATE INDEX "form_submissions_page_id_created_at_idx" ON "form_submissions"("page_id", "created_at");

-- CreateIndex
CREATE INDEX "form_submissions_status_idx" ON "form_submissions"("status");

-- CreateIndex
CREATE INDEX "submission_files_media_asset_id_idx" ON "submission_files"("media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_files_form_submission_id_media_asset_id_key" ON "submission_files"("form_submission_id", "media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_form_submission_id_key" ON "leads"("form_submission_id");

-- CreateIndex
CREATE INDEX "leads_status_created_at_idx" ON "leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "leads_priority_idx" ON "leads"("priority");

-- CreateIndex
CREATE INDEX "leads_assigned_to_user_id_idx" ON "leads"("assigned_to_user_id");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "lead_notes_lead_id_created_at_idx" ON "lead_notes"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_notes_user_id_idx" ON "lead_notes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_stages_name_key" ON "lead_stages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lead_stages_sort_order_key" ON "lead_stages"("sort_order");

-- CreateIndex
CREATE INDEX "media_folders_parent_id_idx" ON "media_folders"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_folders_parent_id_name_key" ON "media_folders"("parent_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_path_key" ON "media_assets"("storage_path");

-- CreateIndex
CREATE INDEX "media_assets_folder_id_idx" ON "media_assets"("folder_id");

-- CreateIndex
CREATE INDEX "media_assets_mime_type_idx" ON "media_assets"("mime_type");

-- CreateIndex
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at");

-- CreateIndex
CREATE INDEX "media_assets_created_by_user_id_idx" ON "media_assets"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seo_settings_page_id_key" ON "seo_settings"("page_id");

-- CreateIndex
CREATE INDEX "seo_settings_og_image_media_id_idx" ON "seo_settings"("og_image_media_id");

-- CreateIndex
CREATE UNIQUE INDEX "redirects_from_path_key" ON "redirects"("from_path");

-- CreateIndex
CREATE INDEX "redirects_to_path_idx" ON "redirects"("to_path");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "analytics_events_page_id_created_at_idx" ON "analytics_events"("page_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_created_at_idx" ON "analytics_events"("event_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_snapshots_snapshot_date_key" ON "dashboard_snapshots"("snapshot_date");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "backups_status_created_at_idx" ON "backups"("status", "created_at");

-- CreateIndex
CREATE INDEX "backups_created_by_user_id_idx" ON "backups"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_media_id_fkey" FOREIGN KEY ("logo_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_media_id_fkey" FOREIGN KEY ("favicon_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_variants" ADD CONSTRAINT "template_variants_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_template_variant_id_fkey" FOREIGN KEY ("template_variant_id") REFERENCES "template_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_templates" ADD CONSTRAINT "section_templates_preview_image_media_id_fkey" FOREIGN KEY ("preview_image_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "form_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_og_image_media_id_fkey" FOREIGN KEY ("og_image_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backups" ADD CONSTRAINT "backups_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain constraints not expressible in the Prisma schema.
ALTER TABLE "client_settings"
ADD CONSTRAINT "client_settings_email_digest_hour_check"
CHECK ("email_digest_hour" BETWEEN 0 AND 23);

ALTER TABLE "redirects"
ADD CONSTRAINT "redirects_status_code_check"
CHECK ("status_code" IN (301, 302));

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_size_bytes_check"
CHECK ("size_bytes" >= 0);

ALTER TABLE "backups"
ADD CONSTRAINT "backups_size_bytes_check"
CHECK ("size_bytes" IS NULL OR "size_bytes" >= 0);

-- Audit logs are append-only at the database level.
CREATE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_prevent_update
BEFORE UPDATE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER audit_logs_prevent_delete
BEFORE DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

