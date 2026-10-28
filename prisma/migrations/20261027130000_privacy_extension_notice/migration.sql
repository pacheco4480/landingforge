ALTER TABLE "privacy_requests"
ADD COLUMN "extension_communicated_at" DATE,
ADD COLUMN "extension_communication_channel" VARCHAR(32);
