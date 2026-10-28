ALTER TABLE "client_package_exports"
ADD COLUMN "source_checksum" VARCHAR(64);

ALTER TABLE "project_briefing_shares"
ADD COLUMN "release_export_id" UUID,
ADD COLUMN "release_checksum" VARCHAR(64);

CREATE INDEX "project_briefing_shares_release_export_id_idx"
ON "project_briefing_shares"("release_export_id");

ALTER TABLE "project_briefing_shares"
ADD CONSTRAINT "project_briefing_shares_release_export_id_fkey"
FOREIGN KEY ("release_export_id") REFERENCES "client_package_exports"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
