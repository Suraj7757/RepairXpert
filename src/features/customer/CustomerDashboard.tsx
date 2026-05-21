import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Package, Store, CalendarCheck, Phone, CheckCircle2,
  Clock, ChevronRight, ShoppingBag, Wrench,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopApplication, setShopApplication] = useState<any>(undefined); // undefined = loading

  // Form State
  const [requestType, setRequestType] = useState<"repair" | "buy">("repair");
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [form, setForm] = useState({
    device_brand: "",
    device_model: "",
    problem_description: "",
    preferred_date: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    if (!user?.email) return;
    setLoading(true);
    const [ordersRes, shopsRes, appRes] = await Promise.all([
      (supabase as any)
        .from("booking_requests")
        .select("*")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("shop_settings")
        .select("user_id, shop_name, address, phone, booking_slug")
        .eq("booking_enabled", true)
        .limit(20),
      (supabase as any)
        .from("shopkeeper_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setOrders(ordersRes.data || []);
    setShops(shopsRes.data || []);
    setShopApplication(appRes.data ?? null);
    if (shopsRes.data && shopsRes.data.length > 0) {
      setSelectedShopId(shopsRes.data[0].user_id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboardData(); }, [user?.id]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!selectedShopId) { toast.error("Please select a shop first"); return; }
    if (!form.device_brand || !form.problem_description) { toast.error("Please fill all required fields"); return; }

    setSubmitting(true);
    const prefix = requestType === "buy" ? "[BUY REQUEST] " : "[REPAIR] ";
    try {
      const { error } = await (supabase as any).from("booking_requests").insert({
        customer_name: user?.user_metadata?.display_name || "Customer",
        customer_mobile: user?.user_metadata?.mobile || "",
        customer_email: user?.email,
        device_brand: form.device_brand,
        device_model: form.device_model,
        problem_description: prefix + form.problem_description,
        preferred_date: form.preferred_date || null,
        user_id: selectedShopId,
      });
      if (error) { toast.error(error.message); return; }
      setSubmitted(true);
      fetchDashboardData();
    } finally { setSubmitting(false); }
  };

  const statusColor: Record<string, string> = {
    pending:     "bg-amber-100 text-amber-700 border-amber-200",
    accepted:    "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
    ready:       "bg-teal-100 text-teal-700 border-teal-200",
    completed:   "bg-green-100 text-green-700 border-green-200",
    rejected:    "bg-rose-100 text-rose-700 border-rose-200",
    converted:   "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">
              Hello, {user?.user_metadata?.display_name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage repair requests, track orders and browse shops.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/marketplace">
              <Button variant="outline" className="gap-2"><ShoppingBag className="h-4 w-4" /> Browse Shop</Button>
            </Link>
<<<<<<< HEAD
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent("open-rx-track"))}
            >
              <Search className="h-4 w-4" /> Track Order
            </Button>
=======
            <Link to="/track">
              <Button variant="outline" className="gap-2"><Search className="h-4 w-4" /> Track Order</Button>
            </Link>
>>>>>>> c408fdbab0c70d405e0ef64a0ca7825de86b9241
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Create Request Form */}
            <Card className="border-primary/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Store className="h-32 w-32" />
              </div>
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" /> Request Repair or Buy Part
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {submitted ? (
                  <div className="py-8 text-center space-y-4">
                    <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
                    <h2 className="text-2xl font-bold">Request Sent!</h2>
                    <p className="text-muted-foreground">The shop will contact you shortly.</p>
                    <Button onClick={() => { setSubmitted(false); setForm({ device_brand: "", device_model: "", problem_description: "", preferred_date: "" }); }}>
                      Create Another Request
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={submitRequest} className="space-y-5">
                    <div className="flex gap-3 p-1 bg-muted rounded-xl w-fit">
                      <Button type="button" variant={requestType === "repair" ? "default" : "ghost"} onClick={() => setRequestType("repair")} className="rounded-lg px-5">
                        <Wrench className="h-4 w-4 mr-1" /> Repair
                      </Button>
                      <Button type="button" variant={requestType === "buy" ? "default" : "ghost"} onClick={() => setRequestType("buy")} className="rounded-lg px-5">
                        <ShoppingBag className="h-4 w-4 mr-1" /> Buy Item
                      </Button>
                    </div>
                    <div>
                      <Label>Select Shop *</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                        value={selectedShopId} onChange={(e) => setSelectedShopId(e.target.value)} required
                      >
                        <option value="" disabled>Select a shop...</option>
                        {shops.map((s) => (
                          <option key={s.user_id} value={s.user_id}>{s.shop_name}{s.address ? ` (${s.address})` : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Device Brand *</Label>
                        <Input placeholder="Samsung, Apple..." value={form.device_brand} onChange={(e) => setForm({ ...form, device_brand: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Device Model</Label>
                        <Input placeholder="Galaxy S21..." value={form.device_model} onChange={(e) => setForm({ ...form, device_model: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>{requestType === "repair" ? "Describe the problem *" : "What do you want to buy? *"}</Label>
                      <Textarea
                        placeholder={requestType === "repair" ? "Screen is cracked..." : "Looking for original charger..."}
                        value={form.problem_description} onChange={(e) => setForm({ ...form, problem_description: e.target.value })}
                        rows={3} required
                      />
                    </div>
                    <Button type="submit" className="w-full font-bold" size="lg" disabled={submitting}>
                      {submitting ? "Submitting..." : `Submit ${requestType === "repair" ? "Repair" : "Buy"} Request`}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* My Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" /> My Requests & Bookings
                  <Badge variant="secondary" className="ml-auto">{orders.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground py-4">Loading your history...</p>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No requests submitted yet.</p>
                    <p className="text-xs mt-1">Book a repair or buy request above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className="p-4 rounded-xl border hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold">{o.device_brand} {o.device_model}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{o.problem_description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border shrink-0 ${statusColor[o.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {(o.status || "pending").replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Track Order */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" /> Track Repair Job
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Enter the tracking ID given by the shop.</p>
                <Input
                  placeholder="e.g. JSAM0042K9X"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                />
<<<<<<< HEAD
                <Button
                  className="w-full"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("open-rx-track", {
                        detail: { id: trackingId },
                      })
                    )
                  }
                >
                  Track Status
=======
                <Button className="w-full" asChild>
                  <Link to={`/track${trackingId ? `?id=${trackingId}` : ""}`}>Track Status</Link>
>>>>>>> c408fdbab0c70d405e0ef64a0ca7825de86b9241
                </Button>
              </CardContent>
            </Card>

            {/* Become a Shopkeeper — Not applied yet */}
            {shopApplication === null && (
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-5 w-5 text-amber-600" />
                    <p className="font-black text-amber-800">Own a Repair Shop?</p>
                  </div>
                  <p className="text-xs text-amber-700 mb-3">
                    Register on RepairXpert and get online bookings from customers.
                  </p>
                  <ul className="space-y-1 mb-4 text-xs text-amber-700">
                    {["Online booking page", "Manage repair jobs", "Staff management", "Sales & inventory"].map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black"
                    onClick={() => navigate("/become-shopkeeper")}
                  >
                    🏪 Become a Shopkeeper <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Application Pending */}
            {shopApplication?.status === "pending" && (
              <Card className="border-amber-200 bg-amber-50/50 shadow">
                <CardContent className="p-5 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center mx-auto">
                    <Clock className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <p className="font-black text-amber-700">Application Under Review</p>
                  <p className="text-xs text-amber-600">
                    Your shop <strong>{shopApplication.shop_name}</strong> is being reviewed by our team.
                  </p>
                  <p className="text-[10px] text-muted-foreground">Approval takes 12–24 hours</p>
                  <Button variant="outline" size="sm" className="w-full text-amber-600 border-amber-300"
                    onClick={() => navigate("/become-shopkeeper")}>
                    View Application Status
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Application Approved */}
            {shopApplication?.status === "approved" && (
              <Card className="border-emerald-200 bg-emerald-50/50 shadow">
                <CardContent className="p-5 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <p className="font-black text-emerald-700">Shop Approved! 🎉</p>
                  <p className="text-xs text-emerald-600">
                    <strong>{shopApplication.shop_name}</strong> is live on RepairXpert
                  </p>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-black"
                    onClick={() => navigate("/dashboard")}>
                    Open Shop Dashboard →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Application Rejected */}
            {shopApplication?.status === "rejected" && (
              <Card className="border-rose-200 bg-rose-50/50 shadow">
                <CardContent className="p-5 text-center space-y-3">
                  <p className="font-black text-rose-700">Application Rejected</p>
                  {shopApplication.rejection_reason && (
                    <p className="text-xs text-muted-foreground">Reason: {shopApplication.rejection_reason}</p>
                  )}
                  <Button variant="outline" size="sm" className="w-full text-rose-600 border-rose-300"
                    onClick={() => navigate("/become-shopkeeper")}>
                    Reapply →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Nearby Shops */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" /> Nearby Shops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shops.slice(0, 5).map((s) => (
                    <div key={s.user_id} className="p-3 rounded-xl border hover:border-primary/50 transition bg-card/50">
                      <div className="font-bold text-sm">{s.shop_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 mb-2">{s.address || "No address"}</div>
                      <div className="flex gap-2">
                        {s.booking_slug && (
                          <Button asChild size="sm" variant="default" className="flex-1 h-7 text-xs">
                            <Link to={`/book/${s.booking_slug}`}>Book Now</Link>
                          </Button>
                        )}
                        {s.phone && (
                          <Button size="sm" variant="outline"
                            className="flex-none h-7 text-xs bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                            onClick={() => window.open(`https://wa.me/${s.phone}`, "_blank")}>
                            <Phone className="h-3 w-3 mr-1" /> WA
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {shops.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-xl text-sm">
                      No registered shops found.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
