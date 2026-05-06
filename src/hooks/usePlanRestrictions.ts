import { useAuth } from "@/context/AuthContext";
import { useSupabaseQuery } from "./useSupabaseData";
import { useMemo } from "react";

export type PlanType =
  | "free"
  | "basic"
  | "standard"
  | "enterprise"
  | "premium"
  | "pro";

export const PLAN_LIMITS = {
  free: {
    maxJobs: 50,
    maxEmployees: 1,
    hasInventory: true,
    hasWhatsApp: false,
    hasReports: true,
    hasEnterprise: false,
    hasBranches: false,
  },
  basic: {
    maxJobs: 1000,
    maxEmployees: 2,
    hasInventory: true,
    hasWhatsApp: true,
    hasReports: true,
    hasEnterprise: false,
    hasBranches: false,
  },
  pro: {
    // 'pro' was used in some places as a general paid tier
    maxJobs: Infinity,
    maxEmployees: 6,
    hasInventory: true,
    hasWhatsApp: true,
    hasReports: true,
    hasEnterprise: true,
    hasBranches: true,
  },
  standard: {
    maxJobs: Infinity,
    maxEmployees: 6,
    hasInventory: true,
    hasWhatsApp: true,
    hasReports: true,
    hasEnterprise: true,
    hasBranches: false,
  },
  enterprise: {
    maxJobs: Infinity,
    maxEmployees: 12,
    hasInventory: true,
    hasWhatsApp: true,
    hasReports: true,
    hasEnterprise: true,
    hasBranches: true,
  },
  premium: {
    maxJobs: Infinity,
    maxEmployees: Infinity,
    hasInventory: true,
    hasWhatsApp: true,
    hasReports: true,
    hasEnterprise: true,
    hasBranches: true,
  },
};

export function usePlanRestrictions() {
  const { user, isSuperAdmin } = useAuth();
  // We can fetch the plan from profiles or subscriptions
  const { data: profiles } = useSupabaseQuery<any>("profiles");

  const userProfile = useMemo(() => {
    if (!user || !profiles.length) return null;
    return profiles.find((p: any) => p.user_id === user.id);
  }, [user, profiles]);

  const planType = (userProfile?.plan_type || "free").toLowerCase() as PlanType;
  const limits = PLAN_LIMITS[planType] || PLAN_LIMITS.free;

  const isFeatureLocked = (feature: keyof typeof PLAN_LIMITS.free) => {
    if (isSuperAdmin) return false;
    return !limits[feature];
  };

  return {
    planType,
    limits,
    isFeatureLocked,
    userProfile,
  };
}
