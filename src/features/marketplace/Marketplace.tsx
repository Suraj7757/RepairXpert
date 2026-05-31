import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, ShoppingCart, Heart, Store, Package, MapPin, SlidersHorizontal,
  X, Star, ArrowRight, Tag, ShieldCheck, Flame, Info, CheckCircle,
  Menu, ChevronDown, User, Smartphone, Laptop, Tv2, Headphones, Hammer, ClipboardCheck, Sparkles
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

const CIRCULAR_CATEGORIES = [
  { id: "all", label: "All Offers", img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=120&h=120&q=80" },
  { id: "screen", label: "Mobiles & Screens", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=120&h=120&q=80" },
  { id: "battery", label: "Batteries", img: "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?auto=format&fit=crop&w=120&h=120&q=80" },
  { id: "charger", label: "Cables & Power", img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=120&h=120&q=80" },
  { id: "accessory", label: "Smart Accessories", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&h=120&q=80" },
  { id: "tools", label: "Repair Kits", img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=120&h=120&q=80" },
  { id: "general", label: "Laptops & TV", img: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=120&h=120&q=80" }
];

const PROMO_CAROUSEL = [
  {
    title: "Servixo Mega Electronic Sale",
    subtitle: "Up to 55% OFF on Certified Mobile Parts & Screens",
    bg: "from-blue-600 via-indigo-900 to-indigo-950",
    badge: "Limited Time Offer"
  },
  {
    title: "Super-Fast Repair Booking",
    subtitle: "Book verified technician visits starting from ₹199",
    bg: "from-amber-600 via-orange-950 to-slate-950",
    badge: "Doorstep Service"
  }
];

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [shops, setShops] = useState<Record<string, any>>({});
  const [activeSlide, setActiveSlide] = useState(0);
  const [softwareMenuOpen, setSoftwareMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [pincode, setPincode] = useState("713206");

  const handlePincodeChange = () => {
    const newPincode = window.prompt("Enter your 6-digit Pincode:", pincode);
    if (newPincode && newPincode.length === 6 && !isNaN(Number(newPincode))) {
      setPincode(newPincode);
    }
  };

  // Auto rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((s) => (s + 1) % PROMO_CAROUSEL.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("inventory")
      .select("*")
      .eq("is_marketplace_listed", true)
      .gt("quantity", 0);

    if (category !== "all") q = q.eq("category", category);
    if (search) q = q.ilike("name", `%${search}%`);
    if (minPrice) q = q.gte("sell_price", Number(minPrice));
    if (maxPrice) q = q.lte("sell_price", Number(maxPrice));

    if (sort === "price_asc") q = q.order("sell_price", { ascending: true });
    else if (sort === "price_desc") q = q.order("sell_price", { ascending: false });
    else if (sort === "newest") q = q.order("created_at", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    const { data } = await q;
    const rows = data || [];
    setListings(rows);
    setLoading(false);

    const ids = Array.from(new Set(rows.map((r: any) => r.user_id)));
    if (ids.length) {
      const { data: shopRows } = await (supabase as any)
        .from("shop_settings")
        .select("user_id, shop_name, address, phone, map_url, booking_slug, booking_enabled")
        .in("user_id", ids);
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
    const { data } = await (supabase as any)
      .from("wishlists")
      .select("listing_id")
      .eq("user_id", user.id);
    setWishlist(new Set((data || []).map((r: any) => r.listing_id)));
  };

  useEffect(() => {
    load();
  }, [category, sort]);

  useEffect(() => {
    loadCart();
    loadWishlist();
  }, [user?.id]);

  const addToCart = async (listing_id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to add items to your cart");
      return;
    }
    const { error } = await (supabase as any)
      .from("cart_items")
      .upsert({ user_id: user.id, listing_id, quantity: 1 }, { onConflict: "user_id,listing_id" });
    if (error) return toast.error(error.message);
    toast.success("Added to cart successfully!");
    loadCart();
  };

  const toggleWishlist = async (listing_id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save items to your wishlist");
      return;
    }
    if (wishlist.has(listing_id)) {
      await (supabase as any).from("wishlists").delete().eq("user_id", user.id).eq("listing_id", listing_id);
      const next = new Set(wishlist);
      next.delete(listing_id);
      setWishlist(next);
      toast.success("Removed from wishlist");
    } else {
      const { error } = await (supabase as any).from("wishlists").insert({ user_id: user.id, listing_id });
      if (error) return toast.error(error.message);
      setWishlist(new Set([...wishlist, listing_id]));
      toast.success("Saved to wishlist");
    }
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
    setCategory("all");
    setSort("featured");
    setTimeout(load, 0);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-[#212121] font-sans selection:bg-[#2874f0] selection:text-white pb-12">
      
      {/* ── AMAZON.IN PRIMARY HEADER (Slate #131921 Design) ── */}
      <header className="bg-[#131921] text-white">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0 border border-transparent hover:border-white px-2 py-1 rounded">
            <span className="font-black text-xl tracking-tight text-white flex items-baseline">
              servixo<span className="text-[#febd69] text-xs">.in</span>
            </span>
          </Link>

          {/* Hyperlocal Delivery PIN Indicator (Amazon Style) */}
          <div onClick={handlePincodeChange} className="hidden lg:flex items-center gap-1.5 border border-transparent hover:border-white px-2 py-1 rounded cursor-pointer shrink-0">
            <MapPin className="h-5 w-5 text-white" />
            <div className="text-left">
              <p className="text-[10px] text-slate-350 leading-tight">Deliver to Suraj</p>
              <p className="text-xs font-bold leading-tight">Durgapur {pincode}</p>
            </div>
          </div>

          {/* Massive Amazon Style Center Search Bar */}
          <div className="flex-1 max-w-3xl relative">
            <div className="flex rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#f08804] transition-all">
              <select 
                value={category}
                onChange={(e) => { setCategory(e.target.value); load(); }}
                className="bg-[#f3f3f3] text-slate-700 text-xs px-2 py-2.5 border-r hover:bg-[#e2e2e2] outline-none cursor-pointer appearance-none pl-3 pr-7 relative min-w-[60px]"
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
              >
                <option value="all">All</option>
                <option value="screen">Screens</option>
                <option value="battery">Batteries</option>
                <option value="charger">Chargers</option>
                <option value="accessory">Accessories</option>
                <option value="tools">Tools</option>
                <option value="general">Laptops</option>
              </select>
              <input
                type="text"
                placeholder="Search premium spare parts, screens, batteries, technicians..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="w-full bg-transparent px-3.5 py-2 text-sm text-[#212121] outline-none placeholder:text-slate-400"
              />
              <button
                onClick={load}
                className="bg-[#febd69] hover:bg-[#f08804] text-slate-900 px-6 flex items-center justify-center transition-colors"
              >
                <Search className="h-5 w-5 font-bold" />
              </button>
            </div>
          </div>

          {/* User Account / Sign In Action Links */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* Account Dropdown */}
            <div className="relative">
              <div 
                className="border border-transparent hover:border-white px-2 py-1 rounded cursor-pointer text-left flex flex-col justify-center"
                onClick={() => {
                  setAccountMenuOpen(!accountMenuOpen);
                  setSoftwareMenuOpen(false);
                }}
              >
                <p className="text-[10px] text-slate-300 leading-tight hidden sm:block">Hello, {user ? "User" : "Sign in"}</p>
                <p className="text-xs font-bold leading-tight flex items-center">
                  <User className="h-4 w-4 sm:hidden mr-1" />
                  <span className="hidden sm:inline">Accounts & Lists</span> <ChevronDown className="h-3 w-3 ml-0.5" />
                </p>
              </div>
              
              {accountMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 p-2 z-50 animate-in slide-in-from-top-2">
                  <Link to="/auth" className="block px-3 py-2.5 text-sm hover:bg-slate-50 rounded font-bold text-slate-800">Sign In / Register</Link>
                  <Link to="/dashboard" className="block px-3 py-2.5 text-sm hover:bg-slate-50 rounded font-bold text-slate-800">My Dashboard</Link>
                  <Link to="/my-orders" className="block px-3 py-2.5 text-sm hover:bg-slate-50 rounded font-bold text-slate-800">My Orders</Link>
                </div>
              )}
            </div>
            
            <Link to="/my-orders" className="hidden sm:block border border-transparent hover:border-white px-2 py-1 rounded text-left">
              <p className="text-[10px] text-slate-300 leading-tight">Returns</p>
              <p className="text-xs font-bold leading-tight">& Orders</p>
            </Link>

            {/* Shopping Cart Button */}
            <Link to="/cart" className="relative flex items-center gap-1.5 border border-transparent hover:border-white px-2.5 py-1.5 rounded">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#f08804] text-slate-900 font-extrabold text-[10px] rounded-full h-4.5 w-4.5 flex items-center justify-center p-0.5">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold mt-2">Cart</span>
            </Link>
          </div>
        </div>

        {/* Amazon Subheader row */}
        <div className="bg-[#232f3e] px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-none flex-1">
            <button className="flex items-center gap-1 font-bold hover:underline shrink-0">
              <Menu className="h-4 w-4" /> All
            </button>
            <span className="hover:underline cursor-pointer shrink-0">Best Sellers</span>
            <span className="hover:underline cursor-pointer text-[#febd69] shrink-0">Today's Deals</span>
            <span className="hover:underline cursor-pointer hidden sm:inline shrink-0">Mobiles</span>
            <span className="hover:underline cursor-pointer hidden md:inline shrink-0">Customer Service</span>
          </div>
          
          <div className="flex items-center gap-4 relative shrink-0 pl-4">
            <button 
              onClick={() => {
                setSoftwareMenuOpen(!softwareMenuOpen);
                setAccountMenuOpen(false);
              }}
              className="hover:underline font-bold text-[#4ade80] flex items-center gap-1.5 bg-[#131921] px-3 py-1.5 rounded-full border border-white/10 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" /> Servixo CRM <ChevronDown className="h-3 w-3" />
            </button>
            
            {softwareMenuOpen && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 p-2 z-50 flex flex-col gap-1 text-left animate-in slide-in-from-top-2">
                <Link to="/features" className="px-3 py-2.5 text-sm hover:bg-slate-50 rounded font-bold text-[#2874f0] transition-colors flex items-center gap-2">
                  ✨ View Software Features
                </Link>
                <Link to="/auth?mode=signup" className="px-3 py-2.5 text-sm hover:bg-slate-50 rounded font-bold text-slate-800 transition-colors flex items-center gap-2">
                  🚀 Start Free CRM Trial
                </Link>
                <div className="h-px bg-slate-100 my-1" />
                <Link to="/auth" className="px-3 py-2 text-xs hover:bg-slate-50 rounded font-semibold text-slate-500 transition-colors">
                  Merchant Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── FLIPKART STYLE CIRCULAR CATEGORIES SECTION ── */}
      <section className="bg-white shadow-sm border-b py-4 overflow-x-auto scrollbar-none mb-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-start md:justify-around gap-6">
          {CIRCULAR_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="flex flex-col items-center gap-1.5 shrink-0 group min-w-[70px]"
            >
              <div className={`h-14 w-14 rounded-full overflow-hidden border-2 transition-all p-0.5 bg-[#f1f3f6] ${
                category === c.id ? "border-[#2874f0] scale-105" : "border-transparent group-hover:border-slate-300"
              }`}>
                <img src={c.img} alt={c.label} className="w-full h-full object-cover rounded-full" />
              </div>
              <span className={`text-[11px] font-bold tracking-tight text-center leading-tight ${
                category === c.id ? "text-[#2874f0]" : "text-[#212121]"
              }`}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── MAIN MARKETPLACE BODY ── */}
      <main className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-6">

        {/* LEFT COLUMN: SIDEBAR FILTERS (Flipkart Style Layout) */}
        <aside className="bg-white border rounded shadow-sm p-4 space-y-5 h-fit md:col-span-1">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-[#212121] uppercase tracking-wide">Filters</h3>
            <button onClick={clearFilters} className="text-xs text-[#2874f0] font-bold hover:underline">
              CLEAR ALL
            </button>
          </div>

          {/* Pricing filters */}
          <div className="space-y-2 pb-4 border-b">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Price bounds (₹)</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-[#2874f0]"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-[#2874f0]"
              />
            </div>
            <Button
              onClick={load}
              className="w-full bg-[#2874f0] hover:bg-[#1f5ec2] text-white text-xs font-bold py-1.5 rounded h-8 mt-2"
            >
              Apply bounds
            </Button>
          </div>

          {/* Assurances list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Assurances</h4>
            {[
              "Verified Shopkeepers",
              "Original OEM Quality",
              "Local Store Warranties",
              "Doorstep Services"
            ].map((as) => (
              <label key={as} className="flex items-center gap-2 text-xs text-[#212121] cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#2874f0]" />
                <span>{as}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* RIGHT COLUMN: DEAL BANNER & PRODUCT LISTING */}
        <section className="md:col-span-3 space-y-4">
          
          {/* Promotional Deal Carousel Banner */}
          <div 
            onClick={() => { setCategory("screen"); load(); toast.info("Viewing limited time offers!"); }}
            className={`bg-gradient-to-r ${PROMO_CAROUSEL[activeSlide].bg} border text-white rounded-lg p-5 md:p-7 flex items-center justify-between gap-6 overflow-hidden relative shadow-sm min-h-[140px] transition-all duration-700 cursor-pointer hover:shadow-md hover:opacity-95`}
          >
            <div className="space-y-1 md:space-y-2 relative z-10">
              <Badge className="bg-[#ffe000] text-slate-900 font-extrabold text-[10px] uppercase py-0.5 px-2 rounded-sm border-none">
                {PROMO_CAROUSEL[activeSlide].badge}
              </Badge>
              <h2 className="text-lg md:text-xl font-black">{PROMO_CAROUSEL[activeSlide].title}</h2>
              <p className="text-xs md:text-sm text-slate-200">{PROMO_CAROUSEL[activeSlide].subtitle}</p>
            </div>
            
            {/* Nav dots */}
            <div className="absolute bottom-2.5 right-4 flex gap-1">
              {PROMO_CAROUSEL.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${activeSlide === idx ? "bg-[#ffe000] w-3" : "bg-white/40"}`}
                />
              ))}
            </div>
          </div>

          {/* Flipkart Layout Product Listings */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse bg-white border border-slate-200 p-4 flex gap-4 rounded">
                  <div className="w-40 h-40 bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="p-16 text-center bg-white border rounded">
              <Package className="h-16 w-16 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">No Matching Items Found</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting filters to discover catalog products.</p>
              <Button onClick={clearFilters} className="bg-[#2874f0] hover:bg-[#1f5ec2] text-white mt-4 font-bold text-xs rounded">
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {listings.map((l) => {
                const s = shops[l.user_id] || {};
                const discount = l.cost_price > l.sell_price ? Math.round((1 - l.sell_price / l.cost_price) * 100) : 0;
                
                return (
                  <Card
                    key={l.id}
                    className="bg-white border hover:shadow-md transition-shadow rounded overflow-hidden p-4 sm:p-5 flex flex-col sm:flex-row gap-5 relative group"
                  >
                    
                    {/* Wishlist Heart Icon */}
                    <button
                      onClick={(e) => toggleWishlist(l.id, e)}
                      className="absolute top-4 right-4 z-15 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Heart className={`h-5 w-5 ${wishlist.has(l.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>

                    {/* Column 1: Image container */}
                    <Link to={`/marketplace/${l.id}`} className="w-full sm:w-44 shrink-0 flex items-center justify-center bg-slate-50 rounded overflow-hidden aspect-square sm:h-44">
                      {l.image_url ? (
                        <img src={l.image_url} alt={l.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-102 transition duration-300" />
                      ) : (
                        <Package className="h-12 w-12 text-slate-350" />
                      )}
                    </Link>

                    {/* Column 2: Specifications details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <Link to={`/marketplace/${l.id}`}>
                          <h3 className="font-bold text-base text-[#212121] hover:text-[#2874f0] line-clamp-2 leading-tight">
                            {l.name}
                          </h3>
                        </Link>

                        {/* Rating stars */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-[#388e3c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            4.2 <Star className="h-2.5 w-2.5 fill-white text-white" />
                          </span>
                          <span className="text-xs font-bold text-slate-400">18 Ratings</span>
                          
                          {/* Servixo Assured Badge */}
                          <span className="text-[10px] font-bold italic text-[#2874f0] bg-indigo-50 px-1 rounded-sm">
                            servixo Assured
                          </span>
                        </div>

                        {/* Bullets feature list */}
                        <ul className="mt-3 text-xs text-slate-500 space-y-1 list-disc list-inside">
                          <li>Original Quality spare component with warranty</li>
                          <li>100% Tested at workshop before dispatch</li>
                          {s.shop_name && (
                            <li>
                              Seller: <Link to={`/shop/${s.booking_slug}`} className="text-[#2874f0] hover:underline font-bold">{s.shop_name}</Link>
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Hyperlocal location info */}
                      {s.address && (
                        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span>Shop Location: {s.address}</span>
                        </p>
                      )}
                    </div>

                    {/* Column 3: Flipkart Price Breakdown and CTAs */}
                    <div className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-5 shrink-0 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-[#212121]">₹{l.sell_price}</span>
                          {l.cost_price > l.sell_price && (
                            <span className="text-xs line-through text-slate-400">₹{l.cost_price}</span>
                          )}
                        </div>
                        
                        {discount > 0 && (
                          <span className="text-xs text-[#388e3c] font-bold">
                            {discount}% off
                          </span>
                        )}
                        
                        <p className="text-[10px] text-slate-400">Free Delivery</p>
                        
                        {l.quantity <= 3 ? (
                          <p className="text-[10px] text-[#d32f2f] font-bold mt-1">Only {l.quantity} left!</p>
                        ) : (
                          <p className="text-[10px] text-[#388e3c] font-semibold">In Stock</p>
                        )}
                      </div>

                      <div className="space-y-2 mt-4">
                        <Button
                          size="sm"
                          onClick={(e) => addToCart(l.id, e)}
                          className="w-full bg-[#ff9f00] hover:bg-[#e68f00] text-white font-extrabold text-xs py-2 rounded h-8.5"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart
                        </Button>
                        
                        {s.booking_enabled && s.booking_slug && (
                          <Button
                            size="sm"
                            asChild
                            variant="outline"
                            className="w-full border-slate-200 bg-[#fff] hover:bg-slate-50 text-[#2874f0] font-bold text-xs h-8.5"
                          >
                            <Link to={`/book/${s.booking_slug}`}>
                              Book Service Center
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>

                  </Card>
                );
              })}
            </div>
          )}

          {/* Trust assurances panel */}
          <div className="grid grid-cols-3 gap-3 bg-white border p-4 rounded shadow-sm">
            {[
              { icon: ShieldCheck, title: "Secure Checkout", desc: "100% Payment Protection" },
              { icon: ClipboardCheck, title: "Genuine Spares", desc: "Original OEM certified parts" },
              { icon: MapPin, title: "Local Booking", desc: "Book repairs with local shops" }
            ].map((t, idx) => (
              <div key={idx} className="text-center space-y-1 flex flex-col items-center">
                <t.icon className="h-6 w-6 text-[#2874f0]" />
                <h5 className="font-bold text-xs text-[#212121]">{t.title}</h5>
                <p className="text-[10px] text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>

        </section>

      </main>

      {/* ── MARKETPLACE FOOTER ── */}
      <footer className="bg-[#232f3e] text-white mt-12 pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold mb-4 text-[#ffffff]">Get to Know Us</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/about" className="hover:underline">About Servixo</Link></li>
              <li><Link to="/careers" className="hover:underline">Careers</Link></li>
              <li><Link to="/press" className="hover:underline">Press Releases</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-[#ffffff]">Make Money with Us</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/auth?mode=signup" className="hover:underline text-[#febd69] font-bold">Become a Shopkeeper</Link></li>
              <li><Link to="/partner-with-us" className="hover:underline">Sell Spare Parts</Link></li>
              <li><Link to="/affiliate" className="hover:underline">Become an Affiliate</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-[#ffffff]">Let Us Help You</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/my-orders" className="hover:underline">Your Account</Link></li>
              <li><Link to="/my-orders" className="hover:underline">Returns Centre</Link></li>
              <li><Link to="/contact" className="hover:underline">Help & Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-[#ffffff]">Policies & Support</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/terms" className="hover:underline">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:underline">Privacy Notice</Link></li>
              <li><a href="mailto:support@servixo.in" className="hover:underline">Email: support@servixo.in</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-slate-700 text-center text-sm text-slate-400">
          <p className="flex items-center justify-center gap-2 mb-2">
            <span className="font-black text-white text-lg">servixo<span className="text-[#febd69] text-xs">.in</span></span>
          </p>
          <p>© {new Date().getFullYear()}, Servixo.in, Inc. • Booking repairs and procuring reliable spare parts in India.</p>
        </div>
      </footer>
    </div>
  );
}
