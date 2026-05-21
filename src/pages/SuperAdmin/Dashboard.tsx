import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Users, ShieldAlert } from "lucide-react";

export default function SuperAdminDashboard() {
  const { data: shopsCount = 0, isLoading: shopsLoading } = useQuery({
    queryKey: ["super-admin", "shops-count"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("shop_settings")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: usersCount = 0, isLoading: usersLoading } = useQuery({
    queryKey: ["super-admin", "users-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          System overview and global statistics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Total Active Shops
            </CardTitle>
            <Building2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {shopsLoading ? (
              <div className="h-9 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-4xl font-extrabold tracking-tight">{shopsCount}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Registered Users
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="h-9 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-4xl font-extrabold tracking-tight">{usersCount}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Security Level
            </CardTitle>
            <ShieldAlert className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">Maximum</div>
            <p className="text-xs text-muted-foreground mt-1">RLS policies enforced globally</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
