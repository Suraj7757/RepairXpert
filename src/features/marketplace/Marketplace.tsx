import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, ShoppingCart, Heart, Package, MapPin, Star, ShieldCheck,
  ClipboardCheck, User, ChevronDown, Sparkles, Wrench, Store,
  Smartphone, Laptop, Tv2, Battery, Cable, Cpu, ArrowRight, Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Listing {
  id: string;
  user_id: string;
  name: string;
  category: string;
  sell_price: number;
  cost_price: number;
  quantity: number;
  image_url: string;
  description: string;
  created_at: string;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "screen", label: "Screens", icon: Smartphone },
  { id: "battery", label: "Batteries", icon: Battery },
  { id: "charger", label: "Chargers", icon: Cable },
  { id: "accessory", label: "Accessories", icon: Cpu },
  { id: "tools", label: "Repair Kits", icon: Wrench },
  { id: "general", label: "Laptops & TV", icon: Laptop },
];

const HERO_SLIDES = [
  {
    badge: "AI Powered",
    title: "Snap. Diagnose. Book.",
    subtitle: "Describe your device problem — our AI gives an instant quote and connects you to the best-rated shop near you.",
    cta: "Try AI Diagnose",
    href: "/customer/ai-diagnostic",
    icon: Sparkles,
  },
  {
    badge: "Hyperlocal",
    title: "Trusted shops near you",
    subtitle: "Discover verified repair experts within minutes from your location. Doorstep & in-store service.",
    cta: "Find Shops",
    href: "/customer/book",
    icon: MapPin,
  },
  {
    badge: "Genuine Parts",
    title: "Original spare parts, fair prices",
    subtitle: "OEM-grade screens, batteries and components shipped from local sellers — with warranty.",
    cta: "Shop Parts",
    href: "/marketplace",
    icon: ShieldCheck,
  },
];

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [shops, setShops] = useState<Record<string, any>>({});
  const [activeSlide, setActiveSlide] = useState(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setActiveSlide((s) => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("marketplace_listings")
      .select("id, seller_id, title, category, description, price, mrp, stock, images, created_at, featured")
      .eq("active", true)
      .gt("stock", 0);

    if (category !== "all") q = q.eq("category", category);
    if (search) q = q.ilike("title", `%${search}%`);

    if (sort === "price_asc") q = q.order("price", { ascending: true });
    else if (sort === "price_desc") q = q.order("price", { ascending: false });
    else if (sort === "featured") q = q.order("featured", { ascending: false }).order("created_at", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    const { data, error } = await q;
    if (error) toast.error(error.message);
    const rows = (data || []).map((r: any) => ({
      id: r.id,
      user_id: r.seller_id,
      name: r.title,
      category: r.category,
      sell_price: Number(r.price) || 0,
      cost_price: Number(r.mrp) || 0,
      quantity: r.stock,
      image_url: Array.isArray(r.images) ? r.images[0] : "",
      description: r.description,
      created_at: r.created_at,
    })) as Listing[];
    setListings(rows);
    setLoading(false);

    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    if (ids.length) {
      const { data: shopRows } = await (supabase as any).rpc("public_shop_cards", { _ids: ids });
      const map: Record<string, any> = {};
      (shopRows || []).forEach((s: any) => { map[s.user_id] = s; });
      setShops(map);
    }
  };


  const loadCart = async () => {
    if (!user) return;
    const { count } = await (supabase as any)
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    setCartCount(count || 0);
  };

  const loadWishlist = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("wishlists").select("listing_id").eq("user_id", user.id);
    setWishlist(new Set((data || []).map((r: any) => r.listing_id)));
  };

  useEffect(() => { load(); }, [category, sort]);
  useEffect(() => { loadCart(); loadWishlist(); }, [user?.id]);

  const addToCart = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return toast.error("Please login to add items to your cart");
    const { error } = await (supabase as any)
      .from("cart_items")
      .upsert({ user_id: user.id, listing_id: id, quantity: 1 }, { onConflict: "user_id,listing_id" });
    if (error) return toast.error(error.message);
    toast.success("Added to cart");
    loadCart();
  };

  const toggleWishlist = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return toast.error("Please login to save items");
    if (wishlist.has(id)) {
      await (supabase as any).from("wishlists").delete().eq("user_id", user.id).eq("listing_id", id);
      const next = new Set(wishlist); next.delete(id); setWishlist(next);
    } else {
      const { error } = await (supabase as any).from("wishlists").insert({ user_id: user.id, listing_id: id });
      if (error) return toast.error(error.message);
      setWishlist(new Set([...wishlist, id]));
    }
  };

  const slide = HERO_SLIDES[activeSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
              Repair<span className="text-accent">Xpert</span>
            </span>
          </Link>

          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search spare parts, screens, batteries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none text-sm transition"
            />
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link to="/customer/book"><Sparkles className="h-4 w-4 mr-1.5 text-accent" /> AI Book</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link to="/shops"><Store className="h-4 w-4 mr-1.5" /> Shops</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden lg:inline-flex">
              <Link to="/features"><ShieldCheck className="h-4 w-4 mr-1.5" /> For Shops</Link>
            </Button>

            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen((v) => !v)}
                className="h-9 px-3 rounded-lg hover:bg-card transition flex items-center gap-1.5 text-sm"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user ? "Account" : "Sign in"}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-popover border border-border shadow-elevated p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  {user ? (
                    <>
                      <Link to="/customer" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted">Dashboard</Link>
                      <Link to="/my-orders" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted">My Orders</Link>
                      <Link to="/customer/bookings" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted">My Bookings</Link>
                      <Link to="/customer/wallet" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted">Wallet</Link>
                      <div className="h-px bg-border my-1" />
                      <Link to="/customer/settings" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted">Settings</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" className="block px-3 py-2 rounded-lg text-sm font-semibold hover:bg-muted">Sign in / Register</Link>
                      <Link to="/partner-with-us" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted">Become a Shopkeeper</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link to="/cart" className="relative h-9 w-9 rounded-lg hover:bg-card transition flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden border-b border-border/60"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: "var(--gradient-glow)" }} />
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700" key={activeSlide}>
              <Badge className="bg-card border border-primary/30 text-accent font-semibold gap-1.5">
                <Zap className="h-3 w-3" /> {slide.badge}
              </Badge>
              <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                {slide.title}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-glow font-semibold">
                  <Link to={slide.href}>{slide.cta} <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-border bg-card/50 backdrop-blur hover:bg-card">
                  <Link to="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> Verified shops</span>
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-warning" /> 4.8 avg rating</span>
                <span className="flex items-center gap-1.5"><Package className="h-4 w-4 text-info" /> Genuine parts</span>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="relative aspect-square max-w-md ml-auto">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
                <div className="relative h-full rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl p-8 flex flex-col justify-center shadow-elevated">
                  <SlideIcon className="h-16 w-16 text-accent mb-4" />
                  <div className="space-y-3">
                    {["Pick device", "Describe problem", "Get AI quote", "Book a shop"].map((step, i) => (
                      <div key={step} className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary font-bold flex items-center justify-center text-xs">{i + 1}</div>
                        <span className="text-foreground/90">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 mt-8 justify-center md:justify-start">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeSlide ? "bg-accent w-8" : "bg-border w-4"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 flex flex-col items-center gap-2 min-w-[88px] p-3 rounded-2xl border transition-all ${
                  active
                    ? "bg-gradient-to-br from-primary/20 to-accent/10 border-primary/40 shadow-glow"
                    : "bg-card border-border hover:border-primary/30 hover:bg-card/80"
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── LISTINGS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold">Trending parts</h2>
            <p className="text-sm text-muted-foreground">Curated picks from verified shops near you</p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 px-3 rounded-lg bg-card border border-border text-sm outline-none focus:border-primary"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-3 animate-pulse">
                <div className="aspect-square rounded-lg bg-muted mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </Card>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <Card className="p-16 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No products yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Try a different category or search.</p>
            <Button onClick={() => { setCategory("all"); setSearch(""); }} className="mt-4">Reset filters</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => {
              const s = shops[l.user_id] || {};
              const discount = l.cost_price > l.sell_price ? Math.round((1 - l.sell_price / l.cost_price) * 100) : 0;
              return (
                <Card key={l.id} className="group relative overflow-hidden bg-card border-border hover:border-primary/40 hover:shadow-glow transition-all">
                  <button
                    onClick={(e) => toggleWishlist(l.id, e)}
                    className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center hover:bg-background transition"
                  >
                    <Heart className={`h-4 w-4 ${wishlist.has(l.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                  </button>
                  {discount > 0 && (
                    <Badge className="absolute top-2.5 left-2.5 z-10 bg-success text-success-foreground font-bold border-0">{discount}% OFF</Badge>
                  )}

                  <Link to={`/marketplace/${l.id}`} className="block">
                    <div className="aspect-square bg-gradient-to-br from-muted/40 to-card flex items-center justify-center overflow-hidden">
                      {l.image_url ? (
                        <img src={l.image_url} alt={l.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                      )}
                    </div>
                  </Link>

                  <div className="p-3 space-y-2">
                    <Link to={`/marketplace/${l.id}`}>
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition">{l.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Badge variant="secondary" className="bg-success/15 text-success border-0 px-1.5 py-0 h-5 gap-0.5">
                        4.5 <Star className="h-2.5 w-2.5 fill-current" />
                      </Badge>
                      {s.shop_name && (
                        <span className="text-muted-foreground truncate">· {s.shop_name}</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold">₹{l.sell_price}</span>
                      {l.cost_price > l.sell_price && (
                        <span className="text-xs line-through text-muted-foreground">₹{l.cost_price}</span>
                      )}
                    </div>
                    <Button
                      onClick={(e) => addToCart(l.id, e)}
                      size="sm"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold h-8"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Add to cart
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, title: "AI repair quotes", desc: "Describe your problem and get an instant cost estimate." },
            { icon: MapPin, title: "Hyperlocal shops", desc: "Verified technicians near your pincode, ready in minutes." },
            { icon: ClipboardCheck, title: "Warranty backed", desc: "Genuine OEM parts with shop-issued warranty." },
          ].map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="p-5 bg-gradient-to-br from-card to-card/60 border-border hover:border-primary/30 transition">
                <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-base">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/60 bg-card/30 mt-8 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">RepairXpert</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">India's smart platform for repairs, spare parts and shop CRM.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Customers</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/customer/book" className="hover:text-foreground">Book a repair</Link></li>
              <li><Link to="/marketplace" className="hover:text-foreground">Browse parts</Link></li>
              <li><Link to="/customer/ai-diagnostic" className="hover:text-foreground">AI Diagnose</Link></li>
              <li><Link to="/track" className="hover:text-foreground">Track order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Shopkeepers</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
              <li><Link to="/partner-with-us" className="hover:text-foreground">Become a partner</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-foreground">Start free trial</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Merchant login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><a href="mailto:support@repairxpert.in" className="hover:text-foreground">support@repairxpert.in</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} RepairXpert · Built for Indian repair businesses.
        </div>
      </footer>
    </div>
  );
}
