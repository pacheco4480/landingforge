import { DemoStatus, PageStatus, Prisma } from "@/generated/prisma/client";

export const publicPortfolioWhere: Prisma.PageWhereInput = {
  isDemo: true,
  status: PageStatus.PUBLISHED,
  demoStatus: DemoStatus.PUBLISHED,
  portfolioVisible: true,
  deletedAt: null,
  template: { is: { isActive: true, industry: { is: { isActive: true } } } },
  templateVariant: { is: { isActive: true } },
};

export function canPublishPortfolioScreenshot(input: {
  category: string;
  consentState: string;
  hasPublicAsset: boolean;
  portfolioVisible: boolean;
  pageStatus: string;
  demoStatus: string | null;
}) {
  return input.category !== "cms" && input.category !== "dashboard"
    && input.consentState !== "rejected"
    && input.hasPublicAsset
    && input.portfolioVisible
    && input.pageStatus === "PUBLISHED"
    && input.demoStatus === "PUBLISHED";
}
