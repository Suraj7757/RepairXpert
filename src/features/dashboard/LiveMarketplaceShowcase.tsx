import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Store, MapPin, ShoppingCart, ArrowRight } from "lucide-react";

interface Listing {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[] | null;
  featured: boolean;
}

export default function LiveMarketplaceShowcase() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [shops, setShops] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("marketplace_listings")
        .select("id, seller_id, title, category, price, mrp, stock, images, featured")
        .eq("active", true)
        .gt("stock", 0)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      const rows = data || [];
      setListings(rows);
      const ids = Array.from(new Set(rows.map((r: any) => r.seller_id)));
      if (ids.length) {
        const { data: shopRows } = await (supabase as any)
          .from("shop_settings")
          .select("user_id, shop_name, address, map_url, map_lat, map_lng")
          .in("user_id", ids);
        const map: Record<string, any> = {};
        (shopRows || []).forEach((s: any) => { map[s.user_id] = s; });
        setShops(map);
      }
      setLoading(false);
    })();
  }, []);

  if (loading || listings.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <Badge variant="secondary" className="mb-2">🛍️ Live Marketplace</Badge>
          <h2 className="text-2xl md:text-3xl font-bold">Shop from Verified Local Repair Shops</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse parts, accessories &amp; services from registered shopkeepers across India. Buy online with delivery or pickup.
          </p>
        </div>
        <Button asChild>
          <Link to="/marketplace">
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map((l) => {
          const s = shops[l.seller_id] || {};
          const mapHref = s.map_url || (s.map_lat && s.map_lng ? `https://www.google.com/maps?q=${s.map_lat},${s.map_lng}` : null);
          return (
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
                <div className="text-[11px] text-muted-foreground space-y-0.5 border-t pt-1.5">
                  <div className="flex items-center gap-1 font-medium text-foreground/80 line-clamp-1">
                    <Store className="h-3 w-3 shrink-0" /> {s.shop_name || "Verified Shop"}
                  </div>
                  {s.address && (
                    <div className="flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3 w-3 shrink-0" /> {s.address}
                    </div>
                  )}
                  {mapHref && (
                    <a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <MapPin className="h-3 w-3" /> View on map
                    </a>
                  )}
                </div>
                <Button asChild size="sm" className="w-full h-8 text-xs">
                  <Link to={`/marketplace/${l.id}`}>
                    <ShoppingCart className="h-3 w-3 mr-1" /> Buy Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
