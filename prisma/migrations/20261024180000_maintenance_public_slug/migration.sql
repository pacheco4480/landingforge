ALTER TABLE "project_maintenance_releases"
ADD COLUMN "public_slug" TEXT;

UPDATE "project_maintenance_releases" AS release
SET "public_slug" = page."slug"
FROM "project_source_versions" AS source_version
JOIN "pages" AS page ON page."id" = source_version."provisioned_page_id"
WHERE release."base_source_version_id" = source_version."id"
  AND release."public_slug" IS NULL;
