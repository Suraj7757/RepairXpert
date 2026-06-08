import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Phone, Star, Package, ArrowLeft, Calendar, ShoppingCart, Wrench, Smartphone, Laptop, Tv2, Printer, Watch, Headphones, Clock } from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  "Mobile Repair": Smartphone,
  "Laptop Repair": Laptop,
  "TV / LED Repair": Tv2,
  "Printer Repair": Printer,
  "Smartwatch Repair": Watch,
  "Audio Devices": Headphones,
  Other: Wrench,
};

export default function ShopPublicPage() {
  const { slug } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [rating, setRating] = useState<{ count: number; average: number } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: shopData } = await (supabase as any).rpc("get_shop_by_slug", { _slug: slug });
      if (!shopData) { setLoading(false); return; }
      setShop(shopData);

      const [{ data: full }, { data: ls }, { data: rs }, { data: revs }, { data: svcs }] = await Promise.all([
        (supabase as any).from("shop_settings").select("address, phone, map_url, map_lat, map_lng").eq("user_id", shopData.user_id).maybeSingle(),
        (supabase as any).from("inventory").select("*").eq("user_id", shopData.user_id).eq("is_marketplace_listed", true).gt("quantity", 0).order("created_at", { ascending: false }),
        (supabase as any).rpc("get_shop_rating_summary", { _user_id: shopData.user_id }),
        (supabase as any).from("shop_reviews").select("rating, comment, customer_name, created_at").eq("user_id", shopData.user_id).eq("status", "approved").order("created_at", { ascending: false }).limit(20),
        (supabase as any).from("services").select("*").eq("user_id", shopData.user_id).eq("status", "Active").order("popular", { ascending: false }),
      ]);
      setShop({ ...shopData, ...(full || {}) });
      setListings(ls || []);
      setRating(rs || { count: 0, average: 0 });
      setReviews(revs || []);
      setServices(svcs || []);
      setLoading(false);

      // SEO: title, description, canonical, Open Graph
      const url = `${window.location.origin}/shop/${slug}`;
      const title = `${shopData.shop_name} — RepairXpert`;
      const desc = `${shopData.shop_name}${shopData.address ? ` at ${shopData.address}` : ""}. Browse products, book repairs and contact the shop directly on RepairXpert.`;
      const image = (ls && ls[0]?.image_url) || `${window.location.origin}/placeholder.svg`;

      document.title = title;
      const upsert = (selector: string, attrs: Record<string, string>) => {
        let el = document.head.querySelector(selector) as HTMLElement | null;
        if (!el) {
          el = document.createElement(selector.startsWith("link") ? "link" : "meta");
          document.head.appendChild(el);
        }
        Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
      };
      upsert('meta[name="description"]', { name: "description", content: desc });
      upsert('link[rel="canonical"]', { rel: "canonical", href: url });
      upsert('meta[property="og:title"]', { property: "og:title", content: title });
      upsert('meta[property="og:description"]', { property: "og:description", content: desc });
      upsert('meta[property="og:url"]', { property: "og:url", content: url });
      upsert('meta[property="og:type"]', { property: "og:type", content: "website" });
      upsert('meta[property="og:image"]', { property: "og:image", content: image });
      upsert('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
      upsert('meta[name="twitter:title"]', { name: "twitter:title", content: title });
      upsert('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
      upsert('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    })();
  }, [slug]);


  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!shop) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md text-center p-8">
        <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-xl font-bold mb-2">Shop not found</h2>
        <Button asChild className="mt-2"><Link to="/marketplace">Browse Marketplace</Link></Button>
      </Card>
    </div>
  );

  const mapHref = shop.map_url || (shop.map_lat && shop.map_lng ? `https://www.google.com/maps?q=${shop.map_lat},${shop.map_lng}` : null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm"><Link to="/marketplace"><ArrowLeft className="h-4 w-4 mr-1" /> Marketplace</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/cart"><ShoppingCart className="h-4 w-4 mr-1" /> Cart</Link></Button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold">{shop.shop_name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {rating && rating.count > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating.average} ({rating.count})
                </Badge>
              )}
              <Badge variant="outline">{listings.length} products</Badge>
              {shop.booking_enabled && <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Accepting bookings</Badge>}
            </div>
            {shop.address && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {shop.address}</p>}
            <div className="flex flex-wrap gap-2 pt-2">
              {shop.phone && <Button asChild size="sm" variant="outline"><a href={`tel:${shop.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a></Button>}
              {mapHref && <Button asChild size="sm" variant="outline"><a href={mapHref} target="_blank" rel="noreferrer"><MapPin className="h-3 w-3 mr-1" /> Directions</a></Button>}
              {shop.booking_enabled && <Button asChild size="sm"><Link to={`/book/${slug}`}><Calendar className="h-3 w-3 mr-1" /> Book Repair</Link></Button>}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h2 className="text-xl font-bold mb-4">Products from this shop</h2>
          {listings.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No products listed yet.</Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((l) => {
                const discount = l.cost_price > l.sell_price ? Math.round((1 - l.sell_price / l.cost_price) * 100) : 0;
                return (
                  <Card key={l.id} className="group hover:shadow-md transition overflow-hidden">
                    <Link to={`/marketplace/${l.id}`}>
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {l.image_url ? (
                          <img src={l.image_url} alt={l.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="h-12 w-12 text-muted-foreground" /></div>
                        )}
                        {discount > 0 && <Badge variant="destructive" className="absolute top-2 right-2">{discount}% OFF</Badge>}
                      </div>
                      <CardContent className="p-3 space-y-1">
                        <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] hover:text-primary">{l.name}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-primary">₹{l.sell_price}</span>
                          {l.cost_price > l.sell_price && <span className="text-xs line-through text-muted-foreground">₹{l.cost_price}</span>}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )
        }
        </section>

        {services.length > 0 && (
          <section className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Services available at this shop</h2>
              {shop.booking_enabled && (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/book/${slug}`}><Calendar className="h-4 w-4 mr-1" /> Book Custom Repair</Link>
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => {
                const Icon = CATEGORY_ICONS[s.category] || Wrench;
                return (
                  <Card key={s.id} className="group hover:shadow-md transition">
                    <CardContent className="p-4 flex gap-3.5 items-start">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-bold text-sm truncate">{s.name}</h3>
                          {s.popular && <Badge variant="secondary" className="text-[10px] py-0 px-1 bg-amber-500/10 text-amber-700 border-amber-500/25">Popular</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{s.description || "Professional repair service from experts."}</p>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t mt-2">
                          <div className="space-y-0.5">
                            <div className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-3 w-3" /> {s.tat}</div>
                            <div className="text-xs font-bold text-primary">₹{s.base_price}{s.max_price ? ` - ₹${s.max_price}` : ""}</div>
                          </div>
                          {shop.booking_enabled && (
                            <Button asChild size="sm" className="h-7 text-xs">
                              <Link to={`/book/${slug}?service=${encodeURIComponent(s.name)}`}>Book</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {reviews.map((r, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{r.customer_name}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, k) => (
                          <Star key={k} className={`h-3 w-3 ${k < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
