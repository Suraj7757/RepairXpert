import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Phone, MapPin, User, Clock } from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const STATUSES = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "completed", "cancelled"];

const statusColor: Record<string, string> = {
  placed: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  confirmed: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  packed: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  shipped: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
  out_for_delivery: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  delivered: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  completed: "bg-emerald-600/15 text-emerald-700 border-emerald-600/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("marketplace_orders")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = (supabase as any)
      .channel(`mo-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_orders", filter: `seller_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [user?.id]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).rpc("update_marketplace_order_status", { _order_id: id, _status: status, _note: "" });
    if (error) return toast.error(error.message);
    toast.success(`Order marked ${status.replace(/_/g, " ")}`);
    load();
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.fulfillment_status === filter);
  const pendingCount = orders.filter((o) => !["delivered", "completed", "cancelled"].includes(o.fulfillment_status)).length;
  const revenue = orders.filter((o) => ["delivered", "completed"].includes(o.fulfillment_status)).reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Incoming Orders</h1>
            <p className="text-muted-foreground text-sm">Marketplace orders placed for your products</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Card className="px-4 py-2"><span className="text-muted-foreground">Pending</span><div className="font-bold text-lg">{pendingCount}</div></Card>
            <Card className="px-4 py-2"><span className="text-muted-foreground">Revenue</span><div className="font-bold text-lg text-primary">₹{revenue}</div></Card>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All ({orders.length})</Button>
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="capitalize whitespace-nowrap">
              {s}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold">No orders yet</h3>
            <p className="text-sm text-muted-foreground">Once customers buy your listings, orders will appear here in real-time.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <Card key={o.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base font-mono">{o.order_number}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColor[o.fulfillment_status] || ""}>{o.fulfillment_status}</Badge>
                      <Badge variant="secondary">{o.payment_method?.toUpperCase()}</Badge>
                      <Badge variant="outline">{o.payment_status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2"><User className="h-3 w-3" /> {o.buyer_name || "Buyer"}</div>
                      {o.buyer_mobile && <a href={`tel:${o.buyer_mobile}`} className="flex items-center gap-2 text-primary"><Phone className="h-3 w-3" /> {o.buyer_mobile}</a>}
                      {o.buyer_address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-3 w-3 mt-0.5" /> {o.buyer_address}</div>}
                      <div className="flex items-center gap-2 text-muted-foreground text-xs"><Clock className="h-3 w-3" /> {new Date(o.created_at).toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      {(o.items || []).map((it: any, i: number) => (
                        <div key={i} className="flex justify-between border-b pb-1">
                          <span className="line-clamp-1">{it.title} × {it.quantity}</span>
                          <span className="font-semibold">₹{it.line_total}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-1">
                        <span>Total</span><span className="text-primary">₹{o.total}</span>
                      </div>
                    </div>
                  </div>
                  {o.notes && <p className="text-xs text-muted-foreground italic">Note: {o.notes}</p>}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Update status:</span>
                    <Select value={o.fulfillment_status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {o.buyer_mobile && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`https://wa.me/91${o.buyer_mobile.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi ${o.buyer_name}, regarding order ${o.order_number}:`)}`} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
