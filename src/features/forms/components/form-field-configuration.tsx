"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import type { FormFieldType } from "@/generated/prisma/client";
import type { ConditionalLogicRule } from "@/features/forms/schemas/conditional-logic.schema";

const FIELD_TYPE = {
  TEXT: "TEXT",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  NUMBER: "NUMBER",
  TEXTAREA: "TEXTAREA",
  SELECT: "SELECT",
  RADIO: "RADIO",
  CHECKBOX: "CHECKBOX",
  MULTI_SELECT: "MULTI_SELECT",
  DATE: "DATE",
  FILE: "FILE",
  HIDDEN: "HIDDEN",
} as const satisfies Record<string, FormFieldType>;
const fieldTypes = Object.values(FIELD_TYPE) as FormFieldType[];

type Option = { label: string; value: string; [key: string]: unknown };
type FieldReference = { name: string; label: string };
type ValidationValues = Record<string, unknown>;

const operators = [
  ["equals", "é igual a"],
  ["not_equals", "é diferente de"],
  ["contains", "contém"],
  ["empty", "está vazio"],
  ["not_empty", "não está vazio"],
] as const;

const actions = [
  ["show", "Mostrar campo"],
  ["hide", "Ocultar campo"],
  ["require", "Tornar obrigatório"],
] as const;
const legacyActions = ["disable"] as const;

const choiceFieldTypes: FormFieldType[] = [
  FIELD_TYPE.SELECT,
  FIELD_TYPE.RADIO,
  FIELD_TYPE.MULTI_SELECT,
];
const validationFieldTypes: FormFieldType[] = [
  FIELD_TYPE.TEXT,
  FIELD_TYPE.TEXTAREA,
  FIELD_TYPE.NUMBER,
  FIELD_TYPE.EMAIL,
  FIELD_TYPE.PHONE,
];

