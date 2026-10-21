"use client";

import * as React from "react";
import type { FormField } from "@/generated/prisma/client";
import Link from "next/link";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  Input,
  Label,
  Radio,
  Select,
  Textarea,
} from "@/components/ui/form";
import { submitPublicFormAction } from "@/features/public-renderer/actions/public-form.actions";

export function PublicForm({
  formId,
  pageId,
  fields,
  gdprConsentLabel,
  gdprConsentRequired,
  gdprConsentVersion,
  turnstileSiteKey,
  className,
}: {
  formId: string;
  pageId: string;
  fields: FormField[];
  gdprConsentLabel: string;
  gdprConsentRequired: boolean;
  gdprConsentVersion: string;
  turnstileSiteKey?: string | null;
  className?: string;
}) {
  const [status, setStatus] = React.useState<"idle" | "success" | "error">(
    "idle",
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );
  const [formValues, setFormValues] = React.useState<Record<string, string>>(
    {},
  );
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const visibleFields = fields.filter((field) =>
    shouldShowField(field, formValues),
  );

  return (
    <form
      aria-describedby="public-form-status"
      className={`grid gap-4 ${className ?? ""}`}
      noValidate
      onChange={(event) => {
        const target = event.target;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        ) {
          setFormValues(readFormValues(event.currentTarget));
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const validationErrors = validateVisibleFields({
          fields: visibleFields,
          formData,
          gdprConsentRequired,
          turnstileSiteKey,
        });
        setStatus("idle");
        setFieldErrors({});
        setFormError(null);

        if (Object.keys(validationErrors).length > 0) {
          setFieldErrors(validationErrors);
          setFormError("Verifica os campos assinalados.");
          setStatus("error");
          return;
        }

        startTransition(async () => {
          const result = await submitPublicFormAction(formData);

          if (result.ok) {
            form.reset();
            setFormValues({});
            setStatus("success");
            return;
          }

          setFieldErrors(result.fieldErrors);
          setFormError(result.formError);
          setStatus("error");
        });
      }}
    >
      <input name="formId" type="hidden" value={formId} />
      <input name="pageId" type="hidden" value={pageId} />
      <input
        name="gdprConsentVersion"
        type="hidden"
        value={gdprConsentVersion}
      />
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {visibleFields.map((field) => (
        <PublicField
          error={fieldErrors[field.name]}
          field={field}
          key={field.id}
        />
      ))}
      {gdprConsentRequired ? (
        <label className="flex min-h-11 items-start gap-3 text-sm text-[var(--public-muted)]">
          <Checkbox
            aria-invalid={Boolean(fieldErrors.gdprConsent)}
            className="mt-0.5"
            name="gdprConsent"
            required
            value="yes"
          />
          <span>
            {gdprConsentLabel}{" "}
            <Link
              className="font-semibold underline"
              href="/politica-privacidade"
            >
              Politica de Privacidade
            </Link>
          </span>
        </label>
      ) : null}
      {fieldErrors.gdprConsent ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {fieldErrors.gdprConsent}
        </p>
      ) : null}
      {turnstileSiteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="lazyOnload"
          />
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            aria-label="Verificacao anti-spam"
          />
          {fieldErrors.turnstile ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {fieldErrors.turnstile}
            </p>
          ) : null}
        </>
      ) : null}
      <Button type="submit" isLoading={isPending}>
        Enviar
      </Button>
      {status === "success" ? (
        <p
          className="text-sm font-medium text-[var(--public-primary)]"
          id="public-form-status"
          role="status"
        >
          Pedido enviado. Obrigado.
        </p>
      ) : null}
      {status === "error" ? (
        <p
          className="text-sm font-medium text-red-600"
          id="public-form-status"
          role="alert"
        >
          {formError ??
            "Nao foi possivel enviar. Verifica os campos e tenta novamente."}
        </p>
      ) : null}
    </form>
  );
}

function validateVisibleFields({
  fields,
  formData,
  gdprConsentRequired,
  turnstileSiteKey,
}: {
  fields: FormField[];
  formData: FormData;
  gdprConsentRequired: boolean;
  turnstileSiteKey?: string | null;
}) {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (!field.isRequired) continue;
    const values = formData
      .getAll(field.name)
      .filter((value) => typeof value === "string" && value.trim());

    if (values.length === 0) {
      errors[field.name] = "Este campo e obrigatorio.";
    }
  }

  if (gdprConsentRequired && formData.get("gdprConsent") !== "yes") {
    errors.gdprConsent = "Aceita a Politica de Privacidade para enviar.";
  }

  if (turnstileSiteKey && !formData.get("cf-turnstile-response")) {
    errors.turnstile = "Conclui a verificacao anti-spam.";
  }

  return errors;
}

