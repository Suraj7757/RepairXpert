import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Store, CheckCircle2, Clock, XCircle, ChevronRight,
  Building2, Phone, MapPin, Briefcase, User, Mail,
  ArrowLeft, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const BUSINESS_TYPES = [
  "Mobile Repair",
  "Laptop Repair",
  "Electronics Repair",
  "AC / Fridge Repair",
  "Multi-brand Service",
  "Spare Parts Shop",
  "Other",
];

export default function BecomeSeller() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    shop_name: "",
    owner_name: user?.user_metadata?.display_name || "",
    phone: user?.user_metadata?.mobile || "",
    email: user?.email || "",
    city: "",
    state: "",
    address: "",
    business_type: "Mobile Repair",
    gst_number: "",
  });

  // Load existing application
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("shopkeeper_applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        setApplication(data);
        setLoading(false);
      });
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.shop_name || !form.owner_name || !form.phone || !form.city) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.phone.length !== 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("shopkeeper_applications")
        .insert({ ...form, user_id: user!.id });
      if (error) throw error;
      // Reload application
      const { data } = await (supabase as any)
        .from("shopkeeper_applications")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      setApplication(data);
      toast.success("Application submitted! We'll review it shortly.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // ── ALREADY APPROVED ──
  if (application?.status === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-emerald-700">Approved! 🎉</h1>
            <p className="text-emerald-600 mt-2">Your shop <strong>{application.shop_name}</strong> is now active on Servixo!</p>
          </div>
          <Card className="text-left shadow-xl border-emerald-200">
            <CardContent className="p-5 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Shop:</span> <strong>{application.shop_name}</strong></p>
              <p><span className="text-muted-foreground">Type:</span> <strong>{application.business_type}</strong></p>
              <p><span className="text-muted-foreground">City:</span> <strong>{application.city}, {application.state}</strong></p>
              <p><span className="text-muted-foreground">Approved:</span> <strong>{new Date(application.reviewed_at).toLocaleDateString("en-IN")}</strong></p>
            </CardContent>
          </Card>
          <Button className="w-full h-12 font-black text-base" onClick={() => navigate("/dashboard")}>
            Open My Dashboard →
          </Button>
        </div>
      </div>
    );
  }

  // ── PENDING / IN REVIEW ──
  if (application?.status === "pending") {
    const submitted = new Date(application.created_at);
    const now = new Date();
    const hrs = Math.floor((now.getTime() - submitted.getTime()) / 3600000);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-md w-full space-y-6">
          {/* Animated processing icon */}
          <div className="text-center">
            <div className="relative h-28 w-28 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-amber-500/30 animate-pulse" />
              <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
                <Clock className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-amber-700">Application Under Review</h1>
            <p className="text-amber-600 mt-2 font-medium">
              Our team is verifying your shop details
            </p>
          </div>

          {/* Progress steps */}
          <Card className="shadow-xl border-amber-200">
            <CardContent className="p-6 space-y-4">
              {[
                { label: "Application Submitted", done: true, desc: `${hrs < 1 ? "Just now" : `${hrs}h ago`}` },
                { label: "Under Admin Review", done: hrs >= 0, active: true, desc: "Being verified by our team" },
                { label: "Shop Activation", done: false, desc: "Usually within 24 hours" },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${s.done ? "bg-emerald-500" : s.active ? "bg-amber-500 animate-pulse" : "bg-muted"}`}>
                    {s.done ? <CheckCircle2 className="h-4 w-4 text-white" /> : <span className="text-xs font-black text-white">{i + 1}</span>}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${s.active && !s.done ? "text-amber-700" : s.done ? "text-emerald-700" : "text-muted-foreground"}`}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Application summary */}
          <Card className="border-amber-100 shadow-lg">
            <CardContent className="p-4 space-y-2 text-sm">
              <p className="font-bold text-base mb-2">📋 Your Application</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Shop Name", value: application.shop_name },
                  { label: "Owner", value: application.owner_name },
                  { label: "Phone", value: application.phone },
                  { label: "City", value: `${application.city}, ${application.state || ""}` },
                  { label: "Business", value: application.business_type },
                  { label: "Submitted", value: submitted.toLocaleDateString("en-IN") },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-amber-50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{label}</p>
                    <p className="font-semibold text-xs mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
            </Button>
            <Button variant="outline" className="flex-1 text-green-600" onClick={() => window.open("https://wa.me/7319884599?text=Hi, I submitted a shopkeeper application. Please check my status.", "_blank")}>
              📞 Contact Support
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">Approval usually takes 12–24 hours. You'll be notified via email.</p>
        </div>
      </div>
    );
  }

  // ── REJECTED ──
  if (application?.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 to-red-50">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="h-24 w-24 rounded-full bg-rose-500 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/30">
            <XCircle className="h-12 w-12 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-rose-700">Application Rejected</h1>
            <p className="text-rose-600 mt-2">Unfortunately your application was not approved at this time.</p>
          </div>
          {application.rejection_reason && (
            <Card className="text-left border-rose-200 shadow-lg">
              <CardContent className="p-4">
                <p className="text-sm font-bold text-rose-700 mb-1">Reason:</p>
                <p className="text-sm text-muted-foreground">{application.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
          <div className="flex flex-col gap-3">
            <Button className="w-full bg-rose-500 hover:bg-rose-600" onClick={async () => {
              await (supabase as any).from("shopkeeper_applications").delete().eq("user_id", user!.id);
              setApplication(null);
            }}>
              Reapply with new details →
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── APPLICATION FORM ──
  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white py-8 px-4">
        <div className="max-w-xl mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Store className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Become a Shopkeeper</h1>
              <p className="text-white/70 text-sm">Register your repair shop on Servixo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span className={step >= 1 ? "text-primary" : ""}>1. Shop Info</span>
            <span className={step >= 2 ? "text-primary" : ""}>2. Location</span>
            <span className={step >= 3 ? "text-primary" : ""}>3. Business</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* STEP 1 — Shop Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Card className="shadow-lg border-0">
                <CardContent className="pt-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><Store className="h-3 w-3" /> Shop Name *</Label>
                    <Input className="mt-1" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} placeholder="e.g. Mobile Hub, QuickFix" required />
                  </div>
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><User className="h-3 w-3" /> Owner Name *</Label>
                    <Input className="mt-1" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Your full name" required />
                  </div>
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number * <span className="font-normal text-muted-foreground">(10 digits)</span></Label>
                    <Input
                      className={`mt-1 ${form.phone.length === 10 ? "ring-1 ring-green-400" : ""}`}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      inputMode="numeric" maxLength={10} placeholder="9876543210" required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                    <Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="shop@email.com" />
                  </div>
                </CardContent>
              </Card>
              <Button type="button" className="w-full h-12 font-bold bg-gradient-to-r from-purple-600 to-indigo-600" onClick={() => {
                if (!form.shop_name || !form.owner_name) { toast.error("Fill shop name and owner name"); return; }
                if (form.phone.length !== 10) { toast.error("Enter valid 10-digit phone"); return; }
                setStep(2);
              }}>
                Next: Location → <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Card className="shadow-lg border-0">
                <CardContent className="pt-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><MapPin className="h-3 w-3" /> City *</Label>
                    <Input className="mt-1" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Mumbai, Delhi" required />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">State</Label>
                    <Input className="mt-1" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Maharashtra" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Full Address</Label>
                    <Input className="mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Shop no., street, area..." />
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>← Back</Button>
                <Button type="button" className="flex-1 h-12 font-bold bg-gradient-to-r from-purple-600 to-indigo-600" onClick={() => {
                  if (!form.city) { toast.error("Enter your city"); return; }
                  setStep(3);
                }}>
                  Next: Business →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Business Type + Submit */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <Card className="shadow-lg border-0">
                <CardContent className="pt-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><Briefcase className="h-3 w-3" /> Business Type *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {BUSINESS_TYPES.map((t) => (
                        <button
                          type="button" key={t}
                          onClick={() => setForm({ ...form, business_type: t })}
                          className={`text-left px-3 py-2.5 rounded-xl text-xs border-2 transition-all font-medium ${form.business_type === t ? "border-purple-500 bg-purple-50 text-purple-700 font-bold" : "border-transparent bg-muted/40 hover:border-border"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1"><Building2 className="h-3 w-3" /> GST Number <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input className="mt-1" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} placeholder="27AAAAA0000A1Z5" maxLength={15} />
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50 shadow">
                <CardContent className="p-4 text-sm space-y-1.5">
                  <p className="font-bold text-base mb-2">📋 Application Summary</p>
                  <p><span className="text-muted-foreground">Shop:</span> <strong>{form.shop_name}</strong></p>
                  <p><span className="text-muted-foreground">Owner:</span> <strong>{form.owner_name}</strong></p>
                  <p><span className="text-muted-foreground">Phone:</span> <strong>{form.phone}</strong></p>
                  <p><span className="text-muted-foreground">Location:</span> <strong>{form.city}{form.state ? `, ${form.state}` : ""}</strong></p>
                  <p><span className="text-muted-foreground">Business:</span> <strong>{form.business_type}</strong></p>
                </CardContent>
              </Card>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                ⚠️ Your application will be reviewed by the Servixo admin team. Approval usually takes 12–24 hours.
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>← Back</Button>
                <Button type="submit" className="flex-1 h-12 font-black text-base bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "🚀 Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
