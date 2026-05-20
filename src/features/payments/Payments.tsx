import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseQuery, useShopSettings } from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Pencil,
  Check,
  X,
  ShieldCheck,
  MessageCircle,
  Smartphone,
  QrCode,
  RotateCcw,
  CreditCard,
  IndianRupee,
  TrendingUp,
  Clock,
  Printer,
  Share2,
} from "lucide-react";
import PaymentLinkModal from "./PaymentLinkModal";
import RefundModal from "./RefundModal";

type PaymentMethod = "Cash" | "UPI/QR" | "Due";

const methodColors: Record<string, string> = {
  Cash: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "UPI/QR": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Due: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Refunded:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const methodIcons: Record<string, any> = {
  Cash: IndianRupee,
  "UPI/QR": Smartphone,
  Due: Clock,
  Refunded: RotateCcw,
};

export default function Payments() {
  const { user } = useAuth();
  const {
    data: payments,
    loading,
    refetch,
  } = useSupabaseQuery<any>("payments");
  const { settings } = useShopSettings();
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [editMethod, setEditMethod] = useState<PaymentMethod>("Cash");
  const [editQr, setEditQr] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState<any>(null);
  const [payLinkOpen, setPayLinkOpen] = useState(false);
  const [payLinkPayment, setPayLinkPayment] = useState<any>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState<any>(null);

  const filtered = payments.filter(
    (p: any) =>
      (p.job_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.method || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.qr_receiver || "").toLowerCase().includes(search.toLowerCase()),
  );

  const cashTotal = payments
    .filter((p: any) => p.method === "Cash")
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  const upiTotal = payments
    .filter((p: any) => p.method === "UPI/QR")
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  const dueTotal = payments
    .filter((p: any) => p.method === "Due")
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  const refundTotal = payments
    .filter((p: any) => p.method === "Refunded")
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalRevenue = cashTotal + upiTotal + dueTotal - refundTotal;

  const qrTotals: Record<string, number> = {};
  payments
    .filter((p: any) => p.method === "UPI/QR")
    .forEach((p: any) => {
      const key = p.qr_receiver || "Unknown";
      qrTotals[key] = (qrTotals[key] || 0) + Number(p.amount);
    });

  const openEditPayment = (p: any) => {
    setSelectedPayment(p);
    setEditMethod(p.method);
    setEditQr(p.qr_receiver || "");
    setEditAmount(String(p.amount));
    setEditOpen(true);
  };

  const handleEditPayment = async () => {
    if (!selectedPayment || !user || savingEdit) return;
    const amount = parseFloat(editAmount);
    if (!isFinite(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (editMethod === "UPI/QR" && !editQr) {
      toast.error("Select a QR receiver");
      return;
    }
    setSavingEdit(true);
    try {
      const splitEnabled = settings?.revenue_split_enabled !== false;
      const adminPct = splitEnabled
        ? (settings?.admin_share_percent ?? 50) / 100
        : 1;
      const staffPct = splitEnabled
        ? (settings?.staff_share_percent ?? 50) / 100
        : 0;
      const { error } = await supabase
        .from("payments")
        .update({
          method: editMethod as any,
          amount,
          qr_receiver: editMethod === "UPI/QR" ? editQr : null,
          admin_share: amount * adminPct,
          staff_share: amount * staffPct,
        })
        .eq("id", selectedPayment.id);
      if (error) throw error;
      refetch();
      setEditOpen(false);
      toast.success("Payment updated");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save payment");
    } finally {
      setSavingEdit(false);
    }
  };


  const qrReceivers = settings?.qr_receivers || [
    "Admin QR",
    "Staff QR",
    "Shop QR",
  ];
  const splitEnabled = settings?.revenue_split_enabled !== false;
  const { data: customerPayments, refetch: refetchCP } =
    useSupabaseQuery<any>("customer_payments");

  const approvePayment = async (p: any) => {
    try {
      // 1. Update submission status
      const { error: pErr } = await supabase
        .from("customer_payments")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
        } as any)
        .eq("id", p.id);

      if (pErr) throw pErr;

      // 2. Find the associated repair job
      const { data: job } = await supabase
        .from("repair_jobs")
        .select("*")
        .eq("tracking_id", p.tracking_id)
        .maybeSingle();

      // 3. Create a real payment record for the shop
      if (job) {
        const splitEnabled = settings?.revenue_split_enabled !== false;
        const adminPct = splitEnabled
          ? (settings?.admin_share_percent ?? 50) / 100
          : 1;
        const staffPct = splitEnabled
          ? (settings?.staff_share_percent ?? 50) / 100
          : 0;

        await supabase.from("payments").insert({
          user_id: user!.id,
          job_id: job.job_id,
          repair_job_id: job.id,
          amount: p.amount,
          method: "UPI/QR",
          qr_receiver: "Online Payment",
          admin_share: p.amount * adminPct,
          staff_share: p.amount * staffPct,
          created_at: new Date().toISOString(),
        } as any);
      }

      toast.success("Payment approved and added to records!");
      refetchCP();
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve payment");
    }
  };

  const rejectPayment = async (p: any) => {
    await supabase
      .from("customer_payments")
      .update({
        status: "rejected",
        processed_at: new Date().toISOString(),
      } as any)
      .eq("id", p.id);
    toast.error("Payment rejected");
    refetchCP();
  };

  const openPayLink = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayLinkPayment(p);
    setPayLinkOpen(true);
  };

  const openRefund = (p: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRefundPayment(p);
    setRefundOpen(true);
    setDetailsOpen(false);
  };

  const sendWhatsAppDirect = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `🔧 TEKYSYS: Hi, your repair job #${p.job_id} payment of ₹${Number(p.amount).toLocaleString()} has been recorded via ${p.method}. Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("WhatsApp opened");
  };

  const printReceipt = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Receipt - ${p.job_id}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;max-width:300px;margin:0 auto}
      h2{color:#4f46e5;text-align:center}.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee}
      .total{font-size:1.2em;font-weight:bold;color:#4f46e5;padding:8px 0}</style></head>
      <body>
      <h2>🔧 TEKYSYS</h2>
      <p style="text-align:center;color:#666;font-size:12px">Service Center Receipt</p>
      <div class="row"><span>Job ID</span><span><b>${p.job_id}</b></span></div>
      <div class="row"><span>Method</span><span>${p.method}</span></div>
      <div class="row"><span>Date</span><span>${new Date(p.created_at).toLocaleDateString()}</span></div>
      <div class="row total"><span>Amount Paid</span><span>₹${Number(p.amount).toLocaleString()}</span></div>
      <p style="text-align:center;font-size:11px;color:#999;margin-top:20px">Thank you for choosing TEKYSYS!</p>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <MainLayout title="Payments">
      <div className="space-y-4 animate-fade-in">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="shadow-card border-0 bg-gradient-to-br from-violet-600 to-indigo-700 text-white col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-violet-200 font-medium">
                    Net Revenue
                  </p>
                  <p className="text-xl font-black mt-0.5">
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-violet-300 mt-1">
                    Gross: ₹{(totalRevenue + refundTotal).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-violet-300 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-100 font-medium">
                    💵 Cash
                  </p>
                  <p className="text-xl font-black mt-0.5">
                    ₹{cashTotal.toLocaleString()}
                  </p>
                </div>
                <IndianRupee className="h-8 w-8 text-emerald-200 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-100 font-medium">📱 UPI/QR</p>
                  <p className="text-xl font-black mt-0.5">
                    ₹{upiTotal.toLocaleString()}
                  </p>
                </div>
                <Smartphone className="h-8 w-8 text-blue-200 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-100 font-medium">📋 Due</p>
                  <p className="text-xl font-black mt-0.5">
                    ₹{dueTotal.toLocaleString()}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-200 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-gradient-to-br from-rose-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-rose-100 font-medium">
                    ↩️ Refunds
                  </p>
                  <p className="text-xl font-black mt-0.5">
                    ₹{refundTotal.toLocaleString()}
                  </p>
                </div>
                <RotateCcw className="h-8 w-8 text-rose-200 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {Object.keys(qrTotals).length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <QrCode className="h-4 w-4 text-blue-600" />
                QR-wise Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(qrTotals).map(([name, amount]) => (
                  <div
                    key={name}
                    className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-xl px-4 py-2"
                  >
                    <p className="text-xs text-blue-600 font-medium">{name}</p>
                    <p className="text-lg font-bold text-blue-700">
                      ₹{amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              Direct Payments ({filtered.length})
            </TabsTrigger>
            <TabsTrigger value="online">
              Online Approval
              {customerPayments.filter((cp: any) => cp.status === "pending")
                .length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-[10px] h-4 px-1.5 border-0">
                  {
                    customerPayments.filter(
                      (cp: any) => cp.status === "pending",
                    ).length
                  }
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Card className="shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Job ID</th>
                      <th className="text-left p-3 font-semibold">Amount</th>
                      <th className="text-left p-3 font-semibold">Method</th>
                      <th className="text-left p-3 font-semibold hidden md:table-cell">
                        QR Receiver
                      </th>
                      {splitEnabled && (
                        <th className="text-left p-3 font-semibold">Admin</th>
                      )}
                      {splitEnabled && (
                        <th className="text-left p-3 font-semibold">Staff</th>
                      )}
                      <th className="text-left p-3 font-semibold hidden md:table-cell">
                        Date
                      </th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p: any) => {
                      const MIcon = methodIcons[p.method] || CreditCard;
                      return (
                        <tr
                          key={p.id}
                          className="border-b hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => {
                            setViewPayment(p);
                            setDetailsOpen(true);
                          }}
                        >
                          <td className="p-3 font-mono font-semibold text-primary text-xs">
                            {p.job_id}
                          </td>
                          <td className="p-3 font-black text-sm">
                            ₹{Number(p.amount).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`${methodColors[p.method] || "bg-muted text-muted-foreground"} border-0 text-xs flex items-center gap-1 w-fit`}
                            >
                              <MIcon className="h-3 w-3" />
                              {p.method}
                            </Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">
                            {p.qr_receiver || "—"}
                          </td>
                          {splitEnabled && (
                            <td className="p-3 text-sm">
                              ₹{Number(p.admin_share).toLocaleString()}
                            </td>
                          )}
                          {splitEnabled && (
                            <td className="p-3 text-sm">
                              ₹{Number(p.staff_share).toLocaleString()}
                            </td>
                          )}
                          <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td
                            className="p-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1">
                              {/* Send Payment Link */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-violet-600 hover:bg-violet-100"
                                title="Send Payment Link & QR"
                                onClick={(e) => openPayLink(p, e)}
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                              {/* WhatsApp */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-[#25D366] hover:bg-[#25D366]/10"
                                title="WhatsApp"
                                onClick={(e) => sendWhatsAppDirect(p, e)}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>
                              {/* Refund */}
                              {p.method !== "Refunded" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-orange-600 hover:bg-orange-100"
                                  title="Refund"
                                  onClick={(e) => openRefund(p, e)}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {/* Print */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="Print Receipt"
                                onClick={(e) => printReceipt(p, e)}
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              {/* Edit */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground"
                                title="Edit"
                                onClick={() => openEditPayment(p)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={splitEnabled ? 10 : 8}
                          className="p-12 text-center text-muted-foreground"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                              Loading...
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/30" />
                              <p>No payments found</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="online" className="space-y-4">
            {customerPayments.length === 0 && (
              <p className="text-center py-10 text-muted-foreground">
                No online payment requests
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerPayments.map((cp: any) => (
                <Card
                  key={cp.id}
                  className={`shadow-md border-l-4 ${cp.status === "pending" ? "border-violet-500" : cp.status === "approved" ? "border-emerald-500" : "border-destructive"}`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-primary text-sm">
                          {cp.tracking_id}
                        </p>
                        <Badge
                          variant={
                            cp.status === "pending" ? "secondary" : "default"
                          }
                          className="text-[10px] uppercase"
                        >
                          {cp.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Customer: {cp.customer_name}
                      </p>
                      <p className="text-lg font-black">
                        ₹{Number(cp.amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        UTR:{" "}
                        <span className="text-foreground">{cp.utr_number}</span>
                      </p>
                    </div>
                    {cp.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => approvePayment(cp)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => rejectPayment(cp)}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {cp.status === "approved" && (
                      <ShieldCheck className="h-8 w-8 text-emerald-500 opacity-50" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-violet-600" />
                Payment Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                {[
                  ["Job ID", viewPayment?.job_id],
                  [
                    "Amount",
                    `₹${Number(viewPayment?.amount).toLocaleString()}`,
                  ],
                  ["Method", viewPayment?.method],
                  [
                    "Date",
                    viewPayment
                      ? new Date(viewPayment.created_at).toLocaleDateString(
                          "en-IN",
                        )
                      : "—",
                  ],
                  ...(viewPayment?.method === "UPI/QR"
                    ? [["QR Receiver", viewPayment?.qr_receiver || "N/A"]]
                    : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{val}</span>
                  </div>
                ))}
              </div>

              {/* Quick Share Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex flex-col h-auto py-2 gap-1 border-violet-300 text-violet-600 hover:bg-violet-50"
                  onClick={() => {
                    setPayLinkPayment(viewPayment);
                    setPayLinkOpen(true);
                    setDetailsOpen(false);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="text-[10px]">Share Link</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex flex-col h-auto py-2 gap-1 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10"
                  onClick={() =>
                    sendWhatsAppDirect(viewPayment, {
                      stopPropagation: () => {},
                    } as any)
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-[10px]">WhatsApp</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex flex-col h-auto py-2 gap-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={() => openRefund(viewPayment)}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-[10px]">Refund</span>
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDetailsOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Payment Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Edit Payment — {selectedPayment?.job_id}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={editMethod}
                  onValueChange={(v) => setEditMethod(v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">💵 Cash</SelectItem>
                    <SelectItem value="UPI/QR">📱 UPI/QR</SelectItem>
                    <SelectItem value="Due">📋 Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editMethod === "UPI/QR" && (
                <div>
                  <Label>QR Receiver</Label>
                  <Select value={editQr} onValueChange={setEditQr}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {qrReceivers.map((qr: string) => (
                        <SelectItem key={qr} value={qr}>
                          {qr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button onClick={handleEditPayment} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>

        {/* Payment Link Modal */}
        <PaymentLinkModal
          open={payLinkOpen}
          onOpenChange={setPayLinkOpen}
          job={payLinkPayment}
        />

        {/* Refund Modal */}
        {refundPayment && (
          <RefundModal
            open={refundOpen}
            onClose={() => setRefundOpen(false)}
            payment={refundPayment}
            onSuccess={() => {
              refetch();
              setRefundOpen(false);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
