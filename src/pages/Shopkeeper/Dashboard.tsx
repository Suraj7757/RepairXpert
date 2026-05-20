import React, { useMemo } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wrench, Users, AlertTriangle, AreaChart as ChartIcon } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ShopkeeperDashboard() {
  const { data: jobs = [], loading: jobsLoading } = useSupabaseQuery<any>("repair_jobs");
  const { data: customers = [], loading: customersLoading } = useSupabaseQuery<any>("customers");
  const { data: inventory = [], loading: inventoryLoading } = useSupabaseQuery<any>("inventory");

  const activeRepairs = useMemo(() => {
    return jobs.filter((j: any) => j.status !== "Delivered" && j.status !== "Cancelled").length;
  }, [jobs]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((i: any) => (i.quantity || 0) <= (i.min_stock || 5)).length;
  }, [inventory]);

  // Aggregate job counts by day for the chart
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const counts: Record<string, number> = {};
    last7Days.forEach((date) => {
      counts[date] = 0;
    });

    jobs.forEach((job: any) => {
      const createdDate = job.created_at?.split("T")[0];
      if (createdDate && createdDate in counts) {
        counts[createdDate] += 1;
      }
    });

    return last7Days.map((date) => {
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      });
      return {
        name: formattedDate,
        Jobs: counts[date],
      };
    });
  }, [jobs]);

  const loading = jobsLoading || customersLoading || inventoryLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Shop Dashboard</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Real-time metrics for your shop operations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Active Repairs
            </CardTitle>
            <Wrench className="h-5 w-5 text-primary animate-pulse" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-4xl font-extrabold tracking-tight">{activeRepairs}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-medium">In-progress repair requests</p>
          </CardContent>
        </Card>

        <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-4xl font-extrabold tracking-tight">{customers.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-medium">Registered in your database</p>
          </CardContent>
        </Card>

        <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? "text-rose-500 animate-bounce" : "text-emerald-500"}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-4xl font-extrabold tracking-tight">{lowStockCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 font-medium">Items requiring reorder alert</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Job Volume Trend</CardTitle>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Daily incoming jobs registered over the last 7 days
            </p>
          </div>
          <ChartIcon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="name" className="text-xs fill-muted-foreground font-semibold" />
              <YAxis className="text-xs fill-muted-foreground font-semibold" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderColor: "rgba(0, 0, 0, 0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              />
              <Area
                type="monotone"
                dataKey="Jobs"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorJobs)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
