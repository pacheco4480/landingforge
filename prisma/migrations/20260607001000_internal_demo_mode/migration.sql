CREATE TYPE "DemoStatus" AS ENUM ('draft', 'ready', 'published', 'archived');

ALTER TABLE "pages"
  ADD COLUMN "demo_status" "DemoStatus",
  ADD COLUMN "portfolio_visible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "portfolio_order" INTEGER;

CREATE INDEX "pages_is_demo_demo_status_idx"
  ON "pages"("is_demo", "demo_status");

CREATE INDEX "pages_portfolio_visible_portfolio_order_idx"
  ON "pages"("portfolio_visible", "portfolio_order");
