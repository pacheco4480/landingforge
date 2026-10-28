CREATE TYPE "project_briefing_status" AS ENUM ('DRAFT', 'IN_PROGRESS', 'REVIEW_REQUESTED', 'APPROVED', 'ARCHIVED');
CREATE TYPE "project_approval_type" AS ENUM ('SCOPE', 'CONTENT', 'DESIGN', 'SEO', 'RELEASE');
CREATE TYPE "project_approval_decision" AS ENUM ('APPROVED', 'REVISION_REQUESTED', 'REJECTED');
CREATE TYPE "project_meeting_type" AS ENUM ('CALL', 'VIDEO_CALL', 'IN_PERSON', 'EMAIL', 'OTHER');
CREATE TYPE "project_proposal_status" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "project_asset_kind" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOGO', 'BRAND_ASSET', 'TESTIMONIAL', 'OTHER');
CREATE TYPE "project_asset_status" AS ENUM ('MISSING', 'RECEIVED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "project_briefings" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "status" "project_briefing_status" NOT NULL DEFAULT 'DRAFT',
    "current_version" INTEGER NOT NULL DEFAULT 0,
    "source_template_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_briefings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_briefing_revisions" (
    "id" UUID NOT NULL,
    "briefing_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "source_template_version" TEXT,
    "answers" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "created_by_user_id" UUID,
    "submitted_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_briefing_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_briefing_shares" (
    "id" UUID NOT NULL,
    "briefing_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_briefing_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_approvals" (
    "id" UUID NOT NULL,
    "briefing_id" UUID NOT NULL,
    "revision_id" UUID,
    "approval_type" "project_approval_type" NOT NULL,
    "decision" "project_approval_decision" NOT NULL,
    "revision_version" INTEGER NOT NULL,
    "revision_hash" TEXT NOT NULL,
    "comment" TEXT,
    "decided_by_user_id" UUID,
    "decided_by_name" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_meetings" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "meeting_type" "project_meeting_type" NOT NULL,
    "title" TEXT NOT NULL,
    "happened_at" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "decisions" JSONB NOT NULL,
    "action_items" JSONB NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_meetings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_proposals" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "project_proposal_status" NOT NULL DEFAULT 'DRAFT',
    "package_name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "support_terms" TEXT,
    "maintenance_terms" TEXT,
    "valid_until" DATE,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_assets" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "media_asset_id" UUID,
    "kind" "project_asset_kind" NOT NULL,
    "status" "project_asset_status" NOT NULL DEFAULT 'MISSING',
    "title" TEXT NOT NULL,
    "section_key" TEXT,
    "content" TEXT,
    "source_url" TEXT,
    "rights_confirmed_at" TIMESTAMP(3),
    "rights_confirmed_by" UUID,
    "review_note" TEXT,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_ai_context_exports" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "briefing_version" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "included_fields" TEXT[] NOT NULL,
    "redacted_categories" TEXT[] NOT NULL,
    "content_hash" TEXT NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_ai_context_exports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_briefings_project_id_key" ON "project_briefings"("project_id");
CREATE INDEX "project_briefings_status_updated_at_idx" ON "project_briefings"("status", "updated_at");
CREATE UNIQUE INDEX "project_briefing_revisions_briefing_id_version_key" ON "project_briefing_revisions"("briefing_id", "version");
CREATE INDEX "project_briefing_revisions_created_by_user_id_created_at_idx" ON "project_briefing_revisions"("created_by_user_id", "created_at");
CREATE UNIQUE INDEX "project_briefing_shares_token_hash_key" ON "project_briefing_shares"("token_hash");
CREATE INDEX "project_briefing_shares_briefing_id_expires_at_revoked_at_idx" ON "project_briefing_shares"("briefing_id", "expires_at", "revoked_at");
CREATE INDEX "project_approvals_briefing_id_approval_type_decided_at_idx" ON "project_approvals"("briefing_id", "approval_type", "decided_at");
CREATE INDEX "project_approvals_revision_id_approval_type_idx" ON "project_approvals"("revision_id", "approval_type");
CREATE INDEX "project_meetings_project_id_happened_at_idx" ON "project_meetings"("project_id", "happened_at");
CREATE UNIQUE INDEX "project_proposals_project_id_version_key" ON "project_proposals"("project_id", "version");
CREATE INDEX "project_proposals_project_id_status_updated_at_idx" ON "project_proposals"("project_id", "status", "updated_at");
CREATE INDEX "project_assets_project_id_status_kind_idx" ON "project_assets"("project_id", "status", "kind");
CREATE INDEX "project_assets_media_asset_id_idx" ON "project_assets"("media_asset_id");
CREATE INDEX "project_ai_context_exports_project_id_created_at_idx" ON "project_ai_context_exports"("project_id", "created_at");

ALTER TABLE "project_briefings" ADD CONSTRAINT "project_briefings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_briefing_revisions" ADD CONSTRAINT "project_briefing_revisions_briefing_id_fkey" FOREIGN KEY ("briefing_id") REFERENCES "project_briefings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_briefing_revisions" ADD CONSTRAINT "project_briefing_revisions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_briefing_shares" ADD CONSTRAINT "project_briefing_shares_briefing_id_fkey" FOREIGN KEY ("briefing_id") REFERENCES "project_briefings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_briefing_shares" ADD CONSTRAINT "project_briefing_shares_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_approvals" ADD CONSTRAINT "project_approvals_briefing_id_fkey" FOREIGN KEY ("briefing_id") REFERENCES "project_briefings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_approvals" ADD CONSTRAINT "project_approvals_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "project_briefing_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_approvals" ADD CONSTRAINT "project_approvals_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_rights_confirmed_by_fkey" FOREIGN KEY ("rights_confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_ai_context_exports" ADD CONSTRAINT "project_ai_context_exports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_ai_context_exports" ADD CONSTRAINT "project_ai_context_exports_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
