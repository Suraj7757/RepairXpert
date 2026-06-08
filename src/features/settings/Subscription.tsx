import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";
import {
  Crown,
  Clock,
  Upload,
  Tag,
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertTriangle,
  QrCode,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

const UPI_ID = "patna14@ptyes";

const getPlans = (cycle: "monthly" | "quarterly" | "annually") => {
  const calcPrice = (base: number, discount: number) => {
    if (cycle === "monthly") return base;
    if (cycle === "quarterly") return base * 3;
    return Math.round(base * 12 * (1 - discount));
  };

  const basicFeatures = [
    "1000 Jobs & Sales Records",
    "Up to 2 Employees",
    "Import Data With Ease",
    "Upload Device Images",
    "Client Login",
    "Advance Reports",
    "Individual Dashboards",
    "Attachments",
    "Inventory Module",
    "WhatsApp Integration",
    "Quotations & Invoices",
    "48 Hours Support Time",
    "Activity Log",
    "Mobile App",
  ];

  const standardFeatures = [
    "Unlimited Jobs & Sales Records",
    "Up to 6 Employees",
    "Import Data With Ease",
    "Upload Device Images",
    "Client Login",
    "Advance Reports",
    "Role-Based Access Rights",
    "Individual Dashboards",
    "Private & Public Chat",
    "Attachments",
    "Inventory Module",
    "Purchase Management",
    "Own Email Setup",
    "Pickup Drop",
    "UPI Payments",
    "Bulk Payments",
    "WhatsApp Integration",
    "Quotations & Invoices",
    "Live Support",
    "Activity Log",
    "Mobile App",
    "AMC (Annual Maintenance Contract)",
    "Outsource Management",
    "Lead Management",
    "Task Management",
    "Expense Management",
    "Configurable Permissions",
    "Assigned Only Jobs to Employees",
    "Digital Signature",
    "OTP Verification For Delivery",
    "Payment Gateway Integration (PhonePe)",
    "Self Check-In",
    "Data Recovery Module",
    "Own Branding",
    "Branches",
  ];

  const enterpriseFeatures = [...standardFeatures];
  enterpriseFeatures[1] = "Up to 12 Employees";

  const premiumFeatures = [...standardFeatures];
  premiumFeatures[1] = "Unlimited Employees";
  premiumFeatures[premiumFeatures.length - 1] = "3 Branches";

  return [
    {
      id: `basic-${cycle}`,
      name: "Basic",
      price: calcPrice(249, 0),
      period:
        cycle === "monthly" ? "/mo" : cycle === "quarterly" ? "/qtr" : "/yr",
      features: basicFeatures,
    },
    {
      id: `standard-${cycle}`,
      name: "Standard",
      price: calcPrice(499, 0.1),
      period:
        cycle === "monthly" ? "/mo" : cycle === "quarterly" ? "/qtr" : "/yr",
      features: standardFeatures,
    },
    {
      id: `enterprise-${cycle}`,
      name: "Enterprise",
      price: calcPrice(999, 0.2),
      period:
        cycle === "monthly" ? "/mo" : cycle === "quarterly" ? "/qtr" : "/yr",
      features: enterpriseFeatures,
    },
    {
      id: `premium-${cycle}`,
      name: "Premium",
      price: calcPrice(1749, 0.2),
      period:
        cycle === "monthly" ? "/mo" : cycle === "quarterly" ? "/qtr" : "/yr",
      features: premiumFeatures,
    },
  ];
};

export default function Subscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [payOpen, setPayOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "quarterly" | "annually"
  >("monthly");
  const [selectedPlan, setSelectedPlan] = useState("standard-monthly");
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [subR, payR] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("payment_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setSubscription(subR.data);
    setPayments(payR.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isExpired =
    subscription?.status === "trial"
      ? new Date(subscription.trial_ends_at) < new Date()
      : subscription?.expires_at
        ? new Date(subscription.expires_at) < new Date()
        : false;

  const daysLeft =
    subscription?.status === "trial"
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.trial_ends_at).getTime() - Date.now()) /
              86400000,
          ),
        )
      : subscription?.expires_at
        ? Math.max(
            0,
            Math.ceil(
              (new Date(subscription.expires_at).getTime() - Date.now()) /
                86400000,
            ),
          )
        : 0;

  const handlePaymentSubmit = async () => {
    if (!utrNumber.trim()) {
      toast.error("UTR number is required");
      return;
    }
    if (!user) return;
    setSubmitting(true);

    let screenshotUrl = "";
    if (screenshot) {
      const ext = screenshot.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, screenshot);
      if (uploadErr) {
        toast.error("Failed to upload screenshot");
        setSubmitting(false);
        return;
      }
      // Store the storage object path; UI generates short-lived signed URLs on demand
      screenshotUrl = path;
    }

    const plansList = getPlans(billingCycle);
    const plan = plansList.find((p) => p.id === selectedPlan) || plansList[1];
    const { error } = await supabase.from("payment_submissions").insert({
      user_id: user.id,
      utr_number: utrNumber.trim(),
      amount: plan?.price || 499,
      screenshot_url: screenshotUrl,
      plan: selectedPlan,
    } as any);

    if (error) toast.error("Failed to submit payment");
    else {
      toast.success("Payment submitted for verification!");
      setPayOpen(false);
      setUtrNumber("");
      setScreenshot(null);
      fetchData();
    }
    setSubmitting(false);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !user) return;
    setApplyingPromo(true);

    const { data: promo } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoCode.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (!promo) {
      toast.error("Invalid or expired promo code");
      setApplyingPromo(false);
      return;
    }
    if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) {
      toast.error("Promo code has expired");
      setApplyingPromo(false);
      return;
    }
    if (promo.used_count >= promo.usage_limit) {
      toast.error("Promo code usage limit reached");
      setApplyingPromo(false);
      return;
    }

    // Activate subscription
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + promo.validity_days);

    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        plan: "pro",
        coupon_code: promo.code,
        expires_at: expiresAt.toISOString(),
      } as any)
      .eq("user_id", user.id);

    await supabase
      .from("promo_codes")
      .update({
        used_count: promo.used_count + 1,
      } as any)
      .eq("id", promo.id);

    toast.success(`Promo applied! ${promo.validity_days} days activated.`);
    setPromoOpen(false);
    setPromoCode("");
    fetchData();
    setApplyingPromo(false);
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied!");
  };

  if (loading)
    return (
      <MainLayout title="Subscription">
        <p className="text-center p-8 text-muted-foreground">Loading...</p>
      </MainLayout>
    );

  return (
    <MainLayout title="Subscription">
      <div className="space-y-6 animate-fade-in max-w-3xl">
        {/* Status Card */}
        <Card
          className={`shadow-card ${isExpired ? "border-destructive" : "border-primary/30"}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Crown
                  className={`h-8 w-8 ${isExpired ? "text-destructive" : "text-primary"}`}
                />
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {subscription?.plan?.toUpperCase() || "FREE"} Plan
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Status:{" "}
                    <Badge variant={isExpired ? "destructive" : "default"}>
                      {isExpired ? "Expired" : subscription?.status || "trial"}
                    </Badge>
                  </p>
                </div>
              </div>
              <div className="text-right">
                {!isExpired && daysLeft > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span
                      className={`font-bold ${daysLeft <= 3 ? "text-destructive" : "text-foreground"}`}
                    >
                      {daysLeft} days left
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isExpired && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Subscription Expired</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your subscription has expired. Please renew to continue using
                  all features.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setPayOpen(true)}>
                <IndianRupee className="h-4 w-4 mr-1" /> Pay & Activate
              </Button>
              <Button variant="outline" onClick={() => setPromoOpen(true)}>
                <Tag className="h-4 w-4 mr-1" /> Apply Promo Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-full inline-flex relative shadow-inner">
            <button
              onClick={() => {
                setBillingCycle("monthly");
                setSelectedPlan("standard-monthly");
              }}
              className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${billingCycle === "monthly" ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                setBillingCycle("quarterly");
                setSelectedPlan("standard-quarterly");
              }}
              className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${billingCycle === "quarterly" ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              Quarterly
            </button>
            <button
              onClick={() => {
                setBillingCycle("annually");
                setSelectedPlan("standard-annually");
              }}
              className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${billingCycle === "annually" ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              Annually{" "}
              <Badge className="absolute -top-3 -right-3 bg-green-500 hover:bg-green-600 border-0 shadow-lg text-[9px] animate-pulse py-0">
                SAVE BIG
              </Badge>
            </button>

            <div
              className="absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-300 shadow-md"
              style={{
                left:
                  billingCycle === "monthly"
                    ? "4px"
                    : billingCycle === "quarterly"
                      ? "33.33%"
                      : "66.66%",
                width: "calc(33.33% - 4px)",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {getPlans(billingCycle).map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all flex flex-col ${selectedPlan === plan.id ? "border-primary shadow-xl ring-2 ring-primary/20 scale-[1.02] z-10" : ""}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardContent className="p-4 flex-1 flex flex-col">
                <h4 className="font-semibold text-foreground">{plan.name}</h4>
                <p className="text-2xl font-bold text-foreground mt-1 mb-4">
                  ₹{plan.price}
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </p>
                <div className="flex-1 overflow-y-auto pr-1 max-h-60 scrollbar-thin scrollbar-thumb-primary/20">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment History */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payments submitted yet
              </p>
            )}
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    UTR: {p.utr_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{p.amount} • {p.plan} •{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={
                    p.status === "approved"
                      ? "default"
                      : p.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {p.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* UPI Payment Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pay via UPI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-6 text-center space-y-4">
                <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
                  <QRCodeSVG
                    value={`upi://pay?pa=${UPI_ID}&pn=RepairXpert%20CRM&am=${getPlans(billingCycle).find((p) => p.id === selectedPlan)?.price}&cu=INR`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-bold text-lg text-foreground">
                    {UPI_ID}
                  </span>
                  <Button size="sm" variant="ghost" onClick={copyUPI}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Amount:{" "}
                  <span className="font-bold text-foreground">
                    ₹
                    {
                      getPlans(billingCycle).find((p) => p.id === selectedPlan)
                        ?.price
                    }
                  </span>
                </p>
                <div className="flex justify-center gap-4 grayscale opacity-50">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Google_Pay_Logo.svg"
                    className="h-4"
                    alt="GPay"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png"
                    className="h-4"
                    alt="UPI"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg"
                    className="h-4"
                    alt="PhonePe"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan with any UPI app to pay securely.
                </p>
              </div>

              <div>
                <Label>UTR / Transaction Number *</Label>
                <Input
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter 12-digit UTR number"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Payment Screenshot (optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePaymentSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Promo Code Dialog */}
        <Dialog open={promoOpen} onOpenChange={setPromoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Promo Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Promo Code</Label>
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="mt-1 font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleApplyPromo} disabled={applyingPromo}>
                {applyingPromo ? "Applying..." : "Apply Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
