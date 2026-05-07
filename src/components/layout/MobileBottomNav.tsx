import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Plus,
  ShoppingCart,
  CreditCard,
  Mic,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const QUICK_ITEMS = [
  { label: "New Job", icon: Wrench, path: "/jobs?new=1", color: "bg-blue-500" },
  { label: "New Sell", icon: ShoppingCart, path: "/sells?new=1", color: "bg-emerald-500" },
  { label: "Payment", icon: CreditCard, path: "/payments?new=1", color: "bg-amber-500" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);

  const items = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/jobs", icon: Wrench, label: "Jobs" },
    { to: "#add", icon: Plus, label: "Add", primary: true },
    { to: "/sells", icon: ShoppingCart, label: "Sells" },
    { to: "#menu", icon: Menu, label: "More", isMenu: true },
  ];

  const startVoice = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice not supported on this browser");
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (e: any) => {
      const text = (e.results[0][0].transcript || "").toLowerCase();
      setListening(false);
      setMenuOpen(false);
      if (/job|repair/.test(text)) navigate("/jobs?new=1");
      else if (/sell|sale|sold/.test(text)) navigate("/sells?new=1");
      else if (/pay|payment|cash|upi/.test(text)) navigate("/payments?new=1");
      else if (/customer/.test(text)) navigate("/customers");
      else if (/inventory|stock|part/.test(text)) navigate("/inventory");
      else toast(`Heard: "${text}" — no match`);
    };
    rec.onerror = () => {
      setListening(false);
      toast.error("Voice error");
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed bottom-24 left-4 right-4 z-50 flex flex-col items-center gap-2"
          >
            {QUICK_ITEMS.map((it) => {
              const Icon = it.icon;
              return (
                <motion.button
                  key={it.path}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(it.path);
                  }}
                  className="flex items-center gap-3 rounded-full bg-card border shadow-xl pl-4 pr-5 py-2.5 text-sm font-semibold hover:bg-accent transition w-fit"
                >
                  <span className={`h-8 w-8 rounded-full ${it.color} text-white grid place-items-center`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {it.label}
                </motion.button>
              );
            })}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startVoice}
              className={`flex items-center gap-3 rounded-full border shadow-xl pl-4 pr-5 py-2.5 text-sm font-semibold transition w-fit ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-card hover:bg-accent"
              }`}
            >
              <span className="h-8 w-8 rounded-full bg-purple-500 text-white grid place-items-center">
                <Mic className="h-4 w-4" />
              </span>
              {listening ? "Listening…" : "Voice"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-3xl glass shadow-2xl border border-white/20 dark:border-white/10 h-16 flex items-center justify-around px-2 backdrop-blur-xl bg-background/70 dark:bg-background/50 supports-[backdrop-filter]:bg-background/40">
        {items.map((item) => {
          const active = location.pathname === item.to.split("?")[0] && !item.isMenu && !item.primary;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button
                key={item.label}
                onClick={() => setMenuOpen((v) => !v)}
                className="relative -top-5 flex flex-col items-center justify-center group outline-none"
                aria-label={item.label}
              >
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-xl ring-4 ring-background text-white hover:shadow-primary/30 transition-all z-10"
                >
                  {menuOpen ? (
                    <X className="h-7 w-7" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-7 w-7" strokeWidth={2.5} />
                  )}
                </motion.div>
              </button>
            );
          }

          if (item.isMenu) {
            return (
              <button
                key={item.label}
                onClick={() => setOpenMobile(true)}
                className="relative flex flex-col items-center justify-center w-14 h-14 outline-none"
                aria-label="Menu"
              >
                <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
                  <Icon className="h-6 w-6 mb-1" strokeWidth={2} />
                  <span className="text-[10px] font-semibold tracking-wide">More</span>
                </motion.div>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center w-14 h-14 outline-none"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl z-0"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
              <motion.div whileTap={{ scale: 0.9 }} className={cn(
                "flex flex-col items-center z-10 transition-colors duration-300",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <Icon className={cn("h-6 w-6 mb-1", active && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-[10px] tracking-wide", active ? "font-bold" : "font-semibold")}>
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
