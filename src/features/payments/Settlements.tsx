import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  useSupabaseQuery,
  useSoftDelete,
  useShopSettings,
} from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import {
  ArrowLeftRight,
  CheckCircle2,
  Trash2,
  Calculator,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function Settlements() {
  const { user } = useAuth();
  const { settings } = useShopSettings();
  const { data: settlements, refetch: refetchSettlements } =
    useSupabaseQuery<any>("settlement_cycles");
  const { data: payments, refetch: refetchPayments } =
    useSupabaseQuery<any>("payments");
  const { softDelete } = useSoftDelete();

  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [partCosts, setPartCosts] = useState<Record<string, number>>({});

  const filteredUnsettled = payments.filter((p: any) => {
    if (p.settled || p.method === "Refunded" || p.method === "Due") return false;
    const date = p.created_at
      ? new Date(p.created_at).toISOString().split("T")[0]
      : "";
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });

  // Calculate dynamics based on partCosts
  const splitEnabled = settings?.revenue_split_enabled !== false;
  const adminPct = splitEnabled
    ? (settings?.admin_share_percent ?? 50) / 100
    : 1;
  const staffPct = splitEnabled
    ? (settings?.staff_share_percent ?? 50) / 100
    : 0;

  const getJobMetrics = (p: any) => {
    const amount = Number(p.amount) || 0;
    const pCost = partCosts[p.id] || Number(p.part_cost) || 0;
    const netProfit = Math.max(0, amount - pCost);
    const adminShare = pCost + netProfit * adminPct;
    const staffShare = netProfit * staffPct;
    return { amount, pCost, netProfit, adminShare, staffShare };
  };

  const dynamicTotals = filteredUnsettled.reduce(
    (acc, p) => {
      const m = getJobMetrics(p);
      return {
        revenue: acc.revenue + m.amount,
        partCost: acc.partCost + m.pCost,
        admin: acc.admin + m.adminShare,
        staff: acc.staff + m.staffShare,
      };
    },
    { revenue: 0, partCost: 0, admin: 0, staff: 0 },
  );

  const handleSettle = async () => {
    if (!endDate || !user) {
      toast.error("Select end date");
      return;
    }
    if (filteredUnsettled.length === 0) {
      toast.error("No unsettled payments for selected date");
      return;
    }

    // 1. Create settlement cycle
    const { data: cycle, error: cycleErr } = await supabase
      .from("settlement_cycles")
      .insert({
        user_id: user.id,
        start_date: startDate || endDate,
        end_date: endDate,
        total_jobs: filteredUnsettled.length,
        total_revenue: dynamicTotals.revenue,
        admin_share: dynamicTotals.admin,
        staff_share: dynamicTotals.staff,
        settled_by: "Admin",
      })
      .select("id")
      .single();

    if (cycleErr || !cycle) {
      toast.error("Failed to create settlement cycle");
      return;
    }

    // 2. Update each payment individually to save their part_cost and final shares
    const updatePromises = filteredUnsettled.map((p: any) => {
      const m = getJobMetrics(p);
      return supabase
        .from("payments")
        .update({
          settled: true,
          settlement_cycle_id: cycle.id,
          part_cost: m.pCost,
          admin_share: m.adminShare,
          staff_share: m.staffShare,
        })
        .eq("id", p.id);
    });

    await Promise.all(updatePromises);

    refetchSettlements();
    refetchPayments();
    setOpen(false);
    toast.success("Settlement completed successfully!");
  };

  const handleUnsettle = async (s: any) => {
    const confirm = window.confirm(
      `Are you sure you want to unsettle the period ${s.start_date} → ${s.end_date}? This will move all linked jobs back to 'Unsettled' status.`,
    );
    if (!confirm) return;

    // 1. Revert payments
    const { error: payErr } = await supabase
      .from("payments")
      .update({ settled: false, settlement_cycle_id: null })
      .eq("settlement_cycle_id", s.id);

    if (payErr) {
      toast.error("Failed to revert payments");
      return;
    }

    // 2. Delete the cycle
    const { error: cycleErr } = await supabase
      .from("settlement_cycles")
      .delete()
      .eq("id", s.id);
    if (cycleErr) {
      toast.error("Failed to delete settlement cycle");
      return;
    }

    toast.success("Settlement reverted successfully");
    refetchSettlements();
    refetchPayments();
  };

  const updatePartCost = (id: string, val: string) => {
    setPartCosts((prev) => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  return (
    <MainLayout title="Settlement Cycles">
      <div className="space-y-4 animate-fade-in">
        <Card className="shadow-card border-l-4 border-l-warning">
          <CardContent className="py-4 px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Unsettled Balance
                </p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  ₹{dynamicTotals.revenue.toLocaleString()}
                </p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">
                    Admin:{" "}
                    <strong className="text-foreground">
                      ₹{dynamicTotals.admin.toLocaleString()}
                    </strong>
                  </span>
                  <span className="text-muted-foreground">
                    Staff:{" "}
                    <strong className="text-foreground">
                      ₹{dynamicTotals.staff.toLocaleString()}
                    </strong>
                  </span>
                  <span className="text-muted-foreground">
                    Jobs:{" "}
                    <strong className="text-foreground">
                      {filteredUnsettled.length}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="Settle Up To Date"
                  className="w-auto"
                />
                <Button
                  onClick={() => setOpen(true)}
                  disabled={filteredUnsettled.length === 0}
                >
                  <Calculator className="h-4 w-4 mr-1" /> Settle & Calc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" /> Settlement History
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Period</th>
                  <th className="text-left p-3 font-semibold">Jobs</th>
                  <th className="text-left p-3 font-semibold">Revenue</th>
                  <th className="text-left p-3 font-semibold">Admin Share</th>
                  <th className="text-left p-3 font-semibold">Staff Share</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">
                    Settled On
                  </th>
                  <th className="text-left p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s: any) => (
                  <tr
                    key={s.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3 font-medium">
                      {s.start_date} → {s.end_date}
                    </td>
                    <td className="p-3">{s.total_jobs}</td>
                    <td className="p-3 font-semibold">
                      ₹{Number(s.total_revenue).toLocaleString()}
                    </td>
                    <td className="p-3">
                      ₹{Number(s.admin_share).toLocaleString()}
                    </td>
                    <td className="p-3">
                      ₹{Number(s.staff_share).toLocaleString()}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {new Date(s.settled_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => handleUnsettle(s)}
                          title="Unsettle / Revert"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No settlements yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Settle Jobs & Part Costs
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Review unsettled jobs. Enter the cost of parts used to
                accurately calculate Admin and Staff profit shares.
              </p>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <Label>Start Date (Optional)</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left font-semibold">Job ID</th>
                      <th className="p-3 text-left font-semibold">Method</th>
                      <th className="p-3 text-left font-semibold">Revenue</th>
                      <th className="p-3 text-left font-semibold text-primary">
                        Part Cost
                      </th>
                      <th className="p-3 text-left font-semibold">
                        Net Profit
                      </th>
                      <th className="p-3 text-left font-semibold">Staff Cut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnsettled.map((p: any) => {
                      const m = getJobMetrics(p);
                      return (
                        <tr
                          key={p.id}
                          className="border-b last:border-0 hover:bg-muted/20"
                        >
                          <td className="p-3 font-mono font-bold text-xs">
                            {p.job_id}
                          </td>
                          <td className="p-3 text-xs">{p.method}</td>
                          <td className="p-3 font-bold">₹{m.amount}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              className="w-24 h-8 text-xs font-bold"
                              placeholder="0"
                              value={
                                partCosts[p.id] !== undefined
                                  ? partCosts[p.id]
                                  : p.part_cost || ""
                              }
                              onChange={(e) =>
                                updatePartCost(p.id, e.target.value)
                              }
                            />
                          </td>
                          <td className="p-3 text-xs font-semibold text-green-600">
                            ₹{m.netProfit}
                          </td>
                          <td className="p-3 text-xs font-semibold">
                            ₹{m.staffShare.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Total Revenue
                  </p>
                  <p className="text-xl font-black">
                    ₹{dynamicTotals.revenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Total Part Cost
                  </p>
                  <p className="text-xl font-black text-destructive">
                    ₹{dynamicTotals.partCost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Admin Final
                  </p>
                  <p className="text-xl font-black text-primary">
                    ₹{dynamicTotals.admin.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Staff Final
                  </p>
                  <p className="text-xl font-black text-success">
                    ₹{dynamicTotals.staff.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSettle}
                className="bg-success hover:bg-success/90 text-white font-bold"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm & Disburse
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
