CREATE TABLE "portfolio_screenshots" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "media_asset_id" UUID,
    "private_storage_path" TEXT,
    "category" TEXT NOT NULL,
    "viewport" TEXT NOT NULL,
    "source_route" TEXT NOT NULL,
    "consent_state" TEXT NOT NULL,
    "content_origin" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_screenshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portfolio_screenshots_page_id_is_public_sort_order_idx"
ON "portfolio_screenshots"("page_id", "is_public", "sort_order");

CREATE INDEX "portfolio_screenshots_media_asset_id_idx"
ON "portfolio_screenshots"("media_asset_id");

ALTER TABLE "portfolio_screenshots"
ADD CONSTRAINT "portfolio_screenshots_page_id_fkey"
FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolio_screenshots"
ADD CONSTRAINT "portfolio_screenshots_media_asset_id_fkey"
FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
