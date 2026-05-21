import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type TableName =
  | "customers"
  | "repair_jobs"
  | "payments"
  | "settlement_cycles"
  | "inventory"
  | "shop_settings"
  | "activity_log"
  | "sells"
  | "payment_submissions"
  | "wallets"
  | "wallet_transactions"
  | "withdraw_requests"
  | "profiles"
  | "customer_payments"
  | "payment_links"
  | "payment_refunds"
  | "message_logs"
  | "customer_feedback"
  | "notifications"
  | "erp_expenses"
  | "erp_leads"
  | "erp_tasks"
  | "user_roles"
  | "features"
  | "whatsapp_config"
  | "staff_members"
  | "staff_job_assignments"
  | "staff_salary_records"
  | "service_bookings"
<<<<<<< HEAD
  | "system_config"
  | "shops"
  | "invoices"
  | "audit_logs";
=======
  | "system_config";
>>>>>>> c408fdbab0c70d405e0ef64a0ca7825de86b9241

import { useQuery } from "@tanstack/react-query";
import { get as idbGet, set as idbSet, createStore } from "idb-keyval";

const offlineStore = createStore("rx-supabase-cache", "kv");

export function useSupabaseQuery<T>(table: TableName, includeDeleted = false) {
<<<<<<< HEAD
  const { user, role, shopId } = useAuth();
=======
  const { user } = useAuth();
>>>>>>> c408fdbab0c70d405e0ef64a0ca7825de86b9241
  const cacheKey = `${table}:${user?.id || "anon"}:${includeDeleted ? 1 : 0}`;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [table, user?.id, includeDeleted, role, shopId],
    queryFn: async () => {
      if (!user) return [];
      let query = (supabase as any).from(table).select("*") as any;
<<<<<<< HEAD
      
      const tablesWithShopId = ["repair_jobs", "customers", "inventory", "invoices", "staff_members"];

      if (role === "shopkeeper" && tablesWithShopId.includes(table) && shopId) {
        query = query.eq("shop_id", shopId);
      } else {
        const shopUserIdTables = ["staff_members", "staff_job_assignments", "staff_salary_records"];
        if (shopUserIdTables.includes(table)) {
          query = query.eq("shop_user_id", user.id);
        } else if (!["customer_feedback", "system_config", "features", "shops", "profiles"].includes(table)) {
          query = query.eq("user_id", user.id);
        }
=======
      const shopUserIdTables = ["staff_members", "staff_job_assignments", "staff_salary_records"];
      if (shopUserIdTables.includes(table)) {
        query = query.eq("shop_user_id", user.id);
      } else if (!["customer_feedback", "system_config", "features"].includes(table)) {
        query = query.eq("user_id", user.id);
>>>>>>> c408fdbab0c70d405e0ef64a0ca7825de86b9241
      }

      if (
        !includeDeleted &&
        ![
          "activity_log",
          "shop_settings",
          "payment_submissions",
          "wallets",
          "wallet_transactions",
          "withdraw_requests",
          "profiles",
          "customer_payments",
          "payment_links",
          "payment_refunds",
          "message_logs",
          "customer_feedback",
          "notifications",
          "features",
          "whatsapp_config",
          "staff_members",
          "staff_job_assignments",
          "staff_salary_records",
          "service_bookings",
          "system_config",
          "erp_expenses",
          "erp_leads",
          "erp_tasks",
          "user_roles",
        ].includes(table)
      ) {
        query = query.eq("deleted", false);
      }
      query = query.order("created_at", { ascending: false });
      try {
        const { data: result, error } = await query;
        if (error) {
          if (error.code !== "PGRST116") {
            console.error(`Query error on ${table}:`, error);
          }
          // fall back to cached
          const cached = (await idbGet(cacheKey, offlineStore)) as T[] | undefined;
          return cached ?? [];
        }
        const rows = (result as T[]) ?? [];
        // persist to offline cache (fire-and-forget)
        idbSet(cacheKey, rows, offlineStore).catch(() => {});
        return rows;
      } catch (e) {
        const cached = (await idbGet(cacheKey, offlineStore)) as T[] | undefined;
        if (cached) return cached;
        throw e;
      }
    },
    enabled: !!user,
  });

  return { data: data || [], loading: isLoading, refetch };
}

export function useActivityLog() {
  const { user } = useAuth();

  const logAction = useCallback(
    async (
      action: string,
      entityType: string,
      entityId?: string,
      entityName?: string,
      details?: Record<string, unknown>,
    ) => {
      if (!user) return;
      await (supabase as any).from("activity_log").insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details: details as any,
      });
    },
    [user],
  );

  return { logAction };
}

export function useSoftDelete() {
  const { logAction } = useActivityLog();

  const softDelete = useCallback(
    async (table: TableName, id: string, entityName?: string) => {
      const { error } = await (supabase as any)
        .from(table)
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) {
        toast.error("Delete failed");
        return false;
      }
      await logAction("deleted", table, id, entityName);
      return true;
    },
    [logAction],
  );

  const restore = useCallback(
    async (table: TableName, id: string, entityName?: string) => {
      const { error } = await (supabase as any)
        .from(table)
        .update({
          deleted: false,
          deleted_at: null,
        })
        .eq("id", id);
      if (error) {
        toast.error("Restore failed");
        return false;
      }
      await logAction("restored", table, id, entityName);
      return true;
    },
    [logAction],
  );

  const permanentDelete = useCallback(
    async (table: TableName, id: string, entityName?: string) => {
      const { error } = await (supabase as any).from(table).delete().eq("id", id);
      if (error) {
        toast.error("Permanent delete failed");
        return false;
      }
      await logAction("permanently_deleted", table, id, entityName);
      return true;
    },
    [logAction],
  );

  return { softDelete, restore, permanentDelete };
}

export function useShopSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("shop_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSettings(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!user) return false;
      let payload = { user_id: user.id, ...updates } as any;
      if (settings?.id) {
        payload.id = settings.id;
      }

      const { error } = await supabase
        .from("shop_settings")
        .upsert(payload, { onConflict: "user_id" });
      if (error) {
        toast.error("Failed to save: " + error.message);
        return false;
      }
      await fetchSettings();
      return true;
    },
    [user, settings, fetchSettings],
  );

  return { settings, loading, saveSettings, refetch: fetchSettings };
}

export async function getNextJobId(
  userId: string,
  brand: string = "GEN",
): Promise<string> {
  const { data, error } = await supabase.rpc("next_job_id", {
    _user_id: userId,
    _brand: brand,
  });
  if (error) throw error;
  return data as string;
}