export function FormFieldConfiguration({
  fieldType,
  options: initialOptions,
  validation: initialValidation,
  conditionalLogic: initialRules,
  fields,
}: {
  fieldType: FormFieldType;
  options: unknown;
  validation: unknown;
  conditionalLogic: unknown;
  fields: FieldReference[];
}) {
  const id = useId();
  const [type, setType] = useState(fieldType);
  const [options, setOptions] = useState(() => readOptions(initialOptions));
  const [validation, setValidation] = useState(() => readValidation(initialValidation));
  const [rules, setRules] = useState(() => readRules(initialRules));
  const hasChoices = choiceFieldTypes.includes(type);
  const validationBase = readRecord(initialValidation);

  function updateValidation(key: string, value: string) {
    setValidation((current) => ({
      ...current,
      [key]: value === "" ? undefined : Number(value),
    }));
  }

  function updateRule(index: number, update: Partial<ConditionalLogicRule>) {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...update } : rule,
      ),
    );
  }

  return (
    <div className="grid gap-5">
      <input type="hidden" name="options" value={JSON.stringify(options)} />
      <input type="hidden" name="type" value={type} />
      <input
        type="hidden"
        name="validation"
        value={JSON.stringify({ ...validationBase, ...validation })}
      />
      <input
        type="hidden"
        name="conditionalLogic"
        value={JSON.stringify(rules)}
      />

      <Field>
        <Label htmlFor={`${id}-type`}>Tipo de campo</Label>
        <Select aria-describedby={`${id}-type-help`} id={`${id}-type`} value={type} onChange={(event) => setType(event.target.value as FormFieldType)}>
          {fieldTypes.map((item) => <option key={item} value={item}>{fieldTypeLabel(item)}</option>)}
        </Select>
        <p className="text-muted-foreground text-xs" id={`${id}-type-help`}>Define o tipo de campo apresentado no formulário público.</p>
      </Field>

      {hasChoices ? (
        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold">Opções</legend>
          <p className="text-muted-foreground text-sm">
            Define o texto e o valor de cada opção. O valor é a chave guardada
            na submissão.
          </p>
          {options.map((option, index) => (
            <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_1fr_auto]" key={`${id}-option-${index}`}>
              <Field>
                <Label htmlFor={`${id}-option-label-${index}`}>Texto da opção {index + 1}</Label>
                <Input
                  id={`${id}-option-label-${index}`}
                  maxLength={80}
                  value={option.label}
                  onChange={(event) =>
                    setOptions((current) => current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, label: event.target.value } : item,
                    ))
                  }
                />
              </Field>
              <Field>
                <Label htmlFor={`${id}-option-value-${index}`}>Valor guardado</Label>
                <Input
                  id={`${id}-option-value-${index}`}
                  maxLength={80}
                  value={option.value}
                  onChange={(event) =>
                    setOptions((current) => current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, value: event.target.value } : item,
                    ))
                  }
                />
              </Field>
              <Button
                aria-label={`Remover opção ${index + 1}`}
                className="self-end"
                onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                type="button"
                variant="outline"
              >
                Remover
              </Button>
            </div>
          ))}
          <div>
            <Button
              disabled={options.length >= 30}
              onClick={() => setOptions((current) => [...current, { label: "", value: "" }])}
              type="button"
              variant="outline"
            >
              Adicionar opção
            </Button>
            <p className="text-muted-foreground mt-1 text-xs">
              {options.length}/30 opções
            </p>
          </div>
        </fieldset>
      ) : fieldType === FIELD_TYPE.CHECKBOX ? (
        <p className="text-muted-foreground text-sm">
          Este tipo representa uma escolha booleana. Usa o rótulo do campo para
          descrever a opção.
        </p>
      ) : null}

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">Validação comum</legend>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {type === FIELD_TYPE.TEXT || type === FIELD_TYPE.TEXTAREA ? (
            <>
              <NumberField id={`${id}-min-length`} label="Comprimento mínimo" value={validation.minLength} min={0} onChange={(value) => updateValidation("minLength", value)} />
              <NumberField id={`${id}-max-length`} label="Comprimento máximo" value={validation.maxLength} min={1} onChange={(value) => updateValidation("maxLength", value)} />
            </>
          ) : null}
          {type === FIELD_TYPE.NUMBER ? (
            <>
              <NumberField id={`${id}-min`} label="Valor mínimo" value={validation.min} onChange={(value) => updateValidation("min", value)} />
              <NumberField id={`${id}-max`} label="Valor máximo" value={validation.max} onChange={(value) => updateValidation("max", value)} />
            </>
          ) : null}
          {type === FIELD_TYPE.EMAIL ? (
            <p className="text-muted-foreground text-sm sm:col-span-2">
              O formato de email é validado automaticamente.
            </p>
          ) : null}
          {type === FIELD_TYPE.PHONE ? (
            <p className="text-muted-foreground text-sm sm:col-span-2">
              O formato de telefone é validado automaticamente.
            </p>
          ) : null}
          {!validationFieldTypes.includes(type) ? (
            <p className="text-muted-foreground text-sm sm:col-span-2">
              Este tipo não tem limites adicionais de comprimento ou valor.
            </p>
          ) : null}
        </div>
        <details className="rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">Validação avançada</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor={`${id}-regex`}>Expressão regular</Label>
              <Input id={`${id}-regex`} maxLength={300} value={String(validation.regex ?? "")} onChange={(event) => setValidation((current) => ({ ...current, regex: event.target.value || undefined }))} />
            </Field>
            <Field>
              <Label htmlFor={`${id}-validation-message`}>Mensagem para este formato</Label>
              <Input id={`${id}-validation-message`} maxLength={160} value={String(validation.message ?? "")} onChange={(event) => setValidation((current) => ({ ...current, message: event.target.value || undefined }))} />
            </Field>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            A expressão deve ser compatível com JavaScript e será validada no servidor.
          </p>
        </details>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">Regras condicionais</legend>
        <p className="text-muted-foreground text-sm">
          As regras usam o valor de outro campo deste formulário. Todas as
          regras configuradas têm de corresponder.
        </p>
        {rules.map((rule, index) => {
          const ruleId = `${id}-rule-${index}`;
          const knownField = fields.some((candidate) => candidate.name === rule.field);
          return (
            <div className="grid min-w-0 gap-3 rounded-md border p-3 sm:grid-cols-2 xl:grid-cols-4" key={ruleId}>
              <Field>
                <Label htmlFor={`${ruleId}-field`}>Campo de referência</Label>
                <Select id={`${ruleId}-field`} value={rule.field} onChange={(event) => updateRule(index, { field: event.target.value })}>
                  {!knownField ? <option value={rule.field}>Campo indisponível: {rule.field}</option> : null}
                  {fields.map((candidate) => <option key={candidate.name} value={candidate.name}>{candidate.label}</option>)}
                </Select>
              </Field>
              <Field>
                <Label htmlFor={`${ruleId}-operator`}>Condição</Label>
                <Select id={`${ruleId}-operator`} value={rule.operator} onChange={(event) => updateRule(index, { operator: event.target.value as ConditionalLogicRule["operator"] })}>
                  {operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </Field>
              {rule.operator === "empty" || rule.operator === "not_empty" ? (
                <p className="text-muted-foreground self-center text-sm">Não é necessário indicar um valor.</p>
              ) : (
                <Field>
                  <Label htmlFor={`${ruleId}-value`}>Valor comparado</Label>
                  <Input id={`${ruleId}-value`} maxLength={200} value={rule.value ?? ""} onChange={(event) => updateRule(index, { value: event.target.value })} />
                </Field>
              )}
              <div className="flex items-end gap-2">
                <Field className="min-w-0 flex-1">
                  <Label htmlFor={`${ruleId}-action`}>Ação</Label>
                  <Select id={`${ruleId}-action`} value={rule.action} onChange={(event) => updateRule(index, { action: event.target.value as ConditionalLogicRule["action"] })}>
                    {!actions.some(([value]) => value === rule.action) ? <option value={rule.action}>Ação existente não aplicada: {rule.action}</option> : null}
                    {actions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                </Field>
                <Button aria-label={`Remover regra ${index + 1}`} onClick={() => setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index))} type="button" variant="outline">
                  Remover
                </Button>
              </div>
            </div>
          );
        })}
        <div>
          <Button
            disabled={fields.length === 0 || rules.length >= 10}
            onClick={() => setRules((current) => [...current, {
              field: fields[0]?.name ?? "",
              operator: "equals",
              value: "",
              action: "show",
            }])}
            type="button"
            variant="outline"
          >
            Adicionar regra
          </Button>
          <p className="text-muted-foreground mt-1 text-xs">{rules.length}/10 regras</p>
        </div>
      </fieldset>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: unknown;
  min?: number;
  max?: number;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} max={max} min={min} onChange={(event) => onChange(event.target.value)} type="number" value={typeof value === "number" ? value : ""} />
    </Field>
  );
}

