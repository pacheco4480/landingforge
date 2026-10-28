-- CreateIndex
CREATE INDEX "project_maintenance_releases_rollback_target_release_id_idx" ON "project_maintenance_releases"("rollback_target_release_id");

-- CreateIndex
CREATE INDEX "project_source_versions_provisioned_page_id_idx" ON "project_source_versions"("provisioned_page_id");
