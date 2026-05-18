import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Heart, Store, Package, MapPin, SlidersHorizontal, X } from "lucide-react";
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
const SORTS: Record<string, string> = {
  featured: "Featured",
  newest: "Newest",
  price_asc: "Price: Low → High",
  price_desc: "Price: High → Low",
};

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const [shops, setShops] = useState<Record<string, { shop_name?: string; address?: string; phone?: string; map_url?: string; map_lat?: number; map_lng?: number; booking_slug?: string }>>({});

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("marketplace_listings")
      .select("*")
      .eq("active", true)
      .gt("stock", 0)
      .limit(60);
    if (category !== "all") q = q.eq("category", category);
    if (search) q = q.ilike("title", `%${search}%`);
    if (minPrice) q = q.gte("price", Number(minPrice));
    if (maxPrice) q = q.lte("price", Number(maxPrice));

    if (sort === "price_asc") q = q.order("price", { ascending: true });
    else if (sort === "price_desc") q = q.order("price", { ascending: false });
    else if (sort === "newest") q = q.order("created_at", { ascending: false });
    else q = q.order("featured", { ascending: false }).order("created_at", { ascending: false });

    const { data } = await q;
    const rows = data || [];
    setListings(rows);
    setLoading(false);

    const ids = Array.from(new Set(rows.map((r: any) => r.seller_id)));
    if (ids.length) {
      const { data: shopRows } = await (supabase as any)
        .from("shop_settings")
        .select("user_id, shop_name, address, phone, map_url, map_lat, map_lng, booking_slug")
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

  const loadWishlist = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("wishlists").select("listing_id").eq("user_id", user.id);
    setWishlist(new Set((data || []).map((r: any) => r.listing_id)));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category, sort]);
  useEffect(() => { loadCart(); loadWishlist(); /* eslint-disable-next-line */ }, [user?.id]);

  const addToCart = async (listing_id: string) => {
    if (!user) { toast.error("Please login to add to cart"); return; }
    const { error } = await (supabase as any).from("cart_items").upsert({ user_id: user.id, listing_id, quantity: 1 }, { onConflict: "user_id,listing_id" });
    if (error) return toast.error(error.message);
    toast.success("Added to cart");
    loadCart();
  };

  const toggleWishlist = async (listing_id: string) => {
    if (!user) { toast.error("Please login"); return; }
    if (wishlist.has(listing_id)) {
      await (supabase as any).from("wishlists").delete().eq("user_id", user.id).eq("listing_id", listing_id);
      const next = new Set(wishlist); next.delete(listing_id); setWishlist(next);
      toast.success("Removed from wishlist");
    } else {
      const { error } = await (supabase as any).from("wishlists").insert({ user_id: user.id, listing_id });
      if (error) return toast.error(error.message);
      setWishlist(new Set([...wishlist, listing_id]));
      toast.success("Saved to wishlist");
    }
  };

  const applyFilters = () => { setFiltersOpen(false); load(); };
  const clearFilters = () => { setMinPrice(""); setMaxPrice(""); setSearch(""); setCategory("all"); setSort("featured"); setTimeout(load, 0); };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / search */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 items-center justify-between">
          <Link to="/" className="text-xl font-bold flex items-center gap-2 shrink-0">
            <Store className="h-5 w-5 text-primary" /> Marketplace
          </Link>
          <div className="flex-1 max-w-xl w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts, accessories, devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4 mr-1" /> Cart
                {cartCount > 0 && <Badge className="ml-2 h-5 min-w-5 px-1.5">{cartCount}</Badge>}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex"><Link to="/my-orders">Orders</Link></Button>
            {!user && <Button asChild size="sm"><Link to="/auth">Login</Link></Button>}
          </div>
        </div>

        {/* Categories + sort */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 items-center">
          <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-none">
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
          <Button size="sm" variant="outline" onClick={() => setFiltersOpen((s) => !s)} className="shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px] h-9 shrink-0 hidden md:flex"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SORTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtersOpen && (
          <div className="border-t bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Min ₹</label>
                <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-9 w-28" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max ₹</label>
                <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-9 w-28" />
              </div>
              <div className="md:hidden">
                <label className="text-xs text-muted-foreground">Sort</label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SORTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={applyFilters}>Apply</Button>
              <Button size="sm" variant="ghost" onClick={clearFilters}><X className="h-3 w-3 mr-1" />Clear</Button>
            </div>
          </div>
        )}
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
            <p className="text-sm text-muted-foreground">Try a different category, search, or clear filters.</p>
          </Card>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">{listings.length} products</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((l) => {
                const s = shops[l.seller_id] || {};
                const discount = l.mrp > l.price ? Math.round((1 - l.price / l.mrp) * 100) : 0;
                return (
                  <Card key={l.id} className="group hover:shadow-lg transition overflow-hidden flex flex-col">
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
                        {discount > 0 && <Badge variant="destructive" className="absolute top-2 right-2">{discount}% OFF</Badge>}
                        {l.seller_type === "wholesaler" && <Badge variant="secondary" className="absolute bottom-2 left-2">Bulk</Badge>}
                      </div>
                    </Link>
                    <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                      <Link to={`/marketplace/${l.id}`}>
                        <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary min-h-[2.5rem]">{l.title}</h3>
                      </Link>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">₹{l.price}</span>
                        {l.mrp > l.price && <span className="text-xs line-through text-muted-foreground">₹{l.mrp}</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground space-y-0.5 border-t pt-1.5 mt-auto">
                        <div className="flex items-center gap-1 font-medium text-foreground/80 line-clamp-1">
                          <Store className="h-3 w-3 shrink-0" />
                          {s.booking_slug ? (
                            <Link to={`/shop/${s.booking_slug}`} className="hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                              {s.shop_name || "Verified Shop"}
                            </Link>
                          ) : (
                            <span>{s.shop_name || "Verified Shop"}</span>
                          )}
                        </div>
                        {(s.address || l.location) && (
                          <div className="flex items-center gap-1 line-clamp-1">
                            <MapPin className="h-3 w-3 shrink-0" /> {s.address || l.location}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => addToCart(l.id)} disabled={l.stock === 0}>
                          <ShoppingCart className="h-3 w-3 mr-1" /> Add
                        </Button>
                        <Button
                          size="sm"
                          variant={wishlist.has(l.id) ? "default" : "outline"}
                          className="h-8 px-2"
                          onClick={() => toggleWishlist(l.id)}
                        >
                          <Heart className={`h-3 w-3 ${wishlist.has(l.id) ? "fill-current" : ""}`} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
