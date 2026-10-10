import { z } from "zod";

import {
  deploymentEnvironments,
  deploymentModes,
  deploymentStatuses,
  domainStatuses,
  sslStatuses,
} from "@/config/deployment";

const domainSchema = z
  .string()
  .trim()
  .max(253)
  .optional()
  .transform((value) => value || null)
  .refine(
    (value) =>
      !value ||
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
        value,
      ),
    "Domínio inválido.",
  );

export const deploymentSettingsSchema = z.object({
  deploymentMode: z.enum(deploymentModes),
  deploymentEnvironment: z.enum(deploymentEnvironments),
  deploymentStatus: z.enum(deploymentStatuses),
  domain: domainSchema,
  domainStatus: z.enum(domainStatuses),
  sslStatus: z.enum(sslStatuses),
  readyForDelivery: z.coerce.boolean().default(false),
});

export type DeploymentSettingsInput = z.infer<typeof deploymentSettingsSchema>;
