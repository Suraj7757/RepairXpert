import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Smartphone, Laptop, Tv2, AirVent, Refrigerator, Bike,
  Camera, Loader2, ArrowRight, ArrowLeft, MapPin, Store, CheckCircle2,
  Wrench, Clock, ShieldCheck, Zap, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const DEVICES = [
  { id: "Mobile", label: "Mobile", icon: Smartphone },
  { id: "Laptop", label: "Laptop / PC", icon: Laptop },
  { id: "TV", label: "Television", icon: Tv2 },
  { id: "AC", label: "Air Conditioner", icon: AirVent },
  { id: "Fridge", label: "Refrigerator", icon: Refrigerator },
  { id: "Bike", label: "Bike / Scooter", icon: Bike },
];

interface Quote {
  likely_issue: string;
  severity: "minor" | "moderate" | "severe";
  parts_needed: { name: string; est_cost: number }[];
  labour_cost: number;
  total_min: number;
  total_max: number;
  eta_hours: number;
  urgency: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  advice: string;
}

interface Shop {
  user_id: string;
  shop_name: string;
  address: string | null;
  phone: string | null;
  booking_slug: string | null;
  distance_km: number | null;
}

export default function BookRepair() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [device, setDevice] = useState("");
  const [problem, setProblem] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");

  const [aiLoading, setAiLoading] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteId, setQuoteId] = useState<string>("");

  const [shopsLoading, setShopsLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const [name, setName] = useState(user?.user_metadata?.display_name || "");
  const [mobile, setMobile] = useState(user?.user_metadata?.mobile || "");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");

  const handleImage = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) return toast.error("Image too large (max 4MB)");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  };

  const runAiQuote = async () => {
    if (!device || problem.trim().length < 5) return toast.error("Pick device and describe the problem");
    setAiLoading(true);
    setQuote(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-repair-quote", {
        body: { device, problem, image_base64: imageBase64 || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const q: Quote = data.quote;
      setQuote(q);
      if (user) {
        const { data: row } = await (supabase as any)
          .from("ai_quotes")
          .insert({ user_id: user.id, device, problem, quote: q })
          .select("id")
          .single();
        if (row?.id) setQuoteId(row.id);
      }
      setStep(3);
      await loadShops();
    } catch (e: any) {
      toast.error(e.message || "AI failed — try again");
    } finally {
      setAiLoading(false);
    }
  };

  const loadShops = async () => {
    setShopsLoading(true);
    const geo: { lat: number | null; lng: number | null } = await new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 4000 },
      );
    });
    const { data } = await (supabase as any).rpc("nearby_shops", {
      _lat: geo.lat, _lng: geo.lng, _radius_km: 50,
    });
    setShops((data || []) as Shop[]);
    setShopsLoading(false);
  };

  const submit = async () => {
    if (!user) return navigate("/auth?next=/customer/book");
    if (!selectedShop) return toast.error("Pick a shop");
    if (!name.trim() || !mobile.trim()) return toast.error("Name and mobile required");
    setSubmitting(true);
    const { data, error } = await (supabase as any).from("booking_requests").insert({
      user_id: selectedShop.user_id,
      customer_name: name,
      customer_mobile: mobile,
      customer_email: user.email,
      device_brand: device,
      device_model: "",
      problem_description: problem + (quote ? `\n\n[AI Quote] ${quote.likely_issue} · est ₹${quote.total_min}-${quote.total_max}` : ""),
    }).select("id").single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    if (quoteId) {
      await (supabase as any).from("ai_quotes").update({ selected_shop_id: selectedShop.user_id }).eq("id", quoteId);
    }
    setSubmittedId(data?.id || "ok");
    setStep(5);
  };

  const sevColor = (s?: string) =>
    s === "severe" ? "text-destructive bg-destructive/10 border-destructive/30"
    : s === "moderate" ? "text-warning bg-warning/10 border-warning/30"
    : "text-success bg-success/10 border-success/30";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/30 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2 font-display font-semibold">
            <Sparkles className="h-4 w-4 text-accent" /> AI Repair Booking
          </div>
          <div className="w-12" />
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((n, i) => (
            <div key={n} className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step >= n
                  ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground"
              }`}>{n}</div>
              {i < 3 && (
                <div className={`flex-1 h-1 rounded-full ${step > n ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 text-[11px] text-muted-foreground mt-2 text-center">
          <span>Device</span><span>Problem</span><span>AI Quote</span><span>Pick Shop</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Device */}
        {step === 1 && (
          <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-card/50">
            <h1 className="font-display text-2xl font-bold mb-1">Which device needs repair?</h1>
            <p className="text-sm text-muted-foreground mb-6">Pick a category — we'll match you with experts.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DEVICES.map((d) => {
                const Icon = d.icon;
                const active = device === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDevice(d.id)}
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                      active
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-semibold text-sm">{d.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-8">
              <Button size="lg" disabled={!device} onClick={() => setStep(2)} className="bg-gradient-to-r from-primary to-accent">
                Continue <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Problem + image */}
        {step === 2 && (
          <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-card/50">
            <h1 className="font-display text-2xl font-bold mb-1">Describe the problem</h1>
            <p className="text-sm text-muted-foreground mb-6">Be specific — our AI uses this to estimate cost and parts.</p>

            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium">What's wrong?</Label>
                <Textarea
                  placeholder="e.g. Screen cracked after fall, touch works in 70% area. Battery drains fast."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={5}
                  className="mt-1.5 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{problem.length}/1500 chars</p>
              </div>

              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Camera className="h-4 w-4" /> Photo (optional, helps AI)
                </Label>
                {imagePreview ? (
                  <div className="relative inline-block mt-2">
                    <img src={imagePreview} alt="device" className="h-40 rounded-xl border border-border" />
                    <button
                      onClick={() => { setImagePreview(""); setImageBase64(""); }}
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-2 block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                    />
                    <div className="h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-card/50 flex flex-col items-center justify-center cursor-pointer transition">
                      <Camera className="h-6 w-6 text-muted-foreground mb-1.5" />
                      <span className="text-sm text-muted-foreground">Tap to add a photo</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-8 gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
              <Button
                size="lg"
                disabled={problem.trim().length < 5 || aiLoading}
                onClick={runAiQuote}
                className="bg-gradient-to-r from-primary to-accent shadow-glow"
              >
                {aiLoading ? (<><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Analyzing…</>) :
                  (<><Sparkles className="h-4 w-4 mr-1.5" /> Get AI Quote</>)}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Quote + shop list */}
        {step === 3 && quote && (
          <div className="space-y-6">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-card to-card border-primary/30">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">AI Diagnosis</p>
                    <h2 className="font-display text-xl font-bold">{quote.likely_issue}</h2>
                  </div>
                </div>
                <Badge className={`border ${sevColor(quote.severity)}`}>{quote.severity}</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl bg-card/60 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Estimate</p>
                  <p className="font-bold text-lg">₹{quote.total_min}–{quote.total_max}</p>
                </div>
                <div className="rounded-xl bg-card/60 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Labour</p>
                  <p className="font-bold text-lg">₹{quote.labour_cost}</p>
                </div>
                <div className="rounded-xl bg-card/60 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">ETA</p>
                  <p className="font-bold text-lg flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{quote.eta_hours}h</p>
                </div>
                <div className="rounded-xl bg-card/60 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Confidence</p>
                  <p className="font-bold text-lg capitalize">{quote.confidence}</p>
                </div>
              </div>

              {quote.parts_needed?.length > 0 && (
                <div className="rounded-xl bg-card/60 border border-border p-4 mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" /> Parts likely needed
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {quote.parts_needed.map((p, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">₹{p.est_cost}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-start gap-2 text-sm text-foreground/80 bg-accent/10 border border-accent/20 rounded-xl p-3">
                <Zap className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p>{quote.advice}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> AI estimate only — final cost decided by the shop after inspection.
              </p>
            </Card>

            {/* Shops */}
            <Card className="p-6 bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-bold">Pick a shop near you</h3>
                  <p className="text-xs text-muted-foreground">Verified RepairXpert partners</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadShops} disabled={shopsLoading}>
                  <MapPin className="h-4 w-4 mr-1.5" />
                  {shopsLoading ? "Locating…" : "Refresh"}
                </Button>
              </div>

              {shopsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : shops.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No partner shops near you yet — we'll still route your booking.
                </div>
              ) : (
                <div className="space-y-2">
                  {shops.map((s) => {
                    const active = selectedShop?.user_id === s.user_id;
                    return (
                      <button
                        key={s.user_id}
                        onClick={() => setSelectedShop(s)}
                        className={`w-full text-left rounded-xl border-2 p-4 transition flex items-center gap-3 ${
                          active ? "border-primary bg-primary/10 shadow-glow" : "border-border hover:border-primary/40 bg-card"
                        }`}
                      >
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{s.shop_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.address || "—"}</p>
                        </div>
                        {s.distance_km != null && (
                          <Badge variant="secondary" className="bg-accent/15 text-accent border-0">
                            {s.distance_km.toFixed(1)} km
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
              <Button
                size="lg"
                disabled={!selectedShop}
                onClick={() => setStep(4)}
                className="bg-gradient-to-r from-primary to-accent shadow-glow"
              >
                Continue <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Contact + confirm */}
        {step === 4 && (
          <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-card/50">
            <h1 className="font-display text-2xl font-bold mb-1">Confirm your booking</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Booking with <span className="text-foreground font-semibold">{selectedShop?.shop_name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <Label>Your Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="mt-1.5" />
              </div>
              <div>
                <Label>Mobile Number</Label>
                <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit number" className="mt-1.5" />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 border border-border p-4 mt-6 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Device</span><span className="font-semibold">{device}</span></div>
              {quote && <div className="flex justify-between"><span className="text-muted-foreground">AI Estimate</span><span className="font-semibold">₹{quote.total_min}–{quote.total_max}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Shop</span><span className="font-semibold truncate ml-2">{selectedShop?.shop_name}</span></div>
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
              <Button
                size="lg"
                disabled={submitting}
                onClick={submit}
                className="bg-gradient-to-r from-primary to-accent shadow-glow"
              >
                {submitting ? (<><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Sending…</>) : "Confirm Booking"}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <Card className="p-10 text-center bg-gradient-to-br from-success/10 via-card to-card border-success/30">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-9 w-9 text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Booking sent!</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {selectedShop?.shop_name} will reach out shortly to confirm your repair slot.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/customer/bookings")} className="bg-gradient-to-r from-primary to-accent">
                View My Bookings
              </Button>
              <Button variant="outline" onClick={() => {
                setStep(1); setDevice(""); setProblem(""); setImageBase64(""); setImagePreview("");
                setQuote(null); setSelectedShop(null); setSubmittedId("");
              }}>Book Another</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
