import { z } from "zod";

export const clientCmsRoleSchema = z.enum(["client_admin", "viewer"]);
export type ClientCmsRole = z.infer<typeof clientCmsRoleSchema>;

export const clientCmsPermissionSchema = z.enum([
  "content.read",
  "content.write",
  "leads.read",
  "leads.write",
  "media.read",
  "media.write",
  "forms.read",
  "forms.write",
]);
export type ClientCmsPermission = z.infer<typeof clientCmsPermissionSchema>;

export type ClientCmsActor = {
  userId: string;
  projectId: string;
  role: ClientCmsRole;
  authorizationVersion: number;
};

export type AuthorizedClientCmsContext = ClientCmsActor & {
  installation: ClientCmsInstallation;
};

export type ClientCmsCapability = {
  sectionKey: string;
  sectionType: string;
  editableFields: string[];
};

export type ClientCmsInstallation = {
  projectId: string;
  templateKey: string;
  variantKey: string;
  templateVersion: string;
  sourceChecksum: string;
  capabilities: ClientCmsCapability[];
};

export const clientCmsContentPatchSchema = z.record(
  z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/),
  z.unknown(),
).superRefine((record, context) => {
  const visit = (value: unknown, path: (string | number)[], depth: number) => {
    if (depth > 6) {
      context.addIssue({ code: "custom", path, message: "A estrutura do conteúdo é demasiado profunda." });
      return;
    }
    if (typeof value === "string") {
      if (value.length > 5000) context.addIssue({ code: "custom", path, message: "O texto excede o limite permitido." });
    } else if (typeof value === "number") {
      if (!Number.isFinite(value)) context.addIssue({ code: "custom", path, message: "O conteúdo contém um número inválido." });
    } else if (Array.isArray(value)) {
      if (value.length > 100) context.addIssue({ code: "custom", path, message: "A lista excede o limite permitido." });
      value.forEach((item, index) => visit(item, [...path, index], depth + 1));
    } else if (value && typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length > 100) context.addIssue({ code: "custom", path, message: "O objeto excede o limite permitido." });
      entries.forEach(([key, item]) => {
        if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(key) || /(?:password|secret|token|credential|database|tenant|project|internal|admin)/i.test(key)) {
          context.addIssue({ code: "custom", path: [...path, key], message: "O conteúdo contém uma chave não permitida." });
        }
        visit(item, [...path, key], depth + 1);
      });
    } else if (value !== null && typeof value !== "boolean") {
      context.addIssue({ code: "custom", path, message: "O conteúdo não pertence ao formato JSON suportado." });
    }
  };
  Object.entries(record).forEach(([key, value]) => visit(value, [key], 0));
});

export const clientCmsInstallationSchema = z.object({
  projectId: z.string().uuid(),
  templateKey: z.string().min(1).max(100),
  variantKey: z.string().min(1).max(100),
  templateVersion: z.string().min(1).max(160),
  sourceChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  capabilities: z.array(z.object({
    sectionKey: z.string().min(1).max(120),
    sectionType: z.string().min(1).max(120),
    editableFields: z.array(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/)).max(100),
  }).strict()).max(100),
}).strict();

export function permissionsForClientCmsRole(role: ClientCmsRole): ReadonlySet<ClientCmsPermission> {
  if (role === "client_admin") return new Set(clientCmsPermissionSchema.options);
  return new Set(["content.read", "leads.read", "media.read", "forms.read"]);
}
