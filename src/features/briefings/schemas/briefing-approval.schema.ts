import { z } from "zod";

import { ProjectApprovalType } from "@/generated/prisma/client";

export const briefingApprovalTypeSchema = z.enum([
  ProjectApprovalType.SCOPE,
  ProjectApprovalType.CONTENT,
]);
