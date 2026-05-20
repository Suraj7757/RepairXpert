import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Wrench,
  ShoppingCart,
  CreditCard,
  Mic,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const ITEMS = [
  { label: "New Job", icon: Wrench, path: "/jobs?new=1", color: "bg-blue-500" },
  { label: "New Sell", icon: ShoppingCart, path: "/sells?new=1", color: "bg-emerald-500" },
  { label: "Payment", icon: CreditCard, path: "/payments?new=1", color: "bg-amber-500" },
];

export function QuickActionFAB() {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

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
      setOpen(false);
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
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-end gap-2"
          >
            {ITEMS.map((it) => {
              const Icon = it.icon;
              return (
                <motion.button
                  key={it.path}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setOpen(false);
                    navigate(it.path);
                  }}
                  className="flex items-center gap-2 rounded-full bg-card border shadow-lg pl-3 pr-4 py-2 text-sm font-semibold hover:bg-accent transition"
                >
                  <span className={`h-7 w-7 rounded-full ${it.color} text-white grid place-items-center`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {it.label}
                </motion.button>
              );
            })}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={startVoice}
              className={`flex items-center gap-2 rounded-full border shadow-lg pl-3 pr-4 py-2 text-sm font-semibold transition ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-card hover:bg-accent"
              }`}
            >
              <span className="h-7 w-7 rounded-full bg-purple-500 text-white grid place-items-center">
                <Mic className="h-4 w-4" />
              </span>
              {listening ? "Listening…" : "Voice"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 grid place-items-center"
        aria-label="Quick actions"
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.span>
      </motion.button>
    </div>
  );
}
