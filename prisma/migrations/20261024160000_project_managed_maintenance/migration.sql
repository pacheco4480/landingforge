CREATE TYPE "project_maintenance_release_status" AS ENUM ('DRAFT', 'VALIDATED', 'PUBLISHED', 'FAILED');
CREATE TYPE "project_maintenance_destination" AS ENUM ('LANDINGFORGE_HOSTED', 'CLIENT_HOSTED');

CREATE TABLE "project_maintenance_releases" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "project_maintenance_release_status" NOT NULL DEFAULT 'DRAFT',
    "candidate_page_id" UUID NOT NULL,
    "base_release_id" UUID,
    "rollback_target_release_id" UUID,
    "base_source_version_id" UUID,
    "change_summary" VARCHAR(2000) NOT NULL,
    "source_checksum" TEXT,
    "package_checksum" TEXT,
    "package_downloaded_at" TIMESTAMP(3),
    "validation_report" JSONB,
    "approval_required" BOOLEAN NOT NULL DEFAULT false,
    "approval_reference" VARCHAR(300),
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" UUID,
    "destination" "project_maintenance_destination",
    "destination_label" VARCHAR(300),
    "published_at" TIMESTAMP(3),
    "published_by_user_id" UUID,
    "deployment_verified_at" TIMESTAMP(3),
    "deployment_verification" VARCHAR(1000),
    "failure_code" VARCHAR(80),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_maintenance_releases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_maintenance_releases_candidate_page_id_key" ON "project_maintenance_releases"("candidate_page_id");
CREATE UNIQUE INDEX "project_maintenance_releases_project_id_version_key" ON "project_maintenance_releases"("project_id", "version");
CREATE INDEX "project_maintenance_releases_project_id_status_created_at_idx" ON "project_maintenance_releases"("project_id", "status", "created_at");
CREATE INDEX "project_maintenance_releases_base_release_id_idx" ON "project_maintenance_releases"("base_release_id");
CREATE INDEX "project_maintenance_releases_rollback_target_release_id_idx" ON "project_maintenance_releases"("rollback_target_release_id");

ALTER TABLE "project_maintenance_releases" ADD CONSTRAINT "project_maintenance_releases_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_maintenance_releases" ADD CONSTRAINT "project_maintenance_releases_candidate_page_id_fkey"
FOREIGN KEY ("candidate_page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_maintenance_releases" ADD CONSTRAINT "project_maintenance_releases_base_release_id_fkey"
FOREIGN KEY ("base_release_id") REFERENCES "project_maintenance_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_maintenance_releases" ADD CONSTRAINT "project_maintenance_releases_rollback_target_release_id_fkey"
FOREIGN KEY ("rollback_target_release_id") REFERENCES "project_maintenance_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_maintenance_releases" ADD CONSTRAINT "project_maintenance_releases_base_source_version_id_fkey"
FOREIGN KEY ("base_source_version_id") REFERENCES "project_source_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_maintenance_releases" ADD CONSTRAINT "project_maintenance_releases_approved_by_user_id_fkey"
FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_maintenance_releases" ADD CONSTRAINT "project_maintenance_releases_published_by_user_id_fkey"
FOREIGN KEY ("published_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_maintenance_releases" ADD CONSTRAINT "project_maintenance_releases_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
