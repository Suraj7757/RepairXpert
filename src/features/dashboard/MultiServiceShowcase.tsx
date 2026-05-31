import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Laptop,
  Tv2,
  Wind,
  Refrigerator,
  Monitor,
  ChevronRight,
  Star,
  Clock,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface ServiceItem {
  name: string;
  price: string;
  tat: string;
  desc: string;
}

const categories: Category[] = [
  {
    id: "mobile",
    name: "Mobile",
    icon: Smartphone,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "laptop",
    name: "Laptop",
    icon: Laptop,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    id: "tv",
    name: "TV/LED",
    icon: Tv2,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: "ac",
    name: "AC",
    icon: Wind,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    id: "fridge",
    name: "Fridge",
    icon: Refrigerator,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "pc",
    name: "Desktop/PC",
    icon: Monitor,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

const servicesByCategory: Record<string, ServiceItem[]> = {
  mobile: [
    {
      name: "Screen Replacement",
      price: "₹800 - ₹3500",
      tat: "1-2 hrs",
      desc: "Premium quality display with warranty",
    },
    {
      name: "Battery Swap",
      price: "₹400 - ₹1200",
      tat: "30 min",
      desc: "High capacity original batteries",
    },
    {
      name: "Motherboard Repair",
      price: "₹600 - ₹2500",
      tat: "3-5 hrs",
      desc: "Chip-level BGA soldering",
    },
  ],
  laptop: [
    {
      name: "Keyboard Replace",
      price: "₹700 - ₹2000",
      tat: "1 hr",
      desc: "Mechanical & regular keyboards",
    },
    {
      name: "SSD Upgrade",
      price: "₹1200 - ₹4500",
      tat: "45 min",
      desc: "NVMe/SATA speed boost",
    },
    {
      name: "Hinge Repair",
      price: "₹500 - ₹1500",
      tat: "2 hrs",
      desc: "Body fabrication & alignment",
    },
  ],
  tv: [
    {
      name: "Panel Repair",
      price: "₹1500 - ₹8000",
      tat: "2-4 days",
      desc: "Vertical lines & color fix",
    },
    {
      name: "Power Board",
      price: "₹800 - ₹2500",
      tat: "3 hrs",
      desc: "No power fault diagnosis",
    },
    {
      name: "Backlight Fix",
      price: "₹1200 - ₹4000",
      tat: "5 hrs",
      desc: "Sound ok but no picture",
    },
  ],
  ac: [
    {
      name: "Gas Charging",
      price: "₹2000 - ₹4500",
      tat: "2 hrs",
      desc: "R32, R410, R22 refilling",
    },
    {
      name: "Wet Service",
      price: "₹500 - ₹1200",
      tat: "1 hr",
      desc: "Deep chemical cleaning",
    },
    {
      name: "Installation",
      price: "₹1200 - ₹2500",
      tat: "3 hrs",
      desc: "Standard copper piping setup",
    },
  ],
  fridge: [
    {
      name: "Compressor Work",
      price: "₹3500 - ₹8000",
      tat: "24 hrs",
      desc: "OEM compressor replacement",
    },
    {
      name: "Cooling Issue",
      price: "₹600 - ₹2000",
      tat: "2 hrs",
      desc: "Thermostat & relay check",
    },
    {
      name: "Gas Refill",
      price: "₹2000 - ₹3500",
      tat: "3 hrs",
      desc: "Leak detection & filling",
    },
  ],
  pc: [
    {
      name: "OS Installation",
      price: "₹300 - ₹800",
      tat: "1 hr",
      desc: "Windows/Linux setup + drivers",
    },
    {
      name: "SMPS Replace",
      price: "₹600 - ₹1500",
      tat: "30 min",
      desc: "Power supply unit upgrade",
    },
    {
      name: "CPU Overheating",
      price: "₹400 - ₹1000",
      tat: "1 hr",
      desc: "Thermal paste & fan cleaning",
    },
  ],
};

export default function MultiServiceShowcase() {
  const [activeTab, setActiveTab] = useState<string>("mobile");
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeCategory = categories.find((c) => c.id === activeTab)!;
  const ActiveIcon = activeCategory.icon;
  const services = servicesByCategory[activeTab] ?? [];

  useEffect(() => {
    if (isHovered) return;

    timerRef.current = setInterval(() => {
      setActiveTab((current) => {
        const currentIndex = categories.findIndex((c) => c.id === current);
        const nextIndex = (currentIndex + 1) % categories.length;
        return categories[nextIndex].id;
      });
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered]);

  return (
    <section
      className="py-20 bg-gradient-to-b from-transparent to-primary/5 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors py-1 px-4 text-xs font-bold uppercase tracking-widest">
            Expert Solutions
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
            Multi-Service{" "}
            <span className="text-primary italic">Management</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Whether it's a cracked screen or a leaking AC, manage every repair
            case with category-specific precision and automated tracking.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((cat) => {
            const TabIcon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`relative flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 border ${
                  isActive
                    ? "bg-white dark:bg-slate-900 border-primary shadow-xl shadow-primary/10 scale-105 z-10"
                    : "bg-muted/50 border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <div className={`p-2 rounded-xl ${cat.bg}`}>
                  <TabIcon className={`h-5 w-5 ${cat.color}`} />
                </div>
                <span
                  className={`font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {cat.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Animated Service Cards */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {services.map((service, i) => (
                <Card
                  key={`${activeTab}-${i}`}
                  className="group overflow-hidden border-primary/10 hover:border-primary/40 hover:shadow-2xl transition-all duration-500 cursor-pointer bg-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`h-12 w-12 rounded-2xl ${activeCategory.bg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                      >
                        <ActiveIcon
                          className={`h-6 w-6 ${activeCategory.color}`}
                        />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        {service.tat}
                      </Badge>
                    </div>

                    <h4 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {service.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                      {service.desc}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Starts from
                        </span>
                        <span className="text-lg font-black text-primary">
                          {service.price}
                        </span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <ChevronRight className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* CTA Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 bg-card border rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

            <div className="flex-1 space-y-4 text-center md:text-left relative z-10">
              <h3 className="text-3xl font-black tracking-tight">
                Ready to boost your service business?
              </h3>
              <p className="text-muted-foreground">
                Join 500+ service centers using Servixo to manage their repairs
                with 99.9% customer satisfaction.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <ShieldCheck className="h-5 w-5 text-green-500" /> Secure Data
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Clock className="h-5 w-5 text-blue-500" /> Real-time Updates
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Star className="h-5 w-5 text-amber-500" /> Top Rated
                </div>
              </div>
            </div>

            <div className="shrink-0 relative z-10">
              <Button
                size="lg"
                className="px-10 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group"
              >
                Try Now for Free
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
