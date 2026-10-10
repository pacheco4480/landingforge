import { Field, Input, Label } from "@/components/ui/form";

export function AuthField({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: "email" | "password";
  autoComplete: string;
}) {
  const id = `auth-${name}`;

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
      />
    </Field>
  );
}
