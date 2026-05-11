import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Heart, Store, Package, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Listing {
  id: string;
  seller_id: string;
  seller_type: string;
  title: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
  location: string;
  featured: boolean;
  rating_avg: number;
}

const CATEGORIES = ["all", "general", "screen", "battery", "charger", "accessory", "tools", "other"];

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cartCount, setCartCount] = useState(0);

  const [shops, setShops] = useState<Record<string, { shop_name?: string; address?: string; phone?: string }>>({});

  const load = async () => {
    setLoading(true);
    let q = (supabase as any).from("marketplace_listings").select("*").eq("active", true).order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(60);
    if (category !== "all") q = q.eq("category", category);
    if (search) q = q.ilike("title", `%${search}%`);
    const { data } = await q;
    const rows = data || [];
    setListings(rows);
    setLoading(false);

    // fetch shop info for unique sellers
    const ids = Array.from(new Set(rows.map((r: any) => r.seller_id)));
    if (ids.length) {
      const { data: shopRows } = await (supabase as any)
        .from("shop_settings")
        .select("user_id, shop_name, address, phone")
        .in("user_id", ids);
      const map: Record<string, any> = {};
      (shopRows || []).forEach((s: any) => { map[s.user_id] = s; });
      setShops(map);
    }
  };

  const loadCart = async () => {
    if (!user) return;
    const { count } = await (supabase as any).from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    setCartCount(count || 0);
  };

  useEffect(() => { load(); }, [category]);
  useEffect(() => { loadCart(); }, [user?.id]);

  const addToCart = async (listing_id: string) => {
    if (!user) { toast.error("Please login to add to cart"); return; }
    const { error } = await (supabase as any).from("cart_items").upsert({ user_id: user.id, listing_id, quantity: 1 }, { onConflict: "user_id,listing_id" });
    if (error) return toast.error(error.message);
    toast.success("Added to cart");
    loadCart();
  };

  const addToWishlist = async (listing_id: string) => {
    if (!user) { toast.error("Please login"); return; }
    const { error } = await (supabase as any).from("wishlists").upsert({ user_id: user.id, listing_id }, { onConflict: "user_id,listing_id" });
    if (error) return toast.error(error.message);
    toast.success("Saved to wishlist");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / search */}
      <header className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" /> Marketplace
          </Link>
          <div className="flex-1 max-w-xl w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts, accessories, devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4 mr-1" /> Cart
                {cartCount > 0 && <Badge className="ml-2 h-5 min-w-5 px-1.5">{cartCount}</Badge>}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"><Link to="/my-orders">Orders</Link></Button>
            {!user && <Button asChild size="sm"><Link to="/auth">Login</Link></Button>}
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-7xl mx-auto px-4 pb-4 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
              className="capitalize whitespace-nowrap"
            >
              {c}
            </Button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-t" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No listings found</h3>
            <p className="text-sm text-muted-foreground">Try a different category or search.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => (
              <Card key={l.id} className="group hover:shadow-lg transition overflow-hidden">
                <Link to={`/marketplace/${l.id}`}>
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {l.featured && <Badge className="absolute top-2 left-2">Featured</Badge>}
                    {l.seller_type === "wholesaler" && <Badge variant="secondary" className="absolute top-2 right-2">Bulk</Badge>}
                  </div>
                </Link>
                <CardContent className="p-3 space-y-2">
                  <Link to={`/marketplace/${l.id}`}>
                    <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary">{l.title}</h3>
                  </Link>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">₹{l.price}</span>
                    {l.mrp > l.price && <span className="text-xs line-through text-muted-foreground">₹{l.mrp}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {l.stock > 0 ? `${l.stock} in stock` : "Out of stock"}
                  </div>
                  {shops[l.seller_id] && (
                    <div className="text-[11px] text-muted-foreground border-t pt-1.5 space-y-0.5">
                      <div className="flex items-center gap-1 font-medium text-foreground/80 line-clamp-1">
                        <Store className="h-3 w-3 shrink-0" /> {shops[l.seller_id].shop_name || "Shop"}
                      </div>
                      {(shops[l.seller_id].address || l.location) && (
                        <div className="flex items-center gap-1 line-clamp-1">
                          <MapPin className="h-3 w-3 shrink-0" /> {shops[l.seller_id].address || l.location}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => addToCart(l.id)} disabled={l.stock === 0}>
                      <ShoppingCart className="h-3 w-3 mr-1" /> Add
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addToWishlist(l.id)}>
                      <Heart className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
