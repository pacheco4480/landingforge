-- DropIndex
DROP INDEX "project_maintenance_releases_rollback_target_release_id_idx";

-- DropIndex
DROP INDEX "project_source_versions_provisioned_page_id_idx";

-- AlterTable
ALTER TABLE "project_maintenance_releases" ADD COLUMN     "code_changes" JSONB;
