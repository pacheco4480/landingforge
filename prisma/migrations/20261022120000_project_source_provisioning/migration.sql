CREATE TABLE "project_source_versions" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "template_version" TEXT NOT NULL,
  "source_page_id" UUID,
  "provisioned_page_id" UUID NOT NULL,
  "checksum" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "created_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_source_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_source_versions_project_id_version_key"
  ON "project_source_versions"("project_id", "version");
CREATE INDEX "project_source_versions_source_page_id_idx"
  ON "project_source_versions"("source_page_id");
CREATE INDEX "project_source_versions_provisioned_page_id_idx"
  ON "project_source_versions"("provisioned_page_id");
CREATE INDEX "project_source_versions_created_by_user_id_created_at_idx"
  ON "project_source_versions"("created_by_user_id", "created_at");

ALTER TABLE "project_source_versions"
  ADD CONSTRAINT "project_source_versions_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_source_versions"
  ADD CONSTRAINT "project_source_versions_source_page_id_fkey"
  FOREIGN KEY ("source_page_id") REFERENCES "pages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_source_versions"
  ADD CONSTRAINT "project_source_versions_provisioned_page_id_fkey"
  FOREIGN KEY ("provisioned_page_id") REFERENCES "pages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_source_versions"
  ADD CONSTRAINT "project_source_versions_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
