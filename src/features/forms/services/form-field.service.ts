import { Prisma } from "@/generated/prisma/client";
import { formFieldSchema } from "@/features/forms/schemas/form-field.schema";
import { db } from "@/lib/db";

export async function saveFormField(input: unknown, userId: string) {
  const data = formFieldSchema.parse(input);
  const values = {
    formId: data.formId,
    label: data.label,
    name: data.name,
    type: data.type,
    placeholder: data.placeholder || null,
    helpText: data.helpText || null,
    defaultValue: data.defaultValue || null,
    options: data.options as Prisma.InputJsonValue,
    validation: data.validation as Prisma.InputJsonValue,
    conditionalLogic: data.conditionalLogic as Prisma.InputJsonValue,
    isRequired: data.isRequired,
    isVisible: data.isVisible,
  };
  const field = data.id
    ? await db.formField.update({ where: { id: data.id }, data: values })
    : await db.formField.create({
        data: {
          ...values,
          sortOrder: await nextSortOrder(data.formId),
        },
      });
  await auditField(
    userId,
    data.id ? "form_field.update" : "form_field.create",
    field.id,
    {
      formId: field.formId,
      name: field.name,
    },
  );
  return field;
}

export async function deleteFormField(id: string, userId: string) {
  const field = await db.formField.delete({ where: { id } });
  await auditField(userId, "form_field.delete", id, { formId: field.formId });
  return field;
}

export async function moveFormField(
  id: string,
  direction: "up" | "down",
  userId: string,
) {
  const field = await db.formField.findUniqueOrThrow({ where: { id } });
  const sibling = await db.formField.findFirst({
    where: {
      formId: field.formId,
      sortOrder:
        direction === "up" ? { lt: field.sortOrder } : { gt: field.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!sibling) return field;
  await db.$transaction([
    db.formField.update({
      where: { id: field.id },
      data: { sortOrder: sibling.sortOrder },
    }),
    db.formField.update({
      where: { id: sibling.id },
      data: { sortOrder: field.sortOrder },
    }),
  ]);
  await auditField(userId, "form_field.move", id, { direction });
  return field;
}

async function nextSortOrder(formId: string) {
  const last = await db.formField.findFirst({
    where: { formId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

async function auditField(
  userId: string,
  action: string,
  entityId: string,
  values: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      entityType: "form_field",
      entityId,
      newValues: values as Prisma.InputJsonValue,
    },
  });
}
