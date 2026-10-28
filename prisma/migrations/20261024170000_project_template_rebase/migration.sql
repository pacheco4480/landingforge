ALTER TABLE "project_maintenance_releases"
ADD COLUMN "target_template_version" TEXT,
ADD COLUMN "template_baseline_snapshot" JSONB,
ADD COLUMN "template_baseline_checksum" TEXT,
ADD COLUMN "rebase_report" JSONB;
