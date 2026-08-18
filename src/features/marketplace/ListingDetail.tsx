import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Heart, Store, ArrowLeft, Package, Phone, MapPin,
  ShieldCheck, RefreshCw, Truck, CreditCard, ChevronRight, Star, Calendar,
  ChevronDown, Percent, Info, Award
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const VARIANTS = [
  { id: "oem", label: "OEM Certified", extraPrice: 0, quality: "100% Original Manufacturer Spec" },
  { id: "gradea", label: "Grade-A Compatible", extraPrice: -400, quality: "High-grade aftermarket component" }
];

const COLORS = [
  { name: "Default Black", hex: "#1e1e1e" },
  { name: "Polar White", hex: "#ffffff" },
  { name: "Space Grey", hex: "#7a7a7a" }
];

export default function ListingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(VARIANTS[0].id);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].name);

  const fetchWishlistStatus = async () => {
    if (!user || !id) return;
    const { data: saved } = await (supabase as any)
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .maybeSingle();
    setIsSaved(!!saved);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: res, error } = await (supabase as any).rpc("get_marketplace_listing", { _id: id });

      if (error || !res?.listing) {
        toast.error("Listing not found");
        nav("/marketplace");
        return;
      }

      const raw = res.listing;
      setData({
        listing: {
          ...raw,
          name: raw.title,
          sell_price: Number(raw.price) || 0,
          cost_price: Number(raw.mrp) || 0,
          quantity: raw.stock,
          image_url: Array.isArray(raw.images) ? raw.images[0] : null,
        },
        seller: res.seller,
      });
      setLoading(false);
    })();
  }, [id]);


  useEffect(() => {
    fetchWishlistStatus();
  }, [user?.id, id]);

  const addToCart = async () => {
    if (!user) {
      toast.error("Please login to purchase items");
      nav("/auth");
      return;
    }
    const { error } = await (supabase as any)
      .from("cart_items")
      .upsert({ user_id: user.id, listing_id: id, quantity: qty }, { onConflict: "user_id,listing_id" });
    if (error) return toast.error(error.message);
    toast.success("Added to cart successfully!");
  };

  const buyNow = async () => {
    if (!user) {
      toast.error("Please login to purchase items");
      nav("/auth");
      return;
    }
    await addToCart();
    nav("/checkout");
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (isSaved) {
      await (supabase as any).from("wishlists").delete().eq("user_id", user.id).eq("listing_id", id);
      setIsSaved(false);
      toast.success("Removed from wishlist");
    } else {
      await (supabase as any).from("wishlists").insert({ user_id: user.id, listing_id: id });
      setIsSaved(true);
      toast.success("Saved to wishlist");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f3f6]">
        <div className="animate-spin h-8 w-8 border-4 border-[#2874f0] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const l = data.listing;
  const s = data.seller;
  
  // Calculate pricing based on selected quality variant
  const activeVariantObj = VARIANTS.find(v => v.id === selectedVariant) || VARIANTS[0];
  const activeSellPrice = Math.max(100, l.sell_price + activeVariantObj.extraPrice);
  const activeCostPrice = Math.max(activeSellPrice, l.cost_price + activeVariantObj.extraPrice);
  const discount = activeCostPrice > activeSellPrice ? Math.round((1 - activeSellPrice / activeCostPrice) * 100) : 0;
  
  const mapHref = s?.map_url || (s?.map_lat && s?.map_lng ? `https://www.google.com/maps?q=${s.map_lat},${s.map_lng}` : null);

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-[#212121] font-sans selection:bg-[#2874f0] selection:text-white pb-16">
      
      {/* AMAZON SLATE NAVBAR HEADER */}
      <header className="bg-[#131921] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="text-slate-300 hover:text-white rounded hover:bg-slate-800">
            <Link to="/marketplace" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Store
            </Link>
          </Button>

          <Link to="/" className="font-black text-lg tracking-tight text-white flex items-baseline">
            RepairXpert<span className="text-[#febd69] text-xs">.in</span>
          </Link>

          <Button asChild variant="outline" className="border-slate-700 bg-[#232f3e] text-white hover:bg-slate-800 rounded">
            <Link to="/cart" className="flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" /> View Cart
            </Link>
          </Button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 py-6 bg-white border rounded shadow-sm mt-4 grid md:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PRODUCT IMAGE GALLERY & ACTION BUTTONS (4 Columns) */}
        <div className="md:col-span-5 space-y-6">
          <div className="aspect-square bg-slate-50 border border-slate-100 rounded flex items-center justify-center relative p-4">
            {l.image_url ? (
              <img
                src={l.image_url}
                alt={l.name}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            ) : (
              <Package className="h-28 w-28 text-slate-300" />
            )}
            
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-[#388e3c] text-white font-extrabold text-xs py-1 px-2.5 rounded-sm border-none">
                {discount}% OFF
              </Badge>
            )}

            <button
              onClick={toggleWishlist}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white border flex items-center justify-center text-slate-350 hover:text-rose-500 transition-colors shadow-sm"
            >
              <Heart className={`h-5 w-5 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
          </div>

          {/* Flipkart Sticky Style Bottom CTA Action buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={addToCart}
              disabled={l.quantity === 0}
              className="flex-1 bg-[#ff9f00] hover:bg-[#e68f00] text-white font-extrabold text-sm py-6 rounded shadow-sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> ADD TO CART
            </Button>
            <Button
              size="lg"
              disabled={l.quantity === 0}
              onClick={buyNow}
              className="flex-1 bg-[#fb641b] hover:bg-[#e05615] text-white font-extrabold text-sm py-6 rounded shadow-sm"
            >
              BUY NOW
            </Button>
          </div>

          {/* Assurances list */}
          <div className="grid grid-cols-3 gap-2 border-t pt-4">
            {[
              { icon: ShieldCheck, title: "100% Genuine Spares", desc: "Sourced directly" },
              { icon: RefreshCw, title: "7 Days Replacement", desc: "Easy refunds on issues" },
              { icon: Truck, title: "Express Dispatch", desc: "Same-day shop packing" }
            ].map((v, i) => (
              <div key={i} className="text-center space-y-1">
                <v.icon className="h-5 w-5 text-[#2874f0] mx-auto" />
                <h6 className="font-bold text-[10px] text-slate-700 leading-tight">{v.title}</h6>
                <p className="text-[9px] text-slate-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL DATA & VARIANT CONFIGURATOR (7 Columns) */}
        <div className="md:col-span-7 space-y-5">
          
          {/* Breadcrumbs path */}
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span>Home</span> <ChevronRight className="h-3 w-3" />
            <span>Marketplace</span> <ChevronRight className="h-3 w-3" />
            <span className="capitalize">{l.category}</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#212121] leading-tight">
              {l.name}
            </h1>
            
            {/* Star Rating Badge */}
            <div className="flex items-center gap-2">
              <span className="bg-[#388e3c] text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                4.2 <Star className="h-3 w-3 fill-white text-white" />
              </span>
              <span className="text-xs font-bold text-[#2874f0] hover:underline cursor-pointer">
                18 Ratings & 4 Reviews
              </span>
              <span className="text-slate-350">|</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                100% Verified
              </span>
            </div>
          </div>

          {/* Flipkart Price block */}
          <div className="space-y-1 bg-slate-50 p-4 border rounded">
            <p className="text-[#388e3c] text-xs font-bold">Special Price</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#212121]">₹{activeSellPrice}</span>
              {activeCostPrice > activeSellPrice && (
                <>
                  <span className="text-sm line-through text-slate-400">₹{activeCostPrice}</span>
                  <span className="text-sm text-[#388e3c] font-bold">{discount}% off</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              Prices are inclusive of local warehouse tax and partner packaging charges.
            </p>
          </div>

          {/* Flipkart bank offers */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#212121] uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-[#388e3c]" /> Available Offers
            </h4>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-[#388e3c] font-bold">★ Bank Offer</span>
                <span>Get 5% Unlimited Cash-back on Flipkart Axis Bank Credit Card.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#388e3c] font-bold">★ Special Offer</span>
                <span>Purchase active replacement parts and unlock ₹100 flat booking credits.</span>
              </li>
            </ul>
          </div>

          {/* Variant Chip Grid Selection */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Component Quality Variant
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {VARIANTS.map((v) => {
                const variantPrice = Math.max(100, l.sell_price + v.extraPrice);
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedVariant === v.id
                        ? "bg-[#2874f0]/5 border-[#2874f0] ring-1 ring-[#2874f0]"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#212121]">{v.label}</span>
                      <span className="text-xs font-black text-[#2874f0]">₹{variantPrice}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">{v.quality}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Circular Color swatch selection */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Color Family: <span className="text-[#212121] font-bold">{selectedColor}</span>
            </Label>
            <div className="flex gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.name)}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  className={`h-7 w-7 rounded-full border shadow-sm ring-offset-2 transition-all ${
                    selectedColor === c.name ? "ring-2 ring-[#2874f0]" : "border-slate-300 hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Stock Info */}
          <div className="text-xs py-2 border-t border-b">
            {l.quantity > 0 ? (
              <span className="text-[#388e3c] font-bold">✓ In stock (Ready to pack)</span>
            ) : (
              <span className="text-[#d32f2f] font-bold">Out of stock</span>
            )}
          </div>

          {/* SELLER & REPAIR BOOKING CARD */}
          {s && (
            <Card className="border border-slate-200 bg-[#f8f9fa] rounded overflow-hidden">
              <CardContent className="p-4 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#2874f0]/10 border border-[#2874f0]/25 flex items-center justify-center shrink-0">
                    <Store className="h-4 w-4 text-[#2874f0]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#212121]">{s.shop_name || "Verified Repair Shop"}</h4>
                    <p className="text-[10px] text-[#2874f0] font-bold">Verified RepairXpert Partner Store</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-650">
                  {s.address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{s.address}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <a href={`tel:${s.phone}`} className="hover:text-[#2874f0] transition-colors font-bold">
                        {s.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Redirect booking CTA links */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {mapHref && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded text-xs"
                    >
                      <a href={mapHref} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> Get Directions
                      </a>
                    </Button>
                  )}
                  {s.booking_enabled && s.booking_slug && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#2874f0] hover:bg-[#1f5ec2] text-white rounded text-xs font-bold"
                    >
                      <Link to={`/book/${s.booking_slug}`} className="flex items-center justify-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Book Repair Visit
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {l.description && (
            <div className="space-y-1.5 pt-4 border-t">
              <h4 className="font-bold text-xs text-slate-500 uppercase">Product Details</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 border rounded">
                {l.description}
              </p>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
