import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Trash2, Package, ShieldCheck, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Cart() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("cart_items")
      .select("*, inventory(*)")
      .eq("user_id", user.id);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const updateQty = async (id: string, quantity: number) => {
    if (quantity < 1) return remove(id);
    await (supabase as any).from("cart_items").update({ quantity }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await (supabase as any).from("cart_items").delete().eq("id", id);
    load();
    toast.success("Item removed from cart");
  };

  const subtotal = items.reduce((s, i) => s + (i.inventory?.sell_price || 0) * i.quantity, 0);

  // Group items by seller
  const bySeller = items.reduce((acc: any, item) => {
    const sid = item.inventory?.user_id;
    if (!sid) return acc;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(item);
    return acc;
  }, {});

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100">
        <Card className="max-w-md w-full text-center p-8 bg-slate-950 border-slate-800 rounded-3xl">
          <ShoppingCart className="h-16 w-16 mx-auto text-indigo-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Login to view cart</h2>
          <p className="text-sm text-slate-500 mb-6">You need to sign in to your Servixo account to see saved items.</p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6">
            <Link to="/auth">Sign In Now</Link>
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
            <Link to="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Continue Shopping
            </Link>
          </Button>
          <h1 className="font-black text-lg text-white">Your Shopping Cart</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-16 text-center bg-slate-950 border-slate-800 rounded-3xl">
            <Package className="h-16 w-16 mx-auto text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">Your cart is empty</h3>
            <p className="text-sm text-slate-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6">
              <Link to="/marketplace">Browse Products</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* List column */}
            <div className="md:col-span-2 space-y-4">
              {Object.entries(bySeller).map(([sellerId, sellerItems]: any) => {
                const sellerSubtotal = sellerItems.reduce((s: number, i: any) => s + (i.inventory?.sell_price || 0) * i.quantity, 0);
                
                return (
                  <Card key={sellerId} className="border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden">
                    <CardContent className="p-5 space-y-4">
                      <div className="text-xs font-black uppercase tracking-wider text-indigo-400 border-b border-slate-900 pb-3 flex items-center gap-1.5">
                        <Store className="h-4 w-4" /> Merchant Order Group
                      </div>

                      <div className="space-y-4">
                        {sellerItems.map((it: any) => {
                          const l = it.inventory;
                          if (!l) return null;
                          return (
                            <div key={it.id} className="flex gap-4 items-center justify-between">
                              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                                {l.image_url ? (
                                  <img src={l.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="h-6 w-6 text-slate-700" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <Link
                                  to={`/marketplace/${l.id}`}
                                  className="font-bold text-sm text-white hover:text-indigo-400 transition-colors line-clamp-1"
                                >
                                  {l.name}
                                </Link>
                                <div className="text-xs text-indigo-400 font-black mt-1">₹{l.sell_price}</div>
                              </div>
                              
                              <div className="flex items-center border border-slate-850 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                  onClick={() => updateQty(it.id, it.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="px-3 text-xs font-bold text-white">{it.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                  onClick={() => updateQty(it.id, it.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-rose-500"
                                onClick={() => remove(it.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between border-t border-slate-900 pt-3 text-xs font-bold text-slate-400">
                        <span>Merchant Subtotal</span>
                        <span className="text-white">₹{sellerSubtotal}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Total Column */}
            <div className="space-y-4">
              <Card className="border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden sticky top-24">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-white">Order Summary</h3>
                  
                  <div className="space-y-2 border-b border-slate-900 pb-4 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-bold text-white">{items.length} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span className="text-emerald-400 font-bold">FREE Delivery</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-400">Total Amount:</span>
                    <span className="text-2xl font-black text-indigo-400">₹{subtotal}</span>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => nav("/checkout")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl py-6 shadow-lg shadow-indigo-600/15"
                  >
                    Proceed to Checkout
                  </Button>

                  <div className="border-t border-slate-900 pt-3 space-y-2 text-[10px] text-slate-500">
                    <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Secure SSL Checkout Protocol</p>
                    <p className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Certified Local Store Warranty</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
