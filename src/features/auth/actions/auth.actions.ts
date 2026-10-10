"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/auth";
import { resetPasswordSchema } from "@/features/auth/schemas/auth.schema";
import { recordAuthEvent } from "@/features/auth/services/auth-audit.service";
import {
  requestPasswordReset,
  resetPassword,
} from "@/features/auth/services/password-reset.service";
import {
  SystemLogLevel,
  SystemLogSource,
} from "@/generated/prisma/client";
import { logMonitoringEvent } from "@/features/monitoring/services/logger.service";
import { assertRateLimit } from "@/lib/security/rate-limiter";

function safeCallbackUrl(value: FormDataEntryValue | null) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  await assertRateLimit({ action: "login", key: email || "anonymous" });
  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=invalid");
    await logMonitoringEvent({
      level: SystemLogLevel.ERROR,
      source: SystemLogSource.AUTH,
      error,
      action: "auth.login",
      metadata: { email },
    });
    throw error;
  }
}

export async function logoutAction() {
  const session = await auth();
  if (session?.user.id) await recordAuthEvent("user.logout", session.user.id);
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  await assertRateLimit({
    action: "password-reset",
    key: email || "anonymous",
  });
  await requestPasswordReset(email);
  redirect("/forgot-password?sent=true");
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) redirect("/reset-password?error=invalid");
  const success = await resetPassword(parsed.data.token, parsed.data.password);
  redirect(success ? "/login?reset=true" : "/reset-password?error=invalid");
}
