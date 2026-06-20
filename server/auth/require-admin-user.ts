import { env } from "@/server/config/env";
import { requireUser } from "@/server/auth/require-user";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAdminEmails() {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return getAdminEmails().includes(normalizeEmail(email));
}

export async function requireAdminUser() {
  const user = await requireUser();

  if (!isAdminEmail(user.email)) {
    throw new Error("Forbidden");
  }

  return user;
}
