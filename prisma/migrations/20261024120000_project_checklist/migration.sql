CREATE TYPE "project_checklist_key" AS ENUM ('LOGO', 'CONTENT', 'IMAGES', 'DOMAIN', 'HOSTING', 'APPROVAL', 'PAYMENT');
CREATE TYPE "project_checklist_status" AS ENUM ('MISSING', 'IN_PROGRESS', 'COMPLETE', 'NOT_APPLICABLE');

CREATE TABLE "project_checklist_items" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "key" "project_checklist_key" NOT NULL,
    "status" "project_checklist_status" NOT NULL DEFAULT 'MISSING',
    "note" TEXT,
    "reference" TEXT,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_checklist_items_project_id_key_key" ON "project_checklist_items"("project_id", "key");
CREATE INDEX "project_checklist_items_project_id_status_idx" ON "project_checklist_items"("project_id", "status");

ALTER TABLE "project_checklist_items" ADD CONSTRAINT "project_checklist_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_checklist_items" ADD CONSTRAINT "project_checklist_items_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
