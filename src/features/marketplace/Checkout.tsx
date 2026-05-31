import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, Package, ShieldCheck, CheckCircle, CreditCard, Landmark, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Checkout() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [sellerQrMap, setSellerQrMap] = useState<Record<string, string[]>>({});
  const [selectedQrBySeller, setSelectedQrBySeller] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: user?.user_metadata?.display_name || "",
    mobile: "",
    address: "",
    payment_method: "cod",
    fulfillment_method: "delivery" as "delivery" | "pickup",
    pickup_date: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) {
      nav("/auth");
      return;
    }
    (async () => {
      const { data } = await (supabase as any)
        .from("cart_items")
        .select("*, inventory(*)")
        .eq("user_id", user.id);
      setItems(data || []);
      
      const sellerIds = Array.from(new Set((data || []).map((i: any) => i.inventory?.user_id).filter(Boolean)));
      if (sellerIds.length > 0) {
        const { data: shops } = await (supabase as any)
          .from("shop_settings")
          .select("user_id, qr_receivers")
          .in("user_id", sellerIds);
        const map: Record<string, string[]> = {};
        (shops || []).forEach((s: any) => {
          map[s.user_id] = (s.qr_receivers && s.qr_receivers.length > 0) ? s.qr_receivers : ["Shop QR"];
        });
        setSellerQrMap(map);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const bySeller = items.reduce((acc: any, item) => {
    const sid = item.inventory?.user_id;
    if (!sid) return acc;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(item);
    return acc;
  }, {});

  const totalAmount = items.reduce((s, i) => s + (i.inventory?.sell_price || 0) * i.quantity, 0);

  const placeOrders = async () => {
    if (placing) return;
    if (!form.name || !form.mobile) {
      toast.error("Please fill name and mobile");
      return;
    }
    if (!/^\d{10}$/.test(form.mobile.replace(/\D/g, ""))) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (form.fulfillment_method === "delivery" && !form.address) {
      toast.error("Delivery address is required");
      return;
    }
    if (form.fulfillment_method === "pickup" && !form.pickup_date) {
      toast.error("Please choose a pickup date");
      return;
    }
    if (form.payment_method === "upi") {
      const missing = Object.keys(bySeller).find((sid) => !selectedQrBySeller[sid]);
      if (missing) {
        toast.error("Please pick a QR receiver for each seller");
        return;
      }
    }
    
    setPlacing(true);
    const created: string[] = [];
    try {
      for (const [sellerId, sellerItems] of Object.entries(bySeller) as any) {
        const itemsPayload = sellerItems.map((it: any) => ({ listing_id: it.listing_id, quantity: it.quantity }));
        const qrChoice = form.payment_method === "upi" ? (selectedQrBySeller[sellerId] || "") : "";
        const notesWithQr = qrChoice ? `${form.notes ? form.notes + "\n" : ""}[Paid to: ${qrChoice}]` : form.notes;
        
        const { data, error } = await (supabase as any).rpc("place_marketplace_order", {
          _seller_id: sellerId,
          _items: itemsPayload,
          _buyer_name: form.name,
          _buyer_mobile: form.mobile,
          _buyer_address: form.address,
          _payment_method: form.payment_method,
          _shipping: 0,
          _notes: notesWithQr,
        });
        
        if (error) {
          toast.error(error.message);
          continue;
        }
        
        if (data) {
          await (supabase as any)
            .from("marketplace_orders")
            .update({
              fulfillment_method: form.fulfillment_method,
              pickup_date: form.fulfillment_method === "pickup" ? form.pickup_date : null,
              qr_receiver: qrChoice || null,
            })
            .eq("id", data);
          created.push(data);
        }
      }
      if (created.length > 0) {
        setOrderIds(created);
        toast.success(`${created.length} order(s) placed!`);
      } else {
        toast.error("No orders were created. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (orderIds.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100">
        <Card className="max-w-md w-full text-center p-8 bg-slate-950 border-slate-800 rounded-3xl space-y-6">
          <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Order Placed Successfully!</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {orderIds.length} order(s) confirmed. Shopkeepers have been notified and will prepare your package shortly.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button asChild className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl py-6">
              <Link to="/my-orders">View Orders</Link>
            </Button>
            <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl py-6">
              <Link to="/marketplace">Shop More</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100">
        <Card className="max-w-md w-full text-center p-8 bg-slate-950 border-slate-800 rounded-3xl">
          <Package className="h-16 w-16 mx-auto text-slate-700 mb-4" />
          <h2 className="text-xl font-bold mb-2">Cart is empty</h2>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6 mt-4">
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button asChild variant="ghost" className="text-slate-400 hover:text-white rounded-xl">
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Cart
            </Link>
          </Button>
          <h1 className="font-black text-lg text-white">Checkout Details</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          {/* Fulfillment Section */}
          <Card className="border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-900 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-400" /> Choose Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 pt-4">
              {[
                { v: "delivery", l: "Home Delivery (Drop at my address)" },
                { v: "pickup", l: "Store Pickup (Collect directly from shop)" },
              ].map((p) => (
                <label
                  key={p.v}
                  className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition ${
                    form.fulfillment_method === p.v
                      ? "bg-indigo-600/10 border-indigo-500/40 text-white"
                      : "border-slate-850 bg-slate-900/40 hover:bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="fm"
                    checked={form.fulfillment_method === p.v}
                    onChange={() => setForm({ ...form, fulfillment_method: p.v as any })}
                    className="accent-indigo-600"
                  />
                  <span className="text-xs font-semibold">{p.l}</span>
                </label>
              ))}
              
              {form.fulfillment_method === "pickup" && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-bold text-slate-400">Preferred Pickup Date *</Label>
                  <Input
                    type="date"
                    value={form.pickup_date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card className="border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-900 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-400" /> Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-400">Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your Name"
                  className="bg-slate-900 border-slate-800 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-400">Mobile Number *</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0,10) })}
                  placeholder="10-digit mobile"
                  maxLength={10}
                  className="bg-slate-900 border-slate-800 text-white font-mono"
                />
              </div>
              {form.fulfillment_method === "delivery" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-400">Delivery Address *</Label>
                  <Textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Enter complete shipping details"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-400">Notes (optional)</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Call before delivery, handle with care..."
                  className="bg-slate-900 border-slate-800 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-900 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-400" /> Choose Payment Option
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 pt-4">
              {[
                { v: "cod", l: "Cash / Pay on Delivery (COD)" },
                { v: "upi", l: "Direct Shopkeeper UPI Transfer (QR Code)" },
              ].map((p) => (
                <label
                  key={p.v}
                  className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition ${
                    form.payment_method === p.v
                      ? "bg-indigo-600/10 border-indigo-500/40 text-white"
                      : "border-slate-850 bg-slate-900/40 hover:bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="pm"
                    checked={form.payment_method === p.v}
                    onChange={() => setForm({ ...form, payment_method: p.v })}
                    className="accent-indigo-600"
                  />
                  <span className="text-xs font-semibold">{p.l}</span>
                </label>
              ))}

              {form.payment_method === "upi" && Object.keys(bySeller).length > 0 && (
                <div className="space-y-3 pt-4 mt-3 border-t border-slate-900">
                  <Label className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                    Select Merchant UPI Account *
                  </Label>
                  <p className="text-[10px] text-slate-500">
                    To pay using UPI, please choose the active receiver account set up by each merchant.
                  </p>
                  
                  {Object.keys(bySeller).map((sid) => {
                    const sellerItems = bySeller[sid];
                    const list = sellerQrMap[sid] || ["Shop QR"];
                    const sellerLabel = sellerItems[0]?.inventory?.name ? `Merchant ${sid.slice(0, 6)}…` : sid;
                    
                    return (
                      <div key={sid} className="rounded-xl border border-slate-850 bg-slate-950 p-3 space-y-2">
                        <p className="text-xs font-bold text-slate-300">{sellerLabel}</p>
                        <div className="flex flex-wrap gap-2">
                          {list.map((qr) => (
                            <button
                              key={qr}
                              type="button"
                              onClick={() => setSelectedQrBySeller({ ...selectedQrBySeller, [sid]: qr })}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                selectedQrBySeller[sid] === qr
                                  ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              {qr}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Column */}
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden sticky top-24">
            <CardHeader className="border-b border-slate-900 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Landmark className="h-4 w-4 text-indigo-400" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 pt-4">
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-4 text-xs text-slate-400">
                    <span className="truncate">{i.inventory?.name} × {i.quantity}</span>
                    <span className="font-bold text-white shrink-0">₹{(i.inventory?.sell_price || 0) * i.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-900 pt-3 flex justify-between items-baseline font-black">
                <span className="text-xs text-slate-400">Grand Total:</span>
                <span className="text-xl text-indigo-400">₹{totalAmount}</span>
              </div>

              {Object.keys(bySeller).length > 1 && (
                <p className="text-[10px] text-amber-500 font-semibold bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                  Notice: Your cart contains items from {Object.keys(bySeller).length} separate shopkeepers. Individual order tickets will be generated.
                </p>
              )}

              <Button
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl py-6 shadow-lg shadow-indigo-600/15"
                onClick={placeOrders}
                disabled={placing}
              >
                {placing ? "Processing..." : `Place Order (₹${totalAmount})`}
              </Button>

              <div className="border-t border-slate-900 pt-3 space-y-2 text-[10px] text-slate-500">
                <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Safe Secure Shopping System</p>
                <p className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Dynamic OTP Receipt Tracking</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
