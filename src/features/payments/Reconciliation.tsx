import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useSupabaseQuery,
  useShopSettings,
} from "@/hooks/useSupabaseData";
import {
  BadgeCheck,
  AlertTriangle,
  Download,
  Scale,
  Wallet,
  Users2,
  Briefcase,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";

const FMT = (n: number) =>
  `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function today() {
  return new Date().toISOString().split("T")[0];
}

export default function Reconciliation() {
  const { settings } = useShopSettings();
  const { data: payments } = useSupabaseQuery<any>("payments");
  const { data: settlements } = useSupabaseQuery<any>("settlement_cycles");

  const [startDate, setStartDate] = useState(startOfMonth());
  const [endDate, setEndDate] = useState(today());

  const splitEnabled = settings?.revenue_split_enabled !== false;
  const adminPct = splitEnabled
    ? (settings?.admin_share_percent ?? 50) / 100
    : 1;
  const staffPct = splitEnabled
    ? (settings?.staff_share_percent ?? 50) / 100
    : 0;

  const inRange = (iso?: string) => {
    if (!iso) return false;
    const d = iso.split("T")[0];
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  const filteredPayments = useMemo(
    () =>
      (payments || []).filter(
        (p: any) => p.method !== "Refunded" && inRange(p.created_at),
      ),
    [payments, startDate, endDate],
  );

  const filteredSettlements = useMemo(
    () =>
      (settlements || []).filter(
        (s: any) => !s.deleted && inRange(s.settled_at),
      ),
    [settlements, startDate, endDate],
  );

  const derive = (p: any) => {
    const amount = Number(p.amount) || 0;
    const pCost = Number(p.part_cost) || 0;
    const savedAdmin = Number(p.admin_share) || 0;
    const savedStaff = Number(p.staff_share) || 0;
    const usedSaved = p.settled && (savedAdmin > 0 || savedStaff > 0);
    let admin: number;
    let staff: number;
    if (usedSaved) {
      admin = savedAdmin;
      staff = savedStaff;
    } else {
      const net = Math.max(0, amount - pCost);
      admin = pCost + net * adminPct;
      staff = net * staffPct;
    }
    return { amount, pCost, admin, staff };
  };

  const totals = useMemo(() => {
    let jobs = 0,
      revenue = 0,
      partCost = 0,
      admin = 0,
      staff = 0,
      cash = 0,
      upi = 0,
      due = 0,
      settledRev = 0,
      unsettledRev = 0,
      settledCount = 0,
      unsettledCount = 0;

    for (const p of filteredPayments) {
      const m = derive(p);
      jobs += 1;
      revenue += m.amount;
      partCost += m.pCost;
      admin += m.admin;
      staff += m.staff;
      if (p.method === "Cash") cash += m.amount;
      else if (p.method === "UPI/QR") upi += m.amount;
      else if (p.method === "Due") due += m.amount;
      if (p.settled) {
        settledRev += m.amount;
        settledCount += 1;
      } else {
        unsettledRev += m.amount;
        unsettledCount += 1;
      }
    }

    const cycleRevenue = filteredSettlements.reduce(
      (s: number, c: any) => s + Number(c.total_revenue || 0),
      0,
    );
    const cycleAdmin = filteredSettlements.reduce(
      (s: number, c: any) => s + Number(c.admin_share || 0),
      0,
    );
    const cycleStaff = filteredSettlements.reduce(
      (s: number, c: any) => s + Number(c.staff_share || 0),
      0,
    );

    return {
      jobs,
      revenue,
      partCost,
      admin,
      staff,
      cash,
      upi,
      due,
      settledRev,
      unsettledRev,
      settledCount,
      unsettledCount,
      cycleRevenue,
      cycleAdmin,
      cycleStaff,
    };
  }, [filteredPayments, filteredSettlements, adminPct, staffPct]);

  // Verification: admin + staff should equal revenue (within ₹1 tolerance)
  const splitDiff = totals.revenue - (totals.admin + totals.staff);
  const splitOk = Math.abs(splitDiff) < 1;

  // Cycle reconciliation: cycle revenue for the same period should match settled portion
  const cycleDiff = totals.settledRev - totals.cycleRevenue;
  const cycleOk = Math.abs(cycleDiff) < 1;

  // Running balance: unsettled must not be negative
  const balanceOk = totals.unsettledRev >= 0;

  const allOk = splitOk && cycleOk && balanceOk;

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Start date", startDate],
      ["End date", endDate],
      ["Total jobs (payments)", totals.jobs.toString()],
      ["Total revenue", totals.revenue.toFixed(2)],
      ["Total part cost", totals.partCost.toFixed(2)],
      ["Admin share", totals.admin.toFixed(2)],
      ["Staff share", totals.staff.toFixed(2)],
      ["Cash", totals.cash.toFixed(2)],
      ["UPI/QR", totals.upi.toFixed(2)],
      ["Due", totals.due.toFixed(2)],
      ["Settled revenue", totals.settledRev.toFixed(2)],
      ["Unsettled revenue", totals.unsettledRev.toFixed(2)],
      ["Settlement cycles in period", filteredSettlements.length.toString()],
      ["Cycle revenue", totals.cycleRevenue.toFixed(2)],
      ["Cycle admin", totals.cycleAdmin.toFixed(2)],
      ["Cycle staff", totals.cycleStaff.toFixed(2)],
      ["Split verification", splitOk ? "OK" : `Δ ${splitDiff.toFixed(2)}`],
      ["Cycle verification", cycleOk ? "OK" : `Δ ${cycleDiff.toFixed(2)}`],
      ["Balance verification", balanceOk ? "OK" : "Negative unsettled"],
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Reconciliation exported");
  };

  return (
    <MainLayout title="Reconciliation">
      <div className="space-y-4 animate-fade-in">
        {/* Date range + actions */}
        <Card className="shadow-card">
          <CardContent className="py-4 px-6 flex flex-col sm:flex-row items-start sm:items-end gap-3 justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStartDate(startOfMonth());
                    setEndDate(today());
                  }}
                >
                  This month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const d = new Date();
                    setStartDate(
                      new Date(d.getFullYear(), 0, 1)
                        .toISOString()
                        .split("T")[0],
                    );
                    setEndDate(today());
                  }}
                >
                  YTD
                </Button>
              </div>
            </div>
            <Button size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Total Jobs
                </p>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-black mt-1">{totals.jobs}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Settled {totals.settledCount} · Unsettled{" "}
                {totals.unsettledCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Total Revenue
                </p>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-black mt-1">{FMT(totals.revenue)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Parts: {FMT(totals.partCost)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Admin Share
                </p>
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black mt-1 text-primary">
                {FMT(totals.admin)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {(adminPct * 100).toFixed(0)}% of net profit
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Staff Share
                </p>
                <Users2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black mt-1 text-emerald-600">
                {FMT(totals.staff)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {(staffPct * 100).toFixed(0)}% of net profit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment method breakdown */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Payment Method Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 pt-0">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Cash</p>
              <p className="text-lg font-bold">{FMT(totals.cash)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">UPI / QR</p>
              <p className="text-lg font-bold">{FMT(totals.upi)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Due</p>
              <p className="text-lg font-bold text-amber-600">
                {FMT(totals.due)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card
          className={`shadow-card border-l-4 ${
            allOk ? "border-l-emerald-500" : "border-l-destructive"
          }`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4" /> Running Balance Verification
              {allOk ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 ml-auto">
                  <BadgeCheck className="h-3 w-3 mr-1" /> All checks passed
                </Badge>
              ) : (
                <Badge className="bg-rose-100 text-rose-700 border-0 ml-auto">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Mismatch detected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <VerifyRow
              ok={splitOk}
              label="Admin + Staff = Revenue"
              detail={`${FMT(totals.admin)} + ${FMT(totals.staff)} = ${FMT(
                totals.admin + totals.staff,
              )} vs ${FMT(totals.revenue)}`}
              diff={splitDiff}
            />
            <VerifyRow
              ok={cycleOk}
              label="Settlement cycles ≡ Settled revenue"
              detail={`Cycles: ${FMT(
                totals.cycleRevenue,
              )} (${filteredSettlements.length} cycle${
                filteredSettlements.length === 1 ? "" : "s"
              }) vs Settled payments: ${FMT(totals.settledRev)}`}
              diff={cycleDiff}
            />
            <VerifyRow
              ok={balanceOk}
              label="Unsettled balance ≥ 0"
              detail={`Current unsettled pool: ${FMT(totals.unsettledRev)}`}
            />
            <div className="mt-3 rounded-lg bg-muted/40 border p-3 text-xs text-muted-foreground">
              Reset expectation: after settling this range, unsettled should
              drop to <b>{FMT(0)}</b> and a new cycle row of{" "}
              <b>{FMT(totals.unsettledRev)}</b> should appear in Settlement
              history.
            </div>
          </CardContent>
        </Card>

        {/* Cycle table */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Settlement Cycles in Range ({filteredSettlements.length})
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Period</th>
                  <th className="text-left p-3 font-semibold">Jobs</th>
                  <th className="text-left p-3 font-semibold">Revenue</th>
                  <th className="text-left p-3 font-semibold">Admin</th>
                  <th className="text-left p-3 font-semibold">Staff</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">
                    Settled On
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">
                      {s.start_date} → {s.end_date}
                    </td>
                    <td className="p-3">{s.total_jobs}</td>
                    <td className="p-3 font-semibold">
                      {FMT(Number(s.total_revenue))}
                    </td>
                    <td className="p-3">{FMT(Number(s.admin_share))}</td>
                    <td className="p-3">{FMT(Number(s.staff_share))}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {new Date(s.settled_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredSettlements.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No settlements in this range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

function VerifyRow({
  ok,
  label,
  detail,
  diff,
}: {
  ok: boolean;
  label: string;
  detail: string;
  diff?: number;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      {ok ? (
        <BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
      {diff !== undefined && !ok && (
        <Badge variant="destructive" className="shrink-0">
          Δ {FMT(diff)}
        </Badge>
      )}
    </div>
  );
}
