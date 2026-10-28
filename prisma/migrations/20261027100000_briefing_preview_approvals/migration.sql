ALTER TABLE "project_briefing_shares"
ADD COLUMN "preview_snapshot" JSONB,
ADD COLUMN "preview_checksum" VARCHAR(64);

ALTER TABLE "project_approvals"
ADD COLUMN "artifact_checksum" VARCHAR(64);