function PublicField({ error, field }: { error?: string; field: FormField }) {
  const id = `public-field-${field.id}`;
  const helpId = field.helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  const common = {
    "aria-describedby": describedBy,
    "aria-invalid": Boolean(error),
    id,
    name: field.name,
    required: field.isRequired,
    placeholder: field.placeholder ?? undefined,
    defaultValue: field.defaultValue ?? undefined,
  };

  return (
    <Field>
      <Label htmlFor={id}>
        {field.label}
        {field.isRequired ? (
          <span className="ml-1 text-red-600" aria-label="obrigatorio">
            *
          </span>
        ) : null}
      </Label>
      {renderField(field, common)}
      {field.helpText ? (
        <p className="text-sm text-[var(--public-muted)]" id={helpId}>
          {field.helpText}
        </p>
      ) : null}
      {error ? (
        <p
          className="text-sm font-medium text-red-600"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </Field>
  );
}

function renderField(
  field: FormField,
  common: {
    id: string;
    name: string;
    required: boolean;
    placeholder?: string;
    defaultValue?: string;
    "aria-describedby"?: string;
    "aria-invalid": boolean;
  },
) {
  const type = field.type;
  const options = optionList(field.options);
  if (type === "TEXTAREA") return <Textarea {...common} />;
  if (type === "SELECT" || type === "MULTI_SELECT") {
    return (
      <Select {...common} multiple={type === "MULTI_SELECT"}>
        <option value="">Selecionar</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }
  if (type === "RADIO" || type === "CHECKBOX") {
    return (
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            className="flex min-h-11 items-center gap-3 text-sm"
            key={option.value}
          >
            {type === "RADIO" ? (
              <Radio
                aria-invalid={common["aria-invalid"]}
                name={common.name}
                required={common.required}
                value={option.value}
              />
            ) : (
              <Checkbox
                aria-invalid={common["aria-invalid"]}
                name={common.name}
                value={option.value}
              />
            )}
            {option.label}
          </label>
        ))}
      </div>
    );
  }
  const inputType =
    type === "EMAIL"
      ? "email"
      : type === "PHONE"
        ? "tel"
        : type === "NUMBER"
          ? "number"
          : type === "DATE"
            ? "date"
            : "text";
  return <Input {...common} type={inputType} />;
}

function readFormValues(form: HTMLFormElement) {
  const formData = new FormData(form);
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}

function shouldShowField(field: FormField, values: Record<string, string>) {
  if (!field.isVisible) return false;
  const rules = conditionalRules(field.conditionalLogic);
  if (rules.length === 0) return true;

  return rules.every((rule) => {
    const currentValue = values[rule.field] ?? "";
    const matches =
      rule.operator === "equals"
        ? currentValue === (rule.value ?? "")
        : rule.operator === "not_equals"
          ? currentValue !== (rule.value ?? "")
          : rule.operator === "contains"
            ? currentValue.includes(rule.value ?? "")
            : rule.operator === "empty"
              ? currentValue.length === 0
              : currentValue.length > 0;

    return rule.action === "hide" ? !matches : matches;
  });
}

function conditionalRules(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (
      rule,
    ): rule is {
      field: string;
      operator: "equals" | "not_equals" | "contains" | "empty" | "not_empty";
      value?: string;
      action: "show" | "hide" | "require" | "disable";
    } =>
      Boolean(rule) &&
      typeof rule === "object" &&
      typeof (rule as { field?: unknown }).field === "string" &&
      typeof (rule as { operator?: unknown }).operator === "string" &&
      typeof (rule as { action?: unknown }).action === "string",
  );
}

function optionList(options: unknown) {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (typeof option === "string") return { label: option, value: option };
      if (option && typeof option === "object") {
        const record = option as Record<string, unknown>;
        const label = String(record.label ?? record.value ?? "");
        const value = String(record.value ?? record.label ?? "");
        if (label && value) return { label, value };
      }
      return null;
    })
    .filter((option): option is { label: string; value: string } =>
      Boolean(option),
    );
}
