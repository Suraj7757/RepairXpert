import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Search, ShoppingCart, Wrench, Package, MapPin, Star,
  ChevronDown, ChevronRight, ArrowRight, Smartphone, Monitor,
  Zap, Shield, MessageCircle, BarChart3, Users, Wallet,
  CheckCircle, Bell, Headphones, Battery, Tag, TrendingUp,
  Menu, X
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";

const CATEGORIES = [
  { label: "Mobile Screens", icon: Smartphone, href: "/marketplace?category=screen" },
  { label: "Batteries", icon: Battery, href: "/marketplace?category=battery" },
  { label: "Chargers", icon: Zap, href: "/marketplace?category=charger" },
  { label: "Accessories", icon: Headphones, href: "/marketplace?category=accessory" },
  { label: "Spare Parts", icon: Package, href: "/marketplace?category=tools" },
  { label: "Laptops", icon: Monitor, href: "/marketplace?category=general" },
  { label: "Deals", icon: Tag, href: "/marketplace" },
  { label: "Trending", icon: TrendingUp, href: "/marketplace" },
];

const CRM_FEATURES = [
  { label: "Repair Jobs", href: "/jobs" },
  { label: "Inventory", href: "/inventory" },
  { label: "Customers", href: "/customers" },
  { label: "Staff", href: "/staff" },
  { label: "Reports", href: "/reports" },
  { label: "Payments", href: "/payments" },
];

const HERO_SLIDES = [
  {
    bg: "from-[#131921] to-[#232f3e]",
    badge: "🔥 Best Seller",
    title: "Premium Mobile\nSpare Parts",
    sub: "Original quality screens, batteries & more",
    cta: "Shop Now",
    href: "/marketplace",
    img: "📱",
    accent: "#ff9900",
  },
  {
    bg: "from-[#0f3460] to-[#16213e]",
    badge: "⚡ New Arrival",
    title: "Laptop Parts &\nAccessories",
    sub: "SSDs, RAM, cooling pads & more",
    cta: "Explore",
    href: "/marketplace",
    img: "💻",
    accent: "#00d4ff",
  },
  {
    bg: "from-[#1a1a2e] to-[#16213e]",
    badge: "🚀 For Shopkeepers",
    title: "ServiceHub CRM\nFree Trial",
    sub: "Manage repairs, staff, inventory & earnings",
    cta: "Start Free",
    href: "/auth?mode=signup",
    img: "🛠️",
    accent: "#7c3aed",
  },
];

