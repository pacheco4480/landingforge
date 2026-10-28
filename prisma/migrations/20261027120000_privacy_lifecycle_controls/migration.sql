CREATE TYPE "privacy_request_type" AS ENUM (
  'access',
  'rectification',
  'erasure',
  'restriction',
  'objection'
);

CREATE TYPE "privacy_request_status" AS ENUM (
  'received',
  'verifying',
  'verified',
  'review',
  'approved',
  'in_progress',
  'completed',
  'partially_completed',
  'declined',
  'closed'
);

ALTER TABLE "clients"
ADD COLUMN "last_meaningful_contact_at" DATE;

ALTER TABLE "projects"
ADD COLUMN "service_ended_at" DATE;

CREATE TABLE "privacy_retention_policies" (
  "id" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "label" VARCHAR(160) NOT NULL,
  "purpose" VARCHAR(500) NOT NULL,
  "legal_basis_note" VARCHAR(500) NOT NULL,
  "retention_days" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "automation_enabled" BOOLEAN NOT NULL DEFAULT false,
  "owner_approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "legal_reviewed_at" TIMESTAMP(3),
  "updated_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "privacy_retention_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "privacy_requests" (
  "id" UUID NOT NULL,
  "type" "privacy_request_type" NOT NULL,
  "status" "privacy_request_status" NOT NULL DEFAULT 'received',
  "requester_name" VARCHAR(160) NOT NULL,
  "requester_email" VARCHAR(254) NOT NULL,
  "client_id" UUID,
  "project_id" UUID,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "due_at" DATE,
  "identity_verified_at" TIMESTAMP(3),
  "identity_verified_by_id" UUID,
  "identity_verification_method" VARCHAR(160),
  "decision_summary" VARCHAR(1000),
  "resolved_at" TIMESTAMP(3),
  "created_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "privacy_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "privacy_retention_policies_key_key"
ON "privacy_retention_policies"("key");

CREATE INDEX "privacy_requests_status_received_at_idx"
ON "privacy_requests"("status", "received_at");

CREATE INDEX "privacy_requests_client_id_received_at_idx"
ON "privacy_requests"("client_id", "received_at");

CREATE INDEX "privacy_requests_project_id_received_at_idx"
ON "privacy_requests"("project_id", "received_at");

ALTER TABLE "privacy_retention_policies"
ADD CONSTRAINT "privacy_retention_policies_updated_by_user_id_fkey"
FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "privacy_requests"
ADD CONSTRAINT "privacy_requests_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "clients"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "privacy_requests"
ADD CONSTRAINT "privacy_requests_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "privacy_requests"
ADD CONSTRAINT "privacy_requests_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "privacy_requests"
ADD CONSTRAINT "privacy_requests_identity_verified_by_id_fkey"
FOREIGN KEY ("identity_verified_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "privacy_retention_policies"
  ("id", "key", "label", "purpose", "legal_basis_note", "retention_days", "owner_approved_at", "updated_at")
VALUES
  (
    'c2a8c0f6-e28a-4b03-9fc0-3df62de7f452',
    'uncontracted_prospect',
    'Contactos de prospeção sem projeto',
    'Rever contactos comerciais sem projeto associado após o último contacto substantivo registado.',
    'Prazo operacional aprovado pelo proprietário. Confirmar finalidade, base aplicável e exceções com assessoria competente antes de qualquer apagamento.',
    365,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '85cf9049-78b4-4992-90e6-7ee4eeb8aac0',
    'project_working_data',
    'Dados de trabalho após fim do serviço',
    'Rever dados de trabalho de projetos entregues ou arquivados após a data efetiva de fim do serviço registada.',
    'Prazo operacional aprovado pelo proprietário. Excluir documentos contabilísticos/contratuais e confirmar obrigações, contratos e backups antes de qualquer apagamento.',
    365,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
