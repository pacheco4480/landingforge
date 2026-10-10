import { FormStatus, Prisma } from "@/generated/prisma/client";
import { getEditablePageOptions } from "@/features/content/services/page.service";
import { formSchema } from "@/features/forms/schemas/form.schema";
import {
  formTemplates,
  type FormTemplateKey,
} from "@/features/forms/services/form-template.service";
import { db } from "@/lib/db";

export async function getFormsWorkspace(
  userRoles: readonly string[],
  formId?: string,
) {
  const [pages, forms] = await Promise.all([
    getEditablePageOptions(userRoles),
    db.form.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        page: { select: { title: true, slug: true } },
        _count: { select: { fields: true, submissions: true } },
      },
    }),
  ]);

  const selectedFormId = formId ?? forms[0]?.id;
  const selectedForm = selectedFormId
    ? await db.form.findUnique({
        where: { id: selectedFormId },
        include: {
          fields: { orderBy: { sortOrder: "asc" } },
          submissions: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      })
    : null;

  return { pages, forms, selectedForm };
}

export async function saveForm(input: unknown, userId: string) {
  const data = formSchema.parse(input);
  const values = {
    pageId: data.pageId || null,
    thankYouPageId: data.thankYouPageId || null,
    name: data.name,
    key: data.key,
    type: data.type,
    status: data.status,
    description: data.description || null,
    successMessage: data.successMessage,
    errorMessage: data.errorMessage,
    recipientEmail: data.recipientEmail,
    redirectUrl: data.redirectUrl || null,
    gdprConsentRequired: data.gdprConsentRequired,
    gdprConsentLabel: data.gdprConsentLabel,
    gdprConsentVersion: data.gdprConsentVersion,
    isActive: data.status === FormStatus.PUBLISHED,
  };

  const form = data.id
    ? await db.form.update({ where: { id: data.id }, data: values })
    : await db.form.create({ data: values });

  await auditForm(userId, data.id ? "form.update" : "form.create", form.id, {
    name: form.name,
    status: form.status,
  });
  return form;
}

export async function duplicateForm(id: string, userId: string) {
  return db.$transaction(async (tx) => {
    const source = await tx.form.findUniqueOrThrow({
      where: { id },
      include: { fields: true },
    });
    const suffix = Date.now();
    const form = await tx.form.create({
      data: {
        pageId: source.pageId,
        thankYouPageId: source.thankYouPageId,
        name: `${source.name} Copy`,
        key: `${source.key}-copy-${suffix}`,
        type: source.type,
        status: FormStatus.DRAFT,
        description: source.description,
        successMessage: source.successMessage,
        errorMessage: source.errorMessage,
        recipientEmail: source.recipientEmail,
        redirectUrl: source.redirectUrl,
        gdprConsentRequired: source.gdprConsentRequired,
        gdprConsentLabel: source.gdprConsentLabel,
        gdprConsentVersion: source.gdprConsentVersion,
      },
    });
    for (const field of source.fields) {
      await tx.formField.create({
        data: {
          formId: form.id,
          label: field.label,
          name: field.name,
          type: field.type,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          options: field.options as Prisma.InputJsonValue,
          validation: field.validation as Prisma.InputJsonValue,
          conditionalLogic: field.conditionalLogic as Prisma.InputJsonValue,
          sortOrder: field.sortOrder,
          isRequired: field.isRequired,
          isVisible: field.isVisible,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        userId,
        action: "form.duplicate",
        entityType: "form",
        entityId: form.id,
        newValues: { sourceId: id },
      },
    });
    return form;
  });
}

export async function archiveForm(id: string, userId: string) {
  const form = await db.form.update({
    where: { id },
    data: { status: FormStatus.ARCHIVED, isActive: false },
  });
  await auditForm(userId, "form.archive", form.id, { status: form.status });
  return form;
}

export async function deleteForm(id: string, userId: string) {
  const form = await db.form.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: FormStatus.ARCHIVED,
      isActive: false,
    },
  });
  await auditForm(userId, "form.delete", form.id, {
    deletedAt: form.deletedAt,
  });
  return form;
}

export async function createFormFromTemplate(
  templateKey: FormTemplateKey,
  pageId: string | null,
  recipientEmail: string,
  userId: string,
) {
  const template = formTemplates[templateKey];
  return db.$transaction(async (tx) => {
    const form = await tx.form.create({
      data: {
        pageId,
        name: template.name,
        key: `${template.key}-${Date.now()}`,
        type: template.type,
        status: FormStatus.DRAFT,
        successMessage: "Thank you. We will contact you shortly.",
        errorMessage: "We could not send your request. Please try again.",
        recipientEmail,
        gdprConsentRequired: true,
        gdprConsentLabel: "Li e aceito a Politica de Privacidade.",
        gdprConsentVersion: "1.0",
      },
    });
    for (const [
      sortOrder,
      [name, label, type, isRequired],
    ] of template.fields.entries()) {
      await tx.formField.create({
        data: { formId: form.id, name, label, type, isRequired, sortOrder },
      });
    }
    await tx.auditLog.create({
      data: {
        userId,
        action: "form.template.create",
        entityType: "form",
        entityId: form.id,
        newValues: { templateKey },
      },
    });
    return form;
  });
}

async function auditForm(
  userId: string,
  action: string,
  entityId: string,
  values: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      entityType: "form",
      entityId,
      newValues: values as Prisma.InputJsonValue,
    },
  });
}
