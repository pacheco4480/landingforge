-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "theme_id" UUID;

-- CreateIndex
CREATE INDEX "pages_theme_id_idx" ON "pages"("theme_id");

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
