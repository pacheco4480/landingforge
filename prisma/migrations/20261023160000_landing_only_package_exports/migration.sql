CREATE TYPE "client_package_export_status" AS ENUM ('ready', 'blocked', 'failed');

CREATE TABLE "client_package_exports" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "created_by_user_id" UUID NOT NULL,
  "status" "client_package_export_status" NOT NULL,
  "mode" "project_delivery_mode" NOT NULL DEFAULT 'landing_only',
  "template_version" TEXT NOT NULL,
  "audit_report" JSONB NOT NULL,
  "artifact_checksum" TEXT,
  "file_count" INTEGER NOT NULL,
  "total_bytes" INTEGER NOT NULL,
  "download_started_at" TIMESTAMP(3),
  "failure_code" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_package_exports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_package_exports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "client_package_exports_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "client_package_exports_project_id_created_at_idx" ON "client_package_exports"("project_id", "created_at");
CREATE INDEX "client_package_exports_expires_at_idx" ON "client_package_exports"("expires_at");
CREATE INDEX "client_package_exports_created_by_user_id_created_at_idx" ON "client_package_exports"("created_by_user_id", "created_at");
