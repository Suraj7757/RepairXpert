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
      {/* Overlay behind popup */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-3 px-6"
          >
            {QUICK_ITEMS.map((it, idx) => {
              const Icon = it.icon;
              return (
                <motion.button
                  key={it.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(it.path);
                  }}
                  className="flex items-center gap-3 rounded-full bg-card border shadow-2xl pl-4 pr-6 py-3 text-sm font-semibold hover:bg-accent transition w-fit"
                >
                  <span className={`h-9 w-9 rounded-full ${it.color} text-white grid place-items-center shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {it.label}
                </motion.button>
              );
            })}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: QUICK_ITEMS.length * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={startVoice}
              className={`flex items-center gap-3 rounded-full border shadow-2xl pl-4 pr-6 py-3 text-sm font-semibold transition w-fit ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-card hover:bg-accent"
              }`}
            >
              <span className="h-9 w-9 rounded-full bg-purple-500 text-white grid place-items-center shrink-0">
                <Mic className="h-4 w-4" />
              </span>
              {listening ? "Listening…" : "Voice"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-3xl glass shadow-2xl border border-white/20 dark:border-white/10 h-[4.5rem] grid grid-cols-5 items-center px-1 backdrop-blur-xl bg-background/70 dark:bg-background/50 supports-[backdrop-filter]:bg-background/40">
        {items.map((item) => {
          const active = location.pathname === item.to.split("?")[0] && !item.isMenu && !item.primary;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button
                key={item.label}
                onClick={() => setMenuOpen((v) => !v)}
                className="relative -top-4 flex flex-col items-center justify-center group outline-none mx-auto"
                aria-label={item.label}
              >
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  animate={menuOpen ? { rotate: 135 } : { rotate: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-[3.75rem] w-[3.75rem] rounded-full bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-2xl ring-[5px] ring-background text-white hover:shadow-primary/40 transition-all z-10"
                >
                  <Plus className="h-7 w-7" strokeWidth={2.5} />
                </motion.div>
              </button>
            );
          }

          if (item.isMenu) {
            return (
              <button
                key={item.label}
                onClick={() => setOpenMobile(true)}
                className="relative flex flex-col items-center justify-center w-full h-full outline-none"
                aria-label="Menu"
              >
                <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
                  <Icon className="h-[1.35rem] w-[1.35rem] mb-1" strokeWidth={2} />
                  <span className="text-[10px] font-semibold tracking-wide">More</span>
                </motion.div>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center w-full h-full outline-none"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-x-1 inset-y-1 bg-primary/10 dark:bg-primary/20 rounded-2xl z-0"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
              <motion.div whileTap={{ scale: 0.9 }} className={cn(
                "flex flex-col items-center z-10 transition-colors duration-300",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <Icon className={cn("h-[1.35rem] w-[1.35rem] mb-1", active && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} strokeWidth={active ? 2.5 : 2} />
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
