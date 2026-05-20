import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle2, Phone, Mail, Cpu, AlertTriangle, Clock, Smartphone, Laptop, Monitor, Tv, RefrigeratorIcon, Wind } from "lucide-react";
import { toast } from "sonner";
import { ShopReviews } from "./ShopReviews";

const DEVICE_TYPES = [
  { value: "Mobile", icon: Smartphone, color: "from-blue-500 to-blue-600" },
  { value: "Laptop", icon: Laptop, color: "from-purple-500 to-purple-600" },
  { value: "Desktop", icon: Monitor, color: "from-slate-500 to-slate-600" },
  { value: "TV/LED", icon: Tv, color: "from-rose-500 to-rose-600" },
  { value: "Fridge", icon: RefrigeratorIcon, color: "from-cyan-500 to-cyan-600" },
  { value: "AC", icon: Wind, color: "from-teal-500 to-teal-600" },
];

const SERVICE_TYPES = [
  "Screen Replacement",
  "Battery Replacement",
  "Charging Port Fix",
  "Camera Repair",
  "Water Damage",
  "Software/OS Issue",
  "Motherboard Repair",
  "Speaker/Mic Fix",
  "Data Recovery",
  "Keyboard/Touchpad",
  "Other",
];

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1); // 1=device, 2=contact, 3=problem
  const [form, setForm] = useState({
    customer_name: "",
    customer_mobile: "",
    customer_email: "",
    device_type: "",
    device_brand: "",
    device_model: "",
    service_type: "",
    problem_description: "",
    preferred_date: "",
    is_urgent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await (supabase as any).rpc("get_shop_by_slug", { _slug: slug });
      setShop(data);
      setLoading(false);
    })();
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.user_id || isSubmitting) return;
    if (!form.customer_name || !form.customer_mobile || !form.device_brand || !form.problem_description) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.customer_mobile.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from("booking_requests").insert({
        customer_name: form.customer_name,
        customer_mobile: form.customer_mobile,
        customer_email: form.customer_email || null,
        device_type: form.device_type || null,
        device_brand: form.device_brand,
        device_model: form.device_model || null,
        service_type: form.service_type || null,
        problem_description: form.problem_description,
        preferred_date: form.preferred_date || null,
        is_urgent: form.is_urgent,
        user_id: shop.user_id,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setStep(1);
    setForm({
      customer_name: "", customer_mobile: "", customer_email: "",
      device_type: "", device_brand: "", device_model: "",
      service_type: "", problem_description: "", preferred_date: "", is_urgent: false,
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Shop Not Found</h2>
          <p className="text-muted-foreground text-sm">This booking page doesn't exist or has been disabled.</p>
        </CardContent>
      </Card>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-emerald-700">Booking Submitted!</h2>
          <p className="text-emerald-600 mt-2 font-medium">
            <span className="font-bold">{shop.shop_name}</span> will contact you shortly on{" "}
            <span className="font-black">{form.customer_mobile}</span>.
          </p>
        </div>
        <Card className="text-left shadow-xl">
          <CardContent className="p-5 space-y-2 text-sm">
            <p className="font-bold text-base">{form.device_brand} {form.device_model}</p>
            {form.device_type && <p className="text-muted-foreground">Type: {form.device_type}</p>}
            {form.service_type && <p className="text-muted-foreground">Service: {form.service_type}</p>}
            <p className="text-muted-foreground">Problem: {form.problem_description}</p>
            {form.preferred_date && <p className="text-muted-foreground">Preferred: {new Date(form.preferred_date).toLocaleDateString("en-IN")}</p>}
            {form.is_urgent && <Badge className="bg-red-100 text-red-600">⚡ Urgent</Badge>}
          </CardContent>
        </Card>
        <Button onClick={resetForm} variant="outline" className="w-full">Submit Another Request</Button>
        <p className="text-xs text-muted-foreground">Powered by RepairXpert</p>
      </div>
    </div>
  );

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Shop Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-8 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-xl">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black">{shop.shop_name}</h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-slate-300">
            {shop.address && <span>📍 {shop.address}</span>}
            {shop.phone && <a href={`tel:${shop.phone}`} className="flex items-center gap-1 hover:text-white"><Phone className="h-3 w-3" /> {shop.phone}</a>}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span className={step >= 1 ? "text-primary" : ""}>1. Device Info</span>
            <span className={step >= 2 ? "text-primary" : ""}>2. Your Details</span>
            <span className={step >= 3 ? "text-primary" : ""}>3. Problem</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* STEP 1 — Device Info */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> Device Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {DEVICE_TYPES.map(({ value, icon: Icon, color }) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setForm({ ...form, device_type: value })}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                          form.device_type === value
                            ? "border-primary bg-primary/10 shadow-md scale-105"
                            : "border-transparent bg-muted/40 hover:border-border"
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-bold">{value}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardContent className="pt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Brand *</Label>
                      <Input value={form.device_brand} onChange={(e) => setForm({ ...form, device_brand: e.target.value })} placeholder="Samsung, Apple..." required className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Model</Label>
                      <Input value={form.device_model} onChange={(e) => setForm({ ...form, device_model: e.target.value })} placeholder="Galaxy A50..." className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Service Required</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {SERVICE_TYPES.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setForm({ ...form, service_type: form.service_type === s ? "" : s })}
                          className={`text-left px-3 py-2 rounded-lg text-xs border-2 transition-all ${
                            form.service_type === s
                              ? "border-primary bg-primary/10 font-bold text-primary"
                              : "border-transparent bg-muted/40 hover:border-border"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="button" className="w-full h-12 text-base font-bold" onClick={() => {
                if (!form.device_brand) { toast.error("Please enter the device brand"); return; }
                setStep(2);
              }}>
                Next: Your Details →
              </Button>
            </div>
          )}

          {/* STEP 2 — Contact */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Your Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold">Full Name *</Label>
                    <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Your name" required className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Mobile Number * <span className="text-muted-foreground font-normal">(10 digits)</span></Label>
                    <Input
                      value={form.customer_mobile}
                      onChange={(e) => setForm({ ...form, customer_mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      required
                      className={`mt-1 ${form.customer_mobile.length === 10 ? "ring-1 ring-green-400" : ""}`}
                    />
                    {form.customer_mobile.length > 0 && (
                      <p className={`text-[10px] mt-1 font-bold ${form.customer_mobile.length === 10 ? "text-green-600" : "text-amber-500"}`}>
                        {form.customer_mobile.length}/10 {form.customer_mobile.length === 10 ? "✓ Valid" : ""}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><Mail className="h-3 w-3" /> Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} placeholder="you@example.com" className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>← Back</Button>
                <Button type="button" className="flex-1 h-12 font-bold" onClick={() => {
                  if (!form.customer_name) { toast.error("Please enter your name"); return; }
                  if (form.customer_mobile.length !== 10) { toast.error("Enter a valid 10-digit mobile number"); return; }
                  setStep(3);
                }}>
                  Next: Problem →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Problem */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Problem Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold">Describe the problem *</Label>
                    <Textarea
                      value={form.problem_description}
                      onChange={(e) => setForm({ ...form, problem_description: e.target.value })}
                      rows={4}
                      placeholder="e.g. Screen cracked, touch not working on lower half..."
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> Preferred Visit Date <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input
                      type="date"
                      value={form.preferred_date}
                      onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                      min={new Date().toISOString().slice(0, 10)}
                      className="mt-1"
                    />
                  </div>
                  {/* Urgent toggle */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_urgent: !form.is_urgent })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${form.is_urgent ? "border-red-400 bg-red-50" : "border-transparent bg-muted/40 hover:border-border"}`}
                  >
                    <span className="text-2xl">{form.is_urgent ? "⚡" : "🔔"}</span>
                    <div className="text-left">
                      <p className={`font-bold text-sm ${form.is_urgent ? "text-red-600" : ""}`}>Mark as Urgent</p>
                      <p className="text-xs text-muted-foreground">Request priority attention from the shop</p>
                    </div>
                    <div className={`ml-auto h-6 w-11 rounded-full transition-all ${form.is_urgent ? "bg-red-500" : "bg-muted"}`}>
                      <div className={`h-6 w-6 rounded-full bg-white shadow transition-all ${form.is_urgent ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </button>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="border-0 bg-gradient-to-br from-primary/5 to-indigo-50 shadow">
                <CardContent className="p-4 text-sm space-y-1.5">
                  <p className="font-bold text-base mb-2">📋 Booking Summary</p>
                  <p><span className="text-muted-foreground">Name:</span> <strong>{form.customer_name}</strong></p>
                  <p><span className="text-muted-foreground">Mobile:</span> <strong>{form.customer_mobile}</strong></p>
                  <p><span className="text-muted-foreground">Device:</span> <strong>{form.device_brand} {form.device_model} {form.device_type ? `(${form.device_type})` : ""}</strong></p>
                  {form.service_type && <p><span className="text-muted-foreground">Service:</span> <strong>{form.service_type}</strong></p>}
                  {form.is_urgent && <Badge className="bg-red-100 text-red-600 border-red-200">⚡ Urgent</Badge>}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>← Back</Button>
                <Button type="submit" className="flex-1 h-12 font-black text-base bg-primary shadow-lg" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "🚀 Submit Booking"}
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6">
          <ShopReviews shopUserId={shop.user_id} />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">Powered by RepairXpert</p>
      </div>
    </div>
  );
}
