import type { User } from "@supabase/supabase-js";

export const SUPER_ADMIN_EMAIL = "krs715665@gmail.com";
export type AccountType = "shopkeeper" | "wholesaler" | "customer";

export type AppRole =
  | "admin"
  | "staff"
  | "customer"
  | "shopkeeper"
  | "wholesaler";

/**
 * STRICT super-admin check. Only the single hard-coded email
 * (krs715665@gmail.com) is treated as super admin. All other
 * "admin" role users are normal shop admins with no god-mode access.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export function homePathFor(
  accountType: AccountType | null | undefined,
  isSuper: boolean,
  role?: string,
): string {
  if (isSuper) return "/admin";
  if (role === "staff") return "/staff-dashboard";
  switch (accountType) {
    case "customer":
      return "/customer";
    case "wholesaler":
      return "/wholesale";
    case "shopkeeper":
    default:
      return "/dashboard";
  }
}
