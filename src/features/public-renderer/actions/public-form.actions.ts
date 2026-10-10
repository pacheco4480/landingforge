"use server";

import { headers } from "next/headers";

import {
  FormSubmissionValidationError,
  submitForm,
} from "@/features/forms/services/form-submission.service";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function submitPublicFormAction(formData: FormData) {
  const requestHeaders = await headers();
  const formId = value(formData, "formId");
  const pageId = value(formData, "pageId") || null;
  const values = Object.fromEntries(formData.entries());

  try {
    await submitForm(
      {
        formId,
        pageId: pageId ?? undefined,
        ipAddress:
          requestHeaders.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
          undefined,
        userAgent: requestHeaders.get("user-agent") ?? undefined,
        referrer: requestHeaders.get("referer") ?? undefined,
      },
      values,
    );
    return { ok: true, fieldErrors: {}, formError: null };
  } catch (error) {
    if (error instanceof FormSubmissionValidationError) {
      return {
        ok: false,
        fieldErrors: error.fieldErrors,
        formError: error.message,
      };
    }

    return {
      ok: false,
      fieldErrors: {},
      formError:
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível enviar. Tenta novamente.",
    };
  }
}
