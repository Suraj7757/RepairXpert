import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Store, ArrowLeft, Package, Phone, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ListingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any).rpc("get_marketplace_listing", { _id: id });
      if (error || !data) { toast.error("Listing not found"); nav("/marketplace"); return; }
      setData(data);
      setLoading(false);
    })();
  }, [id]);

  const addToCart = async () => {
    if (!user) { toast.error("Please login"); nav("/auth"); return; }
    const { error } = await (supabase as any).from("cart_items").upsert({ user_id: user.id, listing_id: id, quantity: qty }, { onConflict: "user_id,listing_id" });
    if (error) return toast.error(error.message);
    toast.success("Added to cart");
  };

  const buyNow = async () => {
    if (!user) { toast.error("Please login"); nav("/auth"); return; }
    await addToCart();
    nav("/checkout");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  const l = data.listing;
  const s = data.seller;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm"><Link to="/marketplace"><ArrowLeft className="h-4 w-4 mr-1" /> Marketplace</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/cart"><ShoppingCart className="h-4 w-4 mr-1" /> Cart</Link></Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-2xl overflow-hidden flex items-center justify-center">
          {l.images?.[0] ? (
            <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-24 w-24 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-5">
          <div>
            {l.featured && <Badge className="mb-2">Featured</Badge>}
            <h1 className="text-3xl font-bold">{l.title}</h1>
            <p className="text-sm text-muted-foreground capitalize mt-1">{l.category} · {l.seller_type}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-primary">₹{l.price}</span>
            {l.mrp > l.price && <span className="text-lg line-through text-muted-foreground">₹{l.mrp}</span>}
            {l.mrp > l.price && <Badge variant="secondary">{Math.round((1 - l.price / l.mrp) * 100)}% off</Badge>}
          </div>

          <div className="text-sm">
            <span className={l.stock > 0 ? "text-emerald-600" : "text-destructive"}>
              {l.stock > 0 ? `In stock (${l.stock} available)` : "Out of stock"}
            </span>
            {l.moq > 1 && <span className="text-muted-foreground ml-2">· MOQ: {l.moq}</span>}
          </div>

          {l.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{l.description}</p>}

          <div className="flex items-center gap-3">
            <span className="text-sm">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <Button size="sm" variant="ghost" onClick={() => setQty(Math.max(l.moq || 1, qty - 1))}>-</Button>
              <span className="px-4 font-semibold">{qty}</span>
              <Button size="sm" variant="ghost" onClick={() => setQty(Math.min(l.stock, qty + 1))}>+</Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button size="lg" className="flex-1" onClick={addToCart} disabled={l.stock === 0}>
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </Button>
            <Button size="lg" variant="default" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={buyNow} disabled={l.stock === 0}>
              Buy Now
            </Button>
          </div>

          {s && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold"><Store className="h-4 w-4" /> {s.shop_name || "Seller"}</div>
                {s.address && <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.address}</div>}
                {s.phone && <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</div>}
                {(s.map_url || (s.map_lat && s.map_lng)) && (
                  <a
                    href={s.map_url || `https://www.google.com/maps?q=${s.map_lat},${s.map_lng}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <MapPin className="h-3 w-3" /> Open in Google Maps
                  </a>
                )}
                {s.booking_slug && (
                  <Button asChild size="sm" variant="outline" className="w-full mt-2">
                    <Link to={`/shop/${s.booking_slug}`}>Visit Shop Page</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
