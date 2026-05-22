import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Phone, Star, Package, ArrowLeft, Calendar, ShoppingCart } from "lucide-react";

export default function ShopPublicPage() {
  const { slug } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [rating, setRating] = useState<{ count: number; average: number } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: shopData } = await (supabase as any).rpc("get_shop_by_slug", { _slug: slug });
      if (!shopData) { setLoading(false); return; }
      setShop(shopData);

      const [{ data: full }, { data: ls }, { data: rs }, { data: revs }] = await Promise.all([
        (supabase as any).from("shop_settings").select("address, phone, map_url, map_lat, map_lng").eq("user_id", shopData.user_id).maybeSingle(),
        (supabase as any).from("marketplace_listings").select("*").eq("seller_id", shopData.user_id).eq("active", true).gt("stock", 0).order("featured", { ascending: false }).order("created_at", { ascending: false }),
        (supabase as any).rpc("get_shop_rating_summary", { _user_id: shopData.user_id }),
        (supabase as any).from("shop_reviews").select("rating, comment, customer_name, created_at").eq("user_id", shopData.user_id).eq("status", "approved").order("created_at", { ascending: false }).limit(20),
      ]);
      setShop({ ...shopData, ...(full || {}) });
      setListings(ls || []);
      setRating(rs || { count: 0, average: 0 });
      setReviews(revs || []);
      setLoading(false);

      // SEO: title, description, canonical, Open Graph
      const url = `${window.location.origin}/shop/${slug}`;
      const title = `${shopData.shop_name} — ServiceHub`;
      const desc = `${shopData.shop_name}${shopData.address ? ` at ${shopData.address}` : ""}. Browse products, book repairs and contact the shop directly on ServiceHub.`;
      const image = (ls && ls[0]?.images?.[0]) || `${window.location.origin}/placeholder.svg`;

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
                const discount = l.mrp > l.price ? Math.round((1 - l.price / l.mrp) * 100) : 0;
                return (
                  <Card key={l.id} className="group hover:shadow-md transition overflow-hidden">
                    <Link to={`/marketplace/${l.id}`}>
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {l.images?.[0] ? (
                          <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="h-12 w-12 text-muted-foreground" /></div>
                        )}
                        {discount > 0 && <Badge variant="destructive" className="absolute top-2 right-2">{discount}% OFF</Badge>}
                      </div>
                      <CardContent className="p-3 space-y-1">
                        <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] hover:text-primary">{l.title}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-primary">₹{l.price}</span>
                          {l.mrp > l.price && <span className="text-xs line-through text-muted-foreground">₹{l.mrp}</span>}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

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
