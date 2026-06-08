import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  MapPin,
  Phone,
  Star,
  Search,
  Package,
  Wrench,
  ArrowLeft,
  Calendar,
  ShoppingBag,
} from "lucide-react";

type Shop = {
  user_id: string;
  shop_name: string;
  address: string | null;
  phone: string | null;
  booking_slug: string | null;
  booking_enabled: boolean;
  product_count: number;
  service_count: number;
  rating_avg: number;
  rating_count: number;
};

export default function PublicShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async (q = "") => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("public_shops_directory", {
      _search: q || null,
      _limit: 60,
    });
    if (!error) setShops(((data || []) as Shop[]));
    setLoading(false);
  };

  useEffect(() => {
    load("");
    document.title = "Discover Shops — RepairXpert";
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-hero opacity-50 pointer-events-none" />

      <header className="relative border-b border-border/40 backdrop-blur-xl glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/marketplace">
              <ShoppingBag className="h-4 w-4 mr-1" /> Marketplace
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative max-w-6xl mx-auto px-4 pt-8 pb-6 text-center space-y-3">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <Store className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black bg-gradient-primary bg-clip-text text-transparent">
          Find a Trusted Repair Shop
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Browse verified shops on RepairXpert. Book repairs, buy genuine parts and contact shops directly.
        </p>
        <div className="max-w-md mx-auto flex gap-2 glass rounded-2xl p-2 border border-border/50 shadow-card">
          <Search className="h-5 w-5 text-muted-foreground self-center ml-2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shop name or area..."
            className="border-0 shadow-none bg-transparent focus-visible:ring-0"
          />
        </div>
      </section>

      <main className="relative max-w-6xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="text-center py-16">
            <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground mt-3">Loading shops...</p>
          </div>
        ) : shops.length === 0 ? (
          <Card className="p-10 text-center max-w-md mx-auto bg-card/60 border-border/50">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold mb-1">No shops found</h3>
            <p className="text-sm text-muted-foreground">Try a different search.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map((s) => (
              <ShopCard key={s.user_id} shop={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ShopCard({ shop }: { shop: Shop }) {
  const slug = shop.booking_slug || shop.user_id;
  return (
    <Card className="group bg-card/70 border-border/50 backdrop-blur hover:border-primary/50 hover:shadow-glow transition-all overflow-hidden">
      <Link to={`/shop/${slug}`} className="block">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base truncate group-hover:text-primary transition">
                {shop.shop_name}
              </h3>
              {shop.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{shop.address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {shop.rating_count > 0 && (
              <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/30">
                <Star className="h-3 w-3 fill-amber-400" /> {shop.rating_avg} ({shop.rating_count})
              </Badge>
            )}
            {shop.booking_enabled && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                <Calendar className="h-3 w-3 mr-1" /> Bookings on
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs">
              <Package className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">{shop.product_count}</span>
              <span className="text-muted-foreground">products</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Wrench className="h-3.5 w-3.5 text-accent" />
              <span className="font-semibold">{shop.service_count}</span>
              <span className="text-muted-foreground">services</span>
            </div>
          </div>
        </CardContent>
      </Link>
      {shop.phone && (
        <div className="px-5 pb-4">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <a href={`tel:${shop.phone}`}>
              <Phone className="h-3.5 w-3.5" /> Call Shop
            </a>
          </Button>
        </div>
      )}
    </Card>
  );
}
