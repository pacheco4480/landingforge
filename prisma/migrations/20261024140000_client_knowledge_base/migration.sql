CREATE TYPE "client_knowledge_category" AS ENUM ('PAST_REQUEST', 'PREFERENCE', 'APPROVED_STYLE', 'REJECTED_STYLE', 'NOTE');

CREATE TABLE "client_knowledge_entries" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "project_id" UUID,
    "category" "client_knowledge_category" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "content" VARCHAR(3000) NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "client_knowledge_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_knowledge_entries_client_id_category_updated_at_idx" ON "client_knowledge_entries"("client_id", "category", "updated_at");
CREATE INDEX "client_knowledge_entries_project_id_idx" ON "client_knowledge_entries"("project_id");

ALTER TABLE "client_knowledge_entries" ADD CONSTRAINT "client_knowledge_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_knowledge_entries" ADD CONSTRAINT "client_knowledge_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_knowledge_entries" ADD CONSTRAINT "client_knowledge_entries_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_knowledge_entries" ADD CONSTRAINT "client_knowledge_entries_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