function readOptions(value: unknown): Option[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isOption).map((option) => ({ ...option }));
}

function isOption(value: unknown): value is Option {
  return value !== null && typeof value === "object" &&
    "label" in value && typeof value.label === "string" &&
    "value" in value && typeof value.value === "string";
}

function readRecord(value: unknown): ValidationValues {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as ValidationValues) }
    : {};
}

function readValidation(value: unknown): ValidationValues {
  return readRecord(value);
}

function readRules(value: unknown): ConditionalLogicRule[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRule).map((rule) => ({ ...rule }));
}

function isRule(value: unknown): value is ConditionalLogicRule {
  return value !== null && typeof value === "object" &&
    "field" in value && typeof value.field === "string" &&
    "operator" in value && operators.some(([operator]) => operator === value.operator) &&
    "action" in value &&
    (actions.some(([action]) => action === value.action) ||
      (legacyActions as readonly unknown[]).includes(value.action));
}

function fieldTypeLabel(type: FormFieldType) {
  const labels: Record<FormFieldType, string> = {
    [FIELD_TYPE.TEXT]: "Texto",
    [FIELD_TYPE.EMAIL]: "Email",
    [FIELD_TYPE.PHONE]: "Telefone",
    [FIELD_TYPE.NUMBER]: "Número",
    [FIELD_TYPE.TEXTAREA]: "Texto longo",
    [FIELD_TYPE.SELECT]: "Lista de seleção",
    [FIELD_TYPE.RADIO]: "Escolha única",
    [FIELD_TYPE.CHECKBOX]: "Caixa de seleção",
    [FIELD_TYPE.MULTI_SELECT]: "Seleção múltipla",
    [FIELD_TYPE.DATE]: "Data",
    [FIELD_TYPE.FILE]: "Ficheiro",
    [FIELD_TYPE.HIDDEN]: "Oculto",
  };
  return labels[type];
}
