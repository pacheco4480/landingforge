-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('contact', 'quote', 'booking', 'appointment', 'newsletter', 'custom');

-- AlterTable
ALTER TABLE "forms" ADD COLUMN "thank_you_page_id" UUID;
ALTER TABLE "forms" ADD COLUMN "type" "FormType" NOT NULL DEFAULT 'contact';
ALTER TABLE "forms" ADD COLUMN "status" "FormStatus" NOT NULL DEFAULT 'draft';
ALTER TABLE "forms" ADD COLUMN "redirect_url" TEXT;

-- BackfillStatus
UPDATE "forms" SET "status" = CASE WHEN "is_active" = true THEN 'published'::"FormStatus" ELSE 'archived'::"FormStatus" END;

-- CreateIndex
CREATE INDEX "forms_status_idx" ON "forms"("status");
CREATE INDEX "forms_type_idx" ON "forms"("type");
CREATE INDEX "forms_thank_you_page_id_idx" ON "forms"("thank_you_page_id");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_thank_you_page_id_fkey" FOREIGN KEY ("thank_you_page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
