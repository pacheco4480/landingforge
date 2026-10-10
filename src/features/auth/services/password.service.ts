import { hash, verify } from "argon2";

import { passwordSchema } from "@/features/auth/schemas/auth.schema";

export function validatePassword(password: string) {
  return passwordSchema.safeParse(password);
}

export async function hashPassword(password: string) {
  return hash(password, { type: 2 });
}

export async function verifyPassword(hashValue: string, password: string) {
  return verify(hashValue, password);
}