export default function Landing() {
  const [slide, setSlide] = useState(0);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trackId, setTrackId] = useState("");
  const [trackOpen, setTrackOpen] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [shops, setShops] = useState<Record<string, any>>({});

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("inventory")
        .select("*")
        .eq("is_marketplace_listed", true)
        .gt("quantity", 0)
        .limit(12)
        .order("created_at", { ascending: false });
      setListings(data || []);
      const ids = [...new Set((data || []).map((r: any) => r.user_id))];
      if (ids.length) {
        const { data: sd } = await (supabase as any)
          .from("shop_settings")
          .select("user_id, shop_name, address")
          .in("user_id", ids);
        const m: Record<string, any> = {};
        (sd || []).forEach((s: any) => { m[s.user_id] = s; });
        setShops(m);
      }
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/marketplace?search=${encodeURIComponent(search)}`;
  };

  const s = HERO_SLIDES[slide];

  return (
    <div className="min-h-screen bg-[#f3f3f3] font-sans">
      {/* ── TOP NAV (Amazon-style dark) ── */}
      <header className="bg-[#131921] text-white sticky top-0 z-50">
        {/* Row 1 */}
        <div className="flex items-center gap-2 px-3 py-2 max-w-[1500px] mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0 mr-2 group">
            <div className="h-8 w-8 rounded-lg bg-[#ff9900] flex items-center justify-center">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight text-white group-hover:text-[#ff9900] transition-colors hidden sm:block">
              ServiceHub
            </span>
          </Link>

          {/* Location */}
          <button className="hidden md:flex items-start gap-1 border border-transparent hover:border-white rounded px-1 py-1 shrink-0">
            <MapPin className="h-3.5 w-3.5 mt-1 text-[#ccc]" />
            <div className="text-left">
              <p className="text-[10px] text-[#ccc]">Deliver to</p>
              <p className="text-xs font-bold">India</p>
            </div>
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex rounded-md overflow-hidden">
            <select className="bg-[#e3e6e6] text-[#131921] text-xs px-2 border-r border-gray-300 hidden md:block shrink-0">
              <option>All</option>
              <option>Mobile Parts</option>
              <option>Laptops</option>
              <option>Accessories</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search parts, accessories, devices..."
              className="flex-1 px-3 py-2.5 text-[#131921] text-sm outline-none"
            />
            <button type="submit" className="bg-[#ff9900] hover:bg-[#fa8900] px-4 flex items-center justify-center">
              <Search className="h-5 w-5 text-[#131921]" />
            </button>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {/* Account Dropdown */}
            <div className="hidden md:block relative group">
              <button className="border border-transparent hover:border-white rounded px-2 py-1 text-xs flex flex-col text-left">
                <p className="text-[10px] text-[#ccc]">Hello, Sign in</p>
                <p className="font-bold text-sm flex items-center gap-0.5">Account <ChevronDown className="h-3 w-3" /></p>
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-52 bg-white text-[#131921] rounded-lg shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-3 border-b">
                  <a href="/auth?mode=signup" className="block w-full text-center py-2 bg-[#ff9900] hover:bg-[#fa8900] text-[#131921] font-black rounded-full text-sm transition-colors">
                    Create Account
                  </a>
                  <p className="text-[10px] text-center text-gray-500 mt-1">
                    Already have one? <a href="/auth" className="text-[#007185] hover:underline font-semibold">Sign in</a>
                  </p>
                </div>
                <div className="py-1">
                  <a href="/auth" className="block px-4 py-2 text-xs hover:bg-gray-100 font-semibold">Sign In</a>
                  <a href="/my-orders" className="block px-4 py-2 text-xs hover:bg-gray-100">My Orders</a>
                  <a href="/cart" className="block px-4 py-2 text-xs hover:bg-gray-100">My Cart</a>
                  <a href="/track" className="block px-4 py-2 text-xs hover:bg-gray-100">Track Order</a>
                  <div className="border-t my-1" />
                  <a href="/dashboard" className="block px-4 py-2 text-xs hover:bg-gray-100 text-[#c7511f] font-semibold">🏪 Shopkeeper Dashboard</a>
                  <a href="/auth?mode=signup" className="block px-4 py-2 text-xs hover:bg-gray-100 text-purple-700 font-semibold">🚀 Free CRM Trial</a>
                </div>
              </div>
            </div>
            <Link to="/marketplace" className="hidden md:block border border-transparent hover:border-white rounded px-2 py-1 text-xs">
              <p className="text-[10px] text-[#ccc]">Returns</p>
              <p className="font-bold text-sm">& Orders</p>
            </Link>
            <Link to="/cart" className="border border-transparent hover:border-white rounded px-2 py-1 flex items-center gap-1">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-[#ff9900] text-[#131921] text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center">0</span>
              </div>
              <span className="hidden md:block font-bold text-sm">Cart</span>
            </Link>
            <button className="md:hidden ml-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Row 2 — Category nav */}
        <nav className="bg-[#232f3e] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0 px-3 max-w-[1500px] mx-auto">
            <button className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-3 hover:bg-white/10 whitespace-nowrap border border-transparent hover:border-white rounded-sm transition-colors">
              <Menu className="h-4 w-4" /> All
            </button>
            <Link to="/marketplace" className="text-xs font-bold py-2.5 px-3 hover:bg-white/10 whitespace-nowrap border border-transparent hover:border-white rounded-sm transition-colors">
              Marketplace
            </Link>
            <Link to="/marketplace" className="text-xs font-bold py-2.5 px-3 hover:bg-white/10 whitespace-nowrap border border-transparent hover:border-white rounded-sm transition-colors">
              Book Repair
            </Link>
            <Link to="/track" className="text-xs font-bold py-2.5 px-3 hover:bg-white/10 whitespace-nowrap border border-transparent hover:border-white rounded-sm transition-colors">
              Track Order
            </Link>
            <span className="h-4 w-px bg-white/20 mx-1" />
            {/* CRM features in nav */}
            {CRM_FEATURES.map(f => (
              <Link key={f.href} to={f.href} className="text-xs py-2.5 px-3 hover:bg-white/10 whitespace-nowrap border border-transparent hover:border-white rounded-sm transition-colors text-[#ccc] hover:text-white">
                {f.label}
              </Link>
            ))}
            <span className="h-4 w-px bg-white/20 mx-1" />
            <Link to="/auth?mode=signup" className="text-xs font-bold py-2.5 px-3 hover:bg-white/10 whitespace-nowrap text-[#ff9900] border border-transparent hover:border-[#ff9900] rounded-sm transition-colors">
              🚀 Free CRM Trial
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="bg-[#232f3e] text-white px-4 py-3 flex flex-col gap-2 md:hidden z-40">
          <Link to="/marketplace" className="text-sm py-1">🛒 Marketplace</Link>
          <Link to="/track" className="text-sm py-1">📦 Track Order</Link>
          <Link to="/auth" className="text-sm py-1">👤 Sign In / Register</Link>
          <Link to="/auth?mode=signup" className="text-sm py-1 text-[#ff9900] font-bold">🚀 Free CRM Trial</Link>
        </div>
      )}

      <main className="max-w-[1500px] mx-auto px-3 md:px-4">
        {/* ── HERO CAROUSEL ── */}
        <div className={`relative mt-3 rounded-xl overflow-hidden bg-gradient-to-r ${s.bg} text-white`} style={{ minHeight: 280 }}>
          <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-6">
            <div className="space-y-4 max-w-lg">
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: s.accent + "33", color: s.accent }}>
                {s.badge}
              </span>
              <h1 className="text-3xl md:text-5xl font-black leading-tight whitespace-pre-line">
                {s.title}
              </h1>
              <p className="text-white/70 text-sm">{s.sub}</p>
              <Link to={s.href}>
                <button className="mt-2 px-8 py-3 rounded-full font-black text-[#131921] hover:opacity-90 transition-all shadow-lg" style={{ backgroundColor: s.accent }}>
                  {s.cta} <ArrowRight className="inline h-4 w-4 ml-1" />
                </button>
              </Link>
            </div>
            <div className="text-9xl md:text-[160px] select-none opacity-90 shrink-0">{s.img}</div>
          </div>
          {/* Slide dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`h-2 rounded-full transition-all ${i === slide ? "w-6 bg-[#ff9900]" : "w-2 bg-white/40"}`} />
            ))}
          </div>
          {/* Prev/Next */}
          <button onClick={() => setSlide((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 rounded-full p-2 transition-colors">
            <ChevronRight className="h-5 w-5 rotate-180" />
          </button>
          <button onClick={() => setSlide((slide + 1) % HERO_SLIDES.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 rounded-full p-2 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* ── CATEGORY PILLS ── */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-3">
          {CATEGORIES.map(cat => (
            <Link key={cat.label} to={cat.href}
              className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all group border border-transparent hover:border-[#ff9900]/30">
              <div className="h-10 w-10 rounded-full bg-[#ff9900]/10 flex items-center justify-center group-hover:bg-[#ff9900]/20 transition-colors">
                <cat.icon className="h-5 w-5 text-[#ff9900]" />
              </div>
              <span className="text-[10px] font-bold text-center text-gray-700 leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>

        {/* ── MARKETPLACE PRODUCTS ── */}
        {listings.length > 0 && (
          <section className="mt-4 bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-[#131921]">🛍️ Featured Products</h2>
              <Link to="/marketplace" className="text-[#007185] text-sm font-semibold hover:text-[#c7511f] hover:underline flex items-center gap-1">
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {listings.map((item: any) => {
                const shop = shops[item.user_id];
                const disc = item.cost_price > item.sell_price ? Math.round((1 - item.sell_price / item.cost_price) * 100) : 0;
                return (
                  <Link to={`/marketplace/${item.id}`} key={item.id}
                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-[#ff9900]/40 transition-all bg-white">
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <Package className="h-10 w-10 text-gray-300" />
                      }
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold line-clamp-2 text-[#131921] leading-snug">{item.name}</p>
                      {shop && <p className="text-[10px] text-[#007185] mt-0.5 truncate">{shop.shop_name}</p>}
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4].map(i => <Star key={i} className="h-2.5 w-2.5 fill-[#ff9900] text-[#ff9900]" />)}
                        <Star className="h-2.5 w-2.5 text-gray-300" />
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-sm font-black text-[#B12704]">₹{item.sell_price}</span>
                        {disc > 0 && (
                          <>
                            <span className="text-[10px] line-through text-gray-400">₹{item.cost_price}</span>
                            <span className="text-[10px] text-green-600 font-bold">({disc}%)</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-green-600 font-medium mt-0.5">Free delivery</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SHOP-HIGHLIGHTED REPAIR BOOKING ── */}
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          {/* Repair Booking - highlighted with shops */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔧</span>
              <h3 className="text-lg font-black text-[#131921]">Book a Repair</h3>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black">ONLINE BOOKING</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select your device type and get it repaired by a nearby verified shop.</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: "📱", label: "Mobile", sub: "Phone & Tablet" },
                { icon: "💻", label: "Laptop", sub: "Any brand" },
                { icon: "📺", label: "TV/LED", sub: "Smart & LCD" },
                { icon: "❄️", label: "AC", sub: "All types" },
                { icon: "🖥️", label: "Desktop", sub: "PC & iMac" },
                { icon: "🧊", label: "Fridge", sub: "All brands" },
              ].map(s => (
                <Link to="/marketplace" key={s.label}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#f7f8f8] hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all text-center group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                  <span className="text-xs font-bold text-[#131921]">{s.label}</span>
                  <span className="text-[9px] text-gray-400">{s.sub}</span>
                </Link>
              ))}
            </div>
            {/* Nearest shop CTA */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 mb-3">
              <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-blue-700">Find shops near you</p>
                <p className="text-blue-500">Verified repair shops with online booking</p>
              </div>
              <Link to="/marketplace">
                <button className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-bold hover:bg-blue-600 transition-colors whitespace-nowrap">
                  Find Shop
                </button>
              </Link>
            </div>
            <Link to="/marketplace">
              <button className="w-full py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-[#131921] font-black rounded-full text-sm transition-colors shadow-sm">
                🚀 Book Repair Now
              </button>
            </Link>
          </div>

          {/* CRM Signup */}
          <div className="bg-gradient-to-br from-[#131921] to-[#1a2940] rounded-xl p-6 shadow-sm text-white">
            <div className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-[#ff9900] text-[#131921] mb-2">FOR SHOPKEEPERS</div>
            <h3 className="text-lg font-black mb-1">ServiceHub CRM</h3>
            <p className="text-sm text-white/70 mb-1">Manage repairs, staff, inventory & grow your business.</p>
            <p className="text-xs text-white/50 mb-3">✅ Get online booking requests from customers</p>
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              {[
                { icon: Wrench, t: "Repair Jobs" },
                { icon: Package, t: "Inventory" },
                { icon: Users, t: "Staff Mgmt" },
                { icon: BarChart3, t: "Analytics" },
                { icon: Bell, t: "Online Bookings" },
                { icon: MessageCircle, t: "WhatsApp" },
              ].map(f => (
                <div key={f.t} className="flex items-center gap-1.5 text-white/80">
                  <f.icon className="h-3.5 w-3.5 text-[#ff9900]" />
                  <span>{f.t}</span>
                </div>
              ))}
            </div>
            <Link to="/auth?mode=signup">
              <button className="w-full py-2.5 bg-[#ff9900] hover:bg-[#fa8900] text-[#131921] font-black rounded-full text-sm transition-colors">
                Start Free Trial →
              </button>
            </Link>
            <p className="text-[10px] text-white/40 mt-2 text-center">No credit card • 7-day free trial</p>
          </div>
        </div>

        {/* ── WHY SERVICEHUB ── */}
        <section className="mt-3 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#131921] mb-4">✅ Why ServiceHub?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: "Verified Shops", desc: "All sellers are verified repair shops" },
              { icon: Zap, title: "Fast Repair", desc: "Get repairs done same day" },
              { icon: Wallet, title: "Best Prices", desc: "Compare prices across shops" },
              { icon: MessageCircle, title: "WhatsApp Updates", desc: "Real-time status via WhatsApp" },
            ].map(f => (
              <div key={f.title} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-[#f7f8f8] hover:bg-[#ff9900]/10 transition-colors">
                <div className="h-10 w-10 rounded-full bg-[#ff9900]/15 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-[#ff9900]" />
                </div>
                <h4 className="text-sm font-black text-[#131921]">{f.title}</h4>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING CTA ── */}
        <section className="mt-3 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#0f3460] to-[#533483] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-[10px] font-black px-2 py-0.5 rounded bg-[#ff9900] text-[#131921] inline-block mb-2">LIMITED TIME OFFER</div>
              <h2 className="text-2xl md:text-3xl font-black">Plans from <span className="text-[#ff9900]">₹249/mo</span></h2>
              <p className="text-white/70 text-sm mt-1">Full CRM + Marketplace + Staff Management</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                {["Free Forever Plan", "GST Invoicing", "WhatsApp Integration", "Staff Management"].map(t => (
                  <span key={t} className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-400" />{t}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link to="/subscription">
                <button className="px-8 py-3 bg-[#ff9900] hover:bg-[#fa8900] text-[#131921] font-black rounded-full transition-colors whitespace-nowrap shadow-lg">
                  View All Plans →
                </button>
              </Link>
              <Link to="/auth?mode=signup">
                <button className="px-8 py-3 border border-white/30 hover:bg-white/10 rounded-full text-sm transition-colors whitespace-nowrap text-center">
                  Start Free Today
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#131921] text-white mt-6">
        <div className="bg-[#232f3e] py-3 text-center text-xs cursor-pointer hover:bg-[#37475a] transition-colors">
          ↑ Back to top
        </div>
        <div className="max-w-[1500px] mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-black mb-3 text-white">Get to Know Us</h4>
            <div className="flex flex-col gap-2 text-[#ddd]">
              <Link to="/" className="hover:text-white hover:underline">About ServiceHub</Link>
              <Link to="/auth?mode=signup" className="hover:text-white hover:underline">Partner With Us</Link>
              <a href="https://wa.me/7319884599" target="_blank" rel="noreferrer" className="hover:text-white hover:underline">Careers</a>
            </div>
          </div>
          <div>
            <h4 className="font-black mb-3 text-white">Marketplace</h4>
            <div className="flex flex-col gap-2 text-[#ddd]">
              <Link to="/marketplace" className="hover:text-white hover:underline">Browse Products</Link>
              <Link to="/cart" className="hover:text-white hover:underline">My Cart</Link>
              <Link to="/my-orders" className="hover:text-white hover:underline">My Orders</Link>
              <Link to="/track" className="hover:text-white hover:underline">Track Order</Link>
            </div>
          </div>
          <div>
            <h4 className="font-black mb-3 text-white">For Shopkeepers</h4>
            <div className="flex flex-col gap-2 text-[#ddd]">
              <Link to="/dashboard" className="hover:text-white hover:underline">CRM Dashboard</Link>
              <Link to="/staff" className="hover:text-white hover:underline">Staff Management</Link>
              <Link to="/inventory" className="hover:text-white hover:underline">Inventory</Link>
              <Link to="/subscription" className="hover:text-white hover:underline">Pricing Plans</Link>
            </div>
          </div>
          <div>
            <h4 className="font-black mb-3 text-white">Support</h4>
            <div className="flex flex-col gap-2 text-[#ddd]">
              <a href="https://wa.me/7319884599" target="_blank" rel="noreferrer" className="hover:text-white hover:underline">WhatsApp Support</a>
              <a href="mailto:krs715665@gmail.com" className="hover:text-white hover:underline">Email Us</a>
              <Link to="/privacy" className="hover:text-white hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white hover:underline">Terms & Conditions</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-[#999]">
          © {new Date().getFullYear()} ServiceHub · All rights reserved · Founder: Suraj Kumar · +91 7319884599
        </div>
      </footer>
    </div>
  );
}
