import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Trash2, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Cart() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("cart_items")
      .select("*, marketplace_listings(*)")
      .eq("user_id", user.id);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const updateQty = async (id: string, quantity: number) => {
    if (quantity < 1) return remove(id);
    await (supabase as any).from("cart_items").update({ quantity }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await (supabase as any).from("cart_items").delete().eq("id", id);
    load();
  };

  const subtotal = items.reduce((s, i) => s + (i.marketplace_listings?.price || 0) * i.quantity, 0);

  // Group items by seller (orders are per-seller)
  const bySeller = items.reduce((acc: any, item) => {
    const sid = item.marketplace_listings?.seller_id;
    if (!sid) return acc;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(item);
    return acc;
  }, {});

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center p-8">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Login to view cart</h2>
          <Button asChild className="mt-4"><Link to="/auth">Login</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm"><Link to="/marketplace"><ArrowLeft className="h-4 w-4 mr-1" /> Continue Shopping</Link></Button>
          <h1 className="font-bold">Your Cart</h1>
          <div />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <Button asChild><Link to="/marketplace">Browse Marketplace</Link></Button>
          </Card>
        ) : (
          <>
            {Object.entries(bySeller).map(([sellerId, sellerItems]: any) => {
              const sellerSubtotal = sellerItems.reduce((s: number, i: any) => s + (i.marketplace_listings?.price || 0) * i.quantity, 0);
              return (
                <Card key={sellerId}>
                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs text-muted-foreground border-b pb-2">Seller order</div>
                    {sellerItems.map((it: any) => {
                      const l = it.marketplace_listings;
                      if (!l) return null;
                      return (
                        <div key={it.id} className="flex gap-3 items-center">
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link to={`/marketplace/${l.id}`} className="font-medium text-sm line-clamp-1 hover:text-primary">{l.title}</Link>
                            <div className="text-sm text-primary font-bold">₹{l.price}</div>
                          </div>
                          <div className="flex items-center border rounded-lg">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateQty(it.id, it.quantity - 1)}>-</Button>
                            <span className="px-3 text-sm">{it.quantity}</span>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateQty(it.id, it.quantity + 1)}>+</Button>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      );
                    })}
                    <div className="flex justify-between border-t pt-2 text-sm">
                      <span>Seller subtotal</span>
                      <span className="font-bold">₹{sellerSubtotal}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="sticky bottom-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total ({items.length} items)</div>
                  <div className="text-2xl font-bold text-primary">₹{subtotal}</div>
                </div>
                <Button size="lg" onClick={() => nav("/checkout")}>Checkout</Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
