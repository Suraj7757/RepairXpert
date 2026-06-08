import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Store, MapPin, Phone, Star, Package, ArrowLeft, Calendar, ShoppingCart,
  Wrench, Clock, IndianRupee, CheckCircle2,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration_minutes: number;
  bookable: boolean;
};

type Product = {
  id: string;
  title: string;
  price: number;
  mrp: number | null;
  stock: number;
  category: string;
  images: string[] | null;
};

export default function ShopPublicPage() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookService, setBookService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", mobile: "", address: "", date: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: payload, error } = await (supabase as any).rpc(
        "get_public_shop_details",
        { _slug: slug },
      );
      if (error || !payload) {
        setLoading(false);
        return;
      }
      setData(payload);
      const { data: revs } = await (supabase as any)
        .from("shop_reviews")
        .select("rating, comment, customer_name, created_at")
        .eq("user_id", payload.shop.user_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);
      setReviews(revs || []);
      setLoading(false);

      // SEO
      const url = `${window.location.origin}/shop/${slug}`;
      const title = `${payload.shop.shop_name} — RepairXpert`;
      const desc = `${payload.shop.shop_name}${payload.shop.address ? ` at ${payload.shop.address}` : ""}. Book repair services, browse genuine parts and contact the shop on RepairXpert.`;
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
    })();
  }, [slug]);

  const shop = data?.shop;
  const services: Service[] = useMemo(() => data?.services || [], [data]);
  const products: Product[] = useMemo(() => data?.products || [], [data]);
  const rating = data?.rating || { count: 0, average: 0 };
  const mapHref = shop?.map_url || (shop?.map_lat && shop?.map_lng
    ? `https://www.google.com/maps?q=${shop.map_lat},${shop.map_lng}`
    : null);

  const openBook = (svc: Service | null) => {
    setBookService(svc);
    setBookOpen(true);
  };

  const submitBooking = async () => {
    if (!form.name.trim() || form.mobile.trim().length < 7) {
      toast.error("Name and valid mobile required");
      return;
    }
    if (!shop?.user_id) return;
    setSubmitting(true);
    const payload: any = {
      user_id: shop.user_id,
      service_id: bookService?.id || null,
      service_name: bookService?.name || "Custom Repair",
      customer_name: form.name,
      customer_mobile: form.mobile,
      customer_address: form.address,
      preferred_date: form.date ? new Date(form.date).toISOString() : null,
      notes: form.notes,
      estimated_price: bookService?.price || 0,
      status: "pending",
    };
    const { error } = await (supabase as any).from("service_bookings").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Failed to submit");
      return;
    }
    toast.success("Booking sent! Shop will contact you shortly.");
    setBookOpen(false);
    setForm({ name: "", mobile: "", address: "", date: "", notes: "" });

    // WhatsApp notify shop if phone present
    if (shop.phone) {
      const phone = String(shop.phone).replace(/\D/g, "");
      const wa = phone.length === 10 ? `91${phone}` : phone;
      const msg = encodeURIComponent(
        `Hi ${shop.shop_name},\n\nNew booking request via RepairXpert:\nService: ${bookService?.name || "Custom Repair"}\nName: ${form.name}\nMobile: ${form.mobile}\n${form.address ? `Address: ${form.address}\n` : ""}${form.notes ? `Notes: ${form.notes}` : ""}`,
      );
      window.open(`https://wa.me/${wa}?text=${msg}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md text-center p-8 bg-card/70 border-border/50">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold mb-2">Shop not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This shop may be private or the link is incorrect.
          </p>
          <Button asChild><Link to="/shops">Browse all shops</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-hero opacity-50 pointer-events-none" />

      <header className="relative border-b border-border/40 glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/shops"><ArrowLeft className="h-4 w-4 mr-1" /> All Shops</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/cart"><ShoppingCart className="h-4 w-4 mr-1" /> Cart</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
            <Store className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="flex-1 space-y-3">
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">{shop.shop_name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {rating.count > 0 && (
                <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/30">
                  <Star className="h-3 w-3 fill-amber-400" /> {rating.average} ({rating.count})
                </Badge>
              )}
              <Badge variant="outline">{products.length} products</Badge>
              <Badge variant="outline">{services.length} services</Badge>
              {shop.booking_enabled && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  Accepting bookings
                </Badge>
              )}
            </div>
            {shop.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {shop.address}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {shop.phone && (
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${shop.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" /> Call</a>
                </Button>
              )}
              {mapHref && (
                <Button asChild size="sm" variant="outline">
                  <a href={mapHref} target="_blank" rel="noreferrer">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" /> Directions
                  </a>
                </Button>
              )}
              {shop.booking_enabled && (
                <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow" onClick={() => openBook(null)}>
                  <Calendar className="h-3.5 w-3.5 mr-1.5" /> Book Repair
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="relative max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Services */}
        {services.length > 0 && (
          <section>
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-accent" /> Services Offered
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => (
                <Card key={s.id} className="bg-card/70 border-border/50 hover:border-accent/50 hover:shadow-glow transition">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm">{s.name}</h3>
                      <Badge variant="outline" className="text-[10px] capitalize">{s.category}</Badge>
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {s.duration_minutes} min
                        </div>
                        <div className="text-base font-bold text-primary flex items-center">
                          <IndianRupee className="h-3.5 w-3.5" />{s.price}
                        </div>
                      </div>
                      {s.bookable && shop.booking_enabled ? (
                        <Button size="sm" className="bg-gradient-primary text-primary-foreground h-8 text-xs" onClick={() => openBook(s)}>
                          Book Now
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Unavailable</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <section>
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Products from this shop
          </h2>
          {products.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground bg-card/60 border-border/50">
              No products listed yet.
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => {
                const img = Array.isArray(p.images) ? p.images[0] : null;
                const discount = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
                return (
                  <Card key={p.id} className="group bg-card/70 border-border/50 hover:border-primary/50 hover:shadow-glow transition overflow-hidden">
                    <Link to={`/marketplace/${p.id}`}>
                      <div className="aspect-square bg-muted/30 relative overflow-hidden">
                        {img ? (
                          <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {discount > 0 && (
                          <Badge variant="destructive" className="absolute top-2 right-2">{discount}% OFF</Badge>
                        )}
                        {p.stock <= 0 && (
                          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                            <Badge variant="secondary">Out of stock</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 space-y-1">
                        <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] group-hover:text-primary">{p.title}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-primary">₹{p.price}</span>
                          {p.mrp && p.mrp > p.price && (
                            <span className="text-xs line-through text-muted-foreground">₹{p.mrp}</span>
                          )}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section>
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> Customer Reviews
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {reviews.map((r, i) => (
                <Card key={i} className="bg-card/60 border-border/50">
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

      {/* Booking dialog */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Book {bookService?.name || "Custom Repair"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {bookService && (
              <div className="rounded-xl bg-muted/30 p-3 text-sm flex items-center justify-between">
                <span className="font-medium">{bookService.name}</span>
                <span className="flex items-center font-bold text-primary">
                  <IndianRupee className="h-3.5 w-3.5" />{bookService.price}
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Your Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile *</Label>
              <Input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="10-digit mobile"
                inputMode="numeric"
                maxLength={15}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pickup Address (optional)</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House, area, city" />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Date (optional)</Label>
              <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes / Issue description</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Describe your device and the problem..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookOpen(false)}>Cancel</Button>
            <Button
              onClick={submitBooking}
              disabled={submitting}
              className="bg-gradient-primary text-primary-foreground shadow-glow"
            >
              {submitting ? "Sending..." : <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirm Booking</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
