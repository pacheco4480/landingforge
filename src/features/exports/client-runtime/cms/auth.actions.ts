"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "./auth";
import { requestClientCmsPasswordReset, resetClientCmsPassword } from "./password-reset.service";

export async function clientCmsLoginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/cms",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/cms/login?error=invalid");
    throw error;
  }
}

export async function clientCmsLogoutAction() {
  await signOut({ redirectTo: "/cms/login" });
}

export async function clientCmsRequestPasswordResetAction(formData: FormData) {
  await requestClientCmsPasswordReset(String(formData.get("email") ?? ""));
  redirect("/cms/forgot-password?sent=true");
}

export async function clientCmsResetPasswordAction(formData: FormData) {
  const success = await resetClientCmsPassword(
    String(formData.get("token") ?? ""),
    String(formData.get("password") ?? ""),
  );
  redirect(success ? "/cms/login?reset=true" : "/cms/reset-password?error=invalid");
}
