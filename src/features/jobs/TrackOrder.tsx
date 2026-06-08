import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  IndianRupee,
  QrCode,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Star,
  MessageSquare,
  Package,
  Wrench,
  Truck,
  Home,
  PhoneCall,
  Zap,
  Shield,
  RotateCcw,
} from "lucide-react";

const JOB_STATUSES = [
  {
    key: "Received",
    label: "Device Received",
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    key: "In Progress",
    label: "Repair In Progress",
    icon: Wrench,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    key: "Re-work",
    label: "Quality Check / Re-work",
    icon: RotateCcw,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    key: "Ready",
    label: "Ready for Pickup",
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    key: "Delivered",
    label: "Delivered",
    icon: Home,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    key: "Returned",
    label: "Returned",
    icon: RotateCcw,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
];

const statusOrder: Record<string, number> = {
  Received: 0,
  Pending: 0,
  "In Progress": 1,
  "Re-work": 1.5,
  Ready: 2,
  Delivered: 3,
  Completed: 3,
  Rejected: -1,
  Unrepairable: -1,
  Returned: -1,
};

const statusColors: Record<string, string> = {
  Received: "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  "Re-work": "bg-purple-100 text-purple-700",
  Ready: "bg-emerald-100 text-emerald-700",
  Delivered: "bg-green-100 text-green-700",
  Completed: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Unrepairable: "bg-red-100 text-red-700",
  Returned: "bg-indigo-100 text-indigo-700",
};

export default function TrackOrder({
  isModal = false,
  initialId = "",
  onClose,
}: {
  isModal?: boolean;
  initialId?: string;
  onClose?: () => void;
}) {
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(initialId || searchParams.get("id") || "");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [merchantSettings, setMerchantSettings] = useState<any>(null);
  const [utr, setUtr] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const id = initialId || searchParams.get("id");
    if (id) {
      setTrackingId(id);
      handleTrackDirect(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleTrackDirect = async (id: string) => {
    const cleaned = (id || "").trim().toUpperCase();
    if (cleaned.length < 3) {
      toast.error("Tracking ID looks too short");
      return;
    }
    setLoading(true);
    setSearched(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc("track_order", {
        _tracking_id: cleaned,
      });
      if (error) {
        console.error(error);
        setResult(null);
      } else {
        const responseData = data as any;
        setResult(responseData);
        if (responseData?.user_id) {
          const { data: mSettings } = await supabase
            .from("shop_settings")
            .select("*")
            .eq("user_id", responseData.user_id)
            .maybeSingle();
          setMerchantSettings(mSettings);
        } else {
          setMerchantSettings(null);
        }
      }
    } catch (e) {
      console.error(e);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = () => {
    if (!trackingId.trim()) {
      toast.error("Enter a tracking ID");
      return;
    }
    handleTrackDirect(trackingId.trim());
  };


  const downloadInvoicePDF = () => {
    if (!result) return;
    const shopName = (merchantSettings?.shop_name || "RepairXpert").toUpperCase();
    const shopPhone = merchantSettings?.phone || "";
    const shopAddr = merchantSettings?.address || "";
    const doc = new jsPDF();
    // Header — branded with shop, footer with RepairXpert
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 42, "F");
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 42, 210, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(shopName, 14, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (shopAddr) doc.text(shopAddr.slice(0, 80), 14, 25);
    if (shopPhone) doc.text(`Phone: ${shopPhone}`, 14, 31);
    doc.text(`Invoice: ${result.tracking_id}`, 14, 38);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(result.created_at).toLocaleDateString("en-IN")}`, 14, 54);
    doc.text(`Status: ${result.status}`, 14, 61);

    if (result.type === "job") {
      doc.text(`Customer: ${result.customer_name}`, 14, 68);
      doc.text(`Device: ${result.device_brand} ${result.device_model || ""}`, 14, 75);
      autoTable(doc, {
        startY: 84,
        head: [["Description", "Status", "Amount"]],
        body: [[result.problem, result.status, `Rs.${Number(result.estimated_cost).toLocaleString()}`]],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
      });
    } else {
      doc.text(`Item: ${result.item_name}`, 14, 68);
      autoTable(doc, {
        startY: 76,
        head: [["Item", "Quantity", "Total"]],
        body: [[result.item_name, String(result.quantity), `Rs.${Number(result.total).toLocaleString()}`]],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Thank you for choosing ${merchantSettings?.shop_name || "us"}! 🙏`, 14, 275);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("Powered by RepairXpert • repairxpert.lovable.app", 14, 282);
    doc.save(`Invoice-${result.tracking_id}.pdf`);
  };

  const submitFeedback = async () => {
    if (rating === 0) {
      toast.error("Please give a rating");
      return;
    }
    if (!result?.user_id) {
      toast.error("Shop reference missing");
      return;
    }
    try {
      const { error } = await (supabase as any).from("shop_reviews").insert({
        user_id: result.user_id,
        job_id: result?.tracking_id || null,
        customer_name: result?.customer_name || "Guest",
        rating,
        comment: reviewText || null,
        status: "pending",
      });
      if (error) throw error;
      setFeedbackSubmitted(true);
      toast.success("Thank you for your feedback! ⭐");
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit feedback");
    }
  };

  const currentStep = result ? (statusOrder[result.status] ?? -1) : -1;
  const isDelivered =
    result?.status === "Delivered" || result?.status === "Completed";
  const isRejected =
    result?.status === "Rejected" ||
    result?.status === "Unrepairable" ||
    result?.status === "Returned";
  const amount =
    result?.type === "job" ? result?.estimated_cost : result?.total;

  return (
    <div
      className={`${isModal ? "p-4" : "min-h-screen p-4"} bg-background relative overflow-hidden`}
    >
      {!isModal && (
        <>
          <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" />
          <Link
            to="/"
            className="relative inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </>
      )}

      <div
        className={`relative w-full max-w-lg mx-auto space-y-5 ${!isModal ? "pt-4" : ""}`}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Smartphone className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-black bg-gradient-primary bg-clip-text text-transparent">
            Track Your Order
          </h1>
          <p className="text-sm text-muted-foreground">
            RepairXpert · Job, Sell or Marketplace ID
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-lg border">
          <Input
            placeholder="e.g. JSAM0042K9X"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            className="border-0 shadow-none font-mono h-10 focus-visible:ring-0 bg-transparent"
          />
          <Button
            onClick={handleTrack}
            disabled={loading}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl px-5"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {loading && (
          <div className="text-center py-10">
            <div className="h-12 w-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Searching...</p>
          </div>
        )}

        {/* Not Found */}
        {!loading && searched && !result && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-8 text-center space-y-2">
              <XCircle className="h-14 w-14 text-red-400 mx-auto" />
              <h3 className="font-bold text-lg">Order Not Found</h3>
              <p className="text-sm text-muted-foreground">
                No order with this ID was found. Check and try again.
              </p>
              <p className="text-xs text-muted-foreground">
                Jobs: trackable 3 days after delivery • Sales: trackable 30 days
              </p>
            </CardContent>
          </Card>
        )}

        {/* Marketplace order result */}
        {!loading && result && result.type === "marketplace" && (
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-75 font-medium">Order #</p>
                  <p className="font-black text-lg font-mono">{result.tracking_id}</p>
                </div>
                <Badge className="bg-white/20 text-white border-0 font-bold capitalize">{String(result.status).replace(/_/g, " ")}</Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <InfoBox label="Customer" value={result.customer_name || "—"} />
                <InfoBox label="Shop" value={result.shop_name || "—"} />
                <InfoBox label="Total" value={`₹${Number(result.total).toLocaleString()}`} highlight />
                <InfoBox label="Payment" value={`${String(result.payment_method).toUpperCase()} · ${result.payment_status}`} />
                <InfoBox label="Fulfillment" value={String(result.fulfillment_method || "delivery")} />
                <InfoBox label="Placed" value={new Date(result.created_at).toLocaleDateString("en-IN")} />
                {result.qr_receiver && <InfoBox label="Paid to" value={result.qr_receiver} />}
              </div>
              <div className="border-t pt-3 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Items</p>
                {Array.isArray(result.items) && result.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="line-clamp-1">{it.title} × {it.quantity}</span>
                    <span>₹{it.line_total}</span>
                  </div>
                ))}
              </div>
              {Array.isArray(result.history) && result.history.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status History</p>
                  <ol className="space-y-1.5">
                    {result.history.map((h: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="mt-1 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold capitalize">{String(h.to_status).replace(/_/g, " ")}</p>
                          {h.note && <p className="text-muted-foreground">{h.note}</p>}
                          <p className="text-muted-foreground/70 text-[10px]">{new Date(h.created_at).toLocaleString("en-IN")}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        )}


        {/* Result */}
        {!loading && result && result.type !== "marketplace" && (
          <div className="space-y-4">
            {/* Status Card */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div
                className={`p-4 ${isRejected ? "bg-gradient-to-r from-red-500 to-orange-500" : isDelivered ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-violet-600 to-indigo-600"} text-white`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-75 font-medium">
                      Tracking ID
                    </p>
                    <p className="font-black text-lg font-mono">
                      {result.tracking_id}
                    </p>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 font-bold">
                    {result.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {result.type === "job" ? (
                    <>
                      <InfoBox label="Customer" value={result.customer_name} />
                      <InfoBox
                        label="Device"
                        value={`${result.device_brand} ${result.device_model || ""}`}
                      />
                      <InfoBox label="Problem" value={result.problem} />
                      <InfoBox
                        label="Amount"
                        value={`₹${Number(result.estimated_cost).toLocaleString()}`}
                        highlight
                      />
                      <InfoBox
                        label="Created"
                        value={new Date(result.created_at).toLocaleDateString(
                          "en-IN",
                        )}
                      />
                      {result.delivered_at && (
                        <InfoBox
                          label="Delivered"
                          value={new Date(
                            result.delivered_at,
                          ).toLocaleDateString("en-IN")}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <InfoBox label="Item" value={result.item_name} />
                      <InfoBox
                        label="Quantity"
                        value={String(result.quantity)}
                      />
                      <InfoBox
                        label="Total"
                        value={`₹${Number(result.total).toLocaleString()}`}
                        highlight
                      />
                      <InfoBox
                        label="Date"
                        value={new Date(result.created_at).toLocaleDateString(
                          "en-IN",
                        )}
                      />
                    </>
                  )}
                </div>

                {/* Progress Timeline (only for jobs) */}
                {result.type === "job" && !isRejected && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Repair Progress
                    </p>
                    <div className="relative">
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-muted" />
                      <div
                        className="absolute left-4 top-4 w-0.5 bg-gradient-to-b from-violet-600 to-indigo-600 transition-all duration-700"
                        style={{
                          height: `${Math.max(0, currentStep) * 33.33}%`,
                        }}
                      />
                      <div className="space-y-4">
                        {JOB_STATUSES.map((step, i) => {
                          const isDone = i <= currentStep;
                          const isCurrent = i === currentStep;
                          const Icon = step.icon;
                          return (
                            <div
                              key={step.key}
                              className="flex items-center gap-3 relative pl-2"
                            >
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center z-10 transition-all ${
                                  isDone
                                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/30"
                                    : "bg-muted border-2 border-border"
                                }`}
                              >
                                {isDone ? (
                                  i < currentStep ? (
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  ) : (
                                    <Icon className="h-4 w-4 text-white" />
                                  )
                                ) : (
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p
                                  className={`text-sm font-bold ${isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}
                                >
                                  {step.label}
                                  {isCurrent && (
                                    <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                      Current
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={downloadInvoicePDF}
                  >
                    <FileText className="h-3.5 w-3.5" /> Download Invoice
                  </Button>
                  {isDelivered || isRejected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => setShowFeedback(!showFeedback)}
                    >
                      <Star className="h-3.5 w-3.5 text-amber-500" /> Rate Us
                    </Button>
                  ) : merchantSettings?.upi_id ? (
                    <Button
                      size="sm"
                      className="w-full gap-1.5 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      onClick={() => setPayOpen(!payOpen)}
                    >
                      <IndianRupee className="h-3.5 w-3.5" />
                      {payOpen ? "Close Payment" : "Pay Online"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                      disabled
                    >
                      <PhoneCall className="h-3.5 w-3.5" /> Contact Shop
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pay Online Panel */}
            {payOpen && merchantSettings?.upi_id && (
              <Card className="border-violet-200 shadow-lg animate-in slide-in-from-top-4 duration-300">
                <CardContent className="p-5 space-y-4">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-violet-600" /> Pay via UPI /
                    QR
                  </p>
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-violet-50 dark:border-violet-900/30">
                      {merchantSettings?.upi_id ? (
                        <QRCodeSVG
                          value={`upi://pay?pa=${merchantSettings.upi_id}&pn=${encodeURIComponent(merchantSettings.shop_name || "Merchant")}&am=${amount}&cu=INR&tn=${encodeURIComponent("Job " + result.tracking_id)}`}
                          size={180}
                          fgColor="#4f46e5"
                          includeMargin
                        />
                      ) : (
                        <div className="h-[180px] w-[180px] flex items-center justify-center text-xs text-muted-foreground text-center p-4">
                          UPI ID not set by shop owner. Please contact support.
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                        Scan with any UPI App
                      </p>
                      <div className="flex items-center gap-4 justify-center">
                        <div className="flex flex-col items-center gap-1">
                          <img
                            src="https://img.icons8.com/color/48/google-pay-india.png"
                            className="h-7 w-7"
                            alt="GPay"
                          />
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">
                            GPay
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <img
                            src="https://img.icons8.com/color/48/phonepe.png"
                            className="h-7 w-7"
                            alt="PhonePe"
                          />
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">
                            PhonePe
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <img
                            src="https://img.icons8.com/color/48/paytm.png"
                            className="h-7 w-7"
                            alt="Paytm"
                          />
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">
                            Paytm
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <img
                            src="https://img.icons8.com/color/48/bhim.png"
                            className="h-7 w-7"
                            alt="BHIM"
                          />
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">
                            BHIM
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deep Link Button for Mobile */}
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-2 border-violet-100 hover:bg-violet-50 gap-2 font-bold text-violet-700 sm:hidden"
                      onClick={() =>
                        (window.location.href = `upi://pay?pa=${merchantSettings.upi_id}&pn=${encodeURIComponent(merchantSettings.shop_name || "Merchant")}&am=${amount}&cu=INR`)
                      }
                    >
                      <Zap className="h-4 w-4" /> Open UPI App
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Submit UTR / Transaction ID
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        placeholder="12-digit UTR number"
                        className="h-10 font-mono"
                      />
                      <Button
                        onClick={async () => {
                          if (!utr.trim() || utr.trim().length < 6) {
                            toast.error("Enter a valid UTR / Txn ID");
                            return;
                          }
                          setSubmittingPay(true);
                          const phone = (merchantSettings?.phone || "").replace(/\D/g, "");
                          const msg = encodeURIComponent(
                            `Hi ${merchantSettings?.shop_name || "Shop"},\n\nPayment sent for ${result.tracking_id}\nAmount: ₹${amount}\nUTR / Txn ID: ${utr}\nCustomer: ${result.customer_name || "Guest"}\n\nPlease confirm. Thank you!`,
                          );
                          if (phone) {
                            const waNum = phone.length === 10 ? `91${phone}` : phone;
                            window.open(`https://wa.me/${waNum}?text=${msg}`, "_blank");
                            toast.success("Opening WhatsApp — shop will verify your payment.");
                          } else {
                            toast.success("UTR noted. Please share it with the shop directly.");
                          }
                          setPayOpen(false);
                          setUtr("");
                          setSubmittingPay(false);
                        }}
                        disabled={submittingPay}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Send to Shop
                      </Button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground">
                      UTR will be sent on WhatsApp to the shop for verification.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback Panel */}
            {showFeedback && (
              <Card className="border-amber-200 shadow-lg animate-in slide-in-from-top-4 duration-300">
                <CardContent className="p-5 space-y-4">
                  {feedbackSubmitted ? (
                    <div className="text-center space-y-2 py-4">
                      <div className="text-4xl">🎉</div>
                      <p className="font-bold">Thank you for your review!</p>
                      <p className="text-sm text-muted-foreground">
                        Your feedback helps us improve.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-bold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-amber-500" />
                        Rate Your Experience
                      </p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-125"
                          >
                            <Star
                              className={`h-8 w-8 ${(hoverRating || rating) >= s ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Tell us about your experience... (optional)"
                        className="resize-none min-h-[70px] text-sm"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                      />
                      <Button
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                        onClick={submitFeedback}
                      >
                        Submit Review
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="text-center pb-8">
          <Link
            to="/auth"
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard Login
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-2.5 ${highlight ? "bg-violet-50 dark:bg-violet-950/30 border border-violet-200" : "bg-muted/50"}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-sm font-bold mt-0.5 ${highlight ? "text-violet-700 dark:text-violet-400" : "text-foreground"}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
