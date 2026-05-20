import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";
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
    if (!user) { nav("/auth"); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("cart_items")
        .select("*, marketplace_listings(*)")
        .eq("user_id", user.id);
      setItems(data || []);
      // Fetch QR receivers for each unique seller
      const sellerIds = Array.from(new Set((data || []).map((i: any) => i.marketplace_listings?.seller_id).filter(Boolean)));
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
    const sid = item.marketplace_listings?.seller_id;
    if (!sid) return acc;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(item);
    return acc;
  }, {});

  const totalAmount = items.reduce((s, i) => s + (i.marketplace_listings?.price || 0) * i.quantity, 0);

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
        if (error) { toast.error(error.message); continue; }
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


  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (orderIds.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center p-8">
          <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {orderIds.length} order(s) confirmed. Sellers have been notified and will contact you shortly.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild><Link to="/my-orders">View Orders</Link></Button>
            <Button asChild variant="outline"><Link to="/marketplace">Continue Shopping</Link></Button>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center p-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Cart is empty</h2>
          <Button asChild><Link to="/marketplace">Browse Marketplace</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm"><Link to="/cart"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Cart</Link></Button>
          <h1 className="font-bold">Checkout</h1>
          <div />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Fulfillment</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { v: "delivery", l: "Home Delivery (drop at my address)" },
                { v: "pickup", l: "Pickup from shop" },
              ].map((p) => (
                <label key={p.v} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="fm" checked={form.fulfillment_method === p.v} onChange={() => setForm({ ...form, fulfillment_method: p.v as any })} />
                  <span className="text-sm">{p.l}</span>
                </label>
              ))}
              {form.fulfillment_method === "pickup" && (
                <div><Label>Preferred Pickup Date *</Label><Input type="date" value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} /></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Customer Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Mobile Number *</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="10-digit mobile" /></div>
              {form.fulfillment_method === "delivery" && (
                <div><Label>Delivery Address *</Label><Textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              )}
              <div><Label>Notes (optional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Payment Method</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { v: "cod", l: "Cash on Delivery" },
                { v: "upi", l: "UPI / QR (pay seller directly)" },
              ].map((p) => (
                <label key={p.v} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input type="radio" name="pm" checked={form.payment_method === p.v} onChange={() => setForm({ ...form, payment_method: p.v })} />
                  <span className="text-sm">{p.l}</span>
                </label>
              ))}

              {form.payment_method === "upi" && Object.keys(bySeller).length > 0 && (
                <div className="space-y-3 pt-3 mt-2 border-t">
                  <Label className="text-sm font-semibold">Choose QR receiver per seller *</Label>
                  {Object.keys(bySeller).map((sid) => {
                    const sellerItems = bySeller[sid];
                    const list = sellerQrMap[sid] || ["Shop QR"];
                    const sellerLabel = sellerItems[0]?.marketplace_listings?.title ? `Seller ${sid.slice(0, 6)}…` : sid;
                    return (
                      <div key={sid} className="rounded-md border p-2 space-y-1">
                        <p className="text-xs text-muted-foreground">{sellerLabel}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((qr) => (
                            <button
                              key={qr}
                              type="button"
                              onClick={() => setSelectedQrBySeller({ ...selectedQrBySeller, [sid]: qr })}
                              className={`text-xs px-2.5 py-1 rounded-full border transition ${selectedQrBySeller[sid] === qr ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
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

        <div>
          <Card className="sticky top-4">
            <CardHeader><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1">{i.marketplace_listings?.title} × {i.quantity}</span>
                  <span className="shrink-0">₹{(i.marketplace_listings?.price || 0) * i.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span><span className="text-primary text-lg">₹{totalAmount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(bySeller).length > 1 && `${Object.keys(bySeller).length} separate orders will be created (one per seller).`}
              </p>
              <Button size="lg" className="w-full" onClick={placeOrders} disabled={placing}>
                {placing ? "Placing..." : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
