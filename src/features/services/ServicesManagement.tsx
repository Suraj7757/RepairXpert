import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Wrench,
  Smartphone,
  Laptop,
  Tv2,
  Printer,
  Watch,
  Headphones,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Tag,
  Layers,
  BarChart3,
  TrendingUp,
  Star,
  ChevronDown,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ServiceStatus = "Active" | "Inactive" | "Coming Soon";
type ServiceCategory =
  | "Mobile Repair"
  | "Laptop Repair"
  | "TV / LED Repair"
  | "Printer Repair"
  | "Smartwatch Repair"
  | "Audio Devices"
  | "Other";

interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  basePrice: number;
  maxPrice: number;
  tat: string; // Turnaround Time
  status: ServiceStatus;
  description: string;
  popular: boolean;
  createdAt: string;
  jobsCompleted: number;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_SERVICES: Service[] = [
  {
    id: "1",
    name: "Screen Replacement",
    category: "Mobile Repair",
    basePrice: 800,
    maxPrice: 3500,
    tat: "1-2 hrs",
    status: "Active",
    description:
      "Original & compatible screen replacements for all major brands.",
    popular: true,
    createdAt: "2026-04-01",
    jobsCompleted: 142,
  },
  {
    id: "2",
    name: "Battery Replacement",
    category: "Mobile Repair",
    basePrice: 350,
    maxPrice: 900,
    tat: "30 min",
    status: "Active",
    description: "High-capacity OEM batteries with 3-month warranty.",
    popular: true,
    createdAt: "2026-04-01",
    jobsCompleted: 98,
  },
  {
    id: "3",
    name: "Charging Port Repair",
    category: "Mobile Repair",
    basePrice: 200,
    maxPrice: 600,
    tat: "1 hr",
    status: "Active",
    description: "Fix charging issues, port cleaning & replacement.",
    popular: false,
    createdAt: "2026-04-05",
    jobsCompleted: 67,
  },
  {
    id: "4",
    name: "motherboard Repair",
    category: "Mobile Repair",
    basePrice: 500,
    maxPrice: 2500,
    tat: "2-4 hrs",
    status: "Active",
    description: "BGA level chip-level repair for motherboard faults.",
    popular: false,
    createdAt: "2026-04-05",
    jobsCompleted: 34,
  },
  {
    id: "5",
    name: "Water Damage Treatment",
    category: "Mobile Repair",
    basePrice: 400,
    maxPrice: 1200,
    tat: "24 hrs",
    status: "Active",
    description: "Ultrasonic cleaning + full internal inspection.",
    popular: false,
    createdAt: "2026-04-10",
    jobsCompleted: 22,
  },
  {
    id: "6",
    name: "Laptop Screen Repair",
    category: "Laptop Repair",
    basePrice: 1500,
    maxPrice: 7000,
    tat: "2-3 hrs",
    status: "Active",
    description: "LCD/IPS panel replacement for all laptop brands.",
    popular: true,
    createdAt: "2026-04-01",
    jobsCompleted: 55,
  },
  {
    id: "7",
    name: "Laptop Keyboard Replacement",
    category: "Laptop Repair",
    basePrice: 700,
    maxPrice: 2000,
    tat: "1 hr",
    status: "Active",
    description: "Original & aftermarket keyboard options available.",
    popular: false,
    createdAt: "2026-04-03",
    jobsCompleted: 31,
  },
  {
    id: "8",
    name: "RAM / SSD Upgrade",
    category: "Laptop Repair",
    basePrice: 300,
    maxPrice: 500,
    tat: "30 min",
    status: "Active",
    description: "Boost speed with RAM & SSD upgrades.",
    popular: true,
    createdAt: "2026-04-03",
    jobsCompleted: 44,
  },
  {
    id: "9",
    name: "TV Panel Repair",
    category: "TV / LED Repair",
    basePrice: 1200,
    maxPrice: 8000,
    tat: "3-5 hrs",
    status: "Active",
    description: "LED/OLED panel fault diagnosis and repair.",
    popular: false,
    createdAt: "2026-04-08",
    jobsCompleted: 19,
  },
  {
    id: "10",
    name: "TV Remote Programming",
    category: "TV / LED Repair",
    basePrice: 100,
    maxPrice: 300,
    tat: "15 min",
    status: "Active",
    description: "Universal remote setup + original remote repair.",
    popular: false,
    createdAt: "2026-04-08",
    jobsCompleted: 28,
  },
  {
    id: "11",
    name: "Printer Head Cleaning",
    category: "Printer Repair",
    basePrice: 150,
    maxPrice: 400,
    tat: "30 min",
    status: "Active",
    description: "Deep nozzle cleaning + alignment correction.",
    popular: false,
    createdAt: "2026-04-10",
    jobsCompleted: 17,
  },
  {
    id: "12",
    name: "Smartwatch Glass Repair",
    category: "Smartwatch Repair",
    basePrice: 250,
    maxPrice: 800,
    tat: "2 hrs",
    status: "Coming Soon",
    description: "Scratch-free screen protector & glass replacement.",
    popular: false,
    createdAt: "2026-04-15",
    jobsCompleted: 0,
  },
];

const CATEGORIES: ServiceCategory[] = [
  "Mobile Repair",
  "Laptop Repair",
  "TV / LED Repair",
  "Printer Repair",
  "Smartwatch Repair",
  "Audio Devices",
  "Other",
];

const STATUS_OPTIONS: ServiceStatus[] = ["Active", "Inactive", "Coming Soon"];

const CATEGORY_ICONS: Record<ServiceCategory, any> = {
  "Mobile Repair": Smartphone,
  "Laptop Repair": Laptop,
  "TV / LED Repair": Tv2,
  "Printer Repair": Printer,
  "Smartwatch Repair": Watch,
  "Audio Devices": Headphones,
  Other: Wrench,
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  Active: "bg-green-500/10 text-green-600 border-green-500/20",
  Inactive: "bg-red-500/10 text-red-600 border-red-500/20",
  "Coming Soon": "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const BLANK: Omit<Service, "id" | "createdAt" | "jobsCompleted"> = {
  name: "",
  category: "Mobile Repair",
  basePrice: 0,
  maxPrice: 0,
  tat: "",
  status: "Active",
  description: "",
  popular: false,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ServicesManagement() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<"grid" | "table">("grid");

  const loadServices = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("services")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
      } else if (data) {
        if (data.length === 0) {
          // Auto-seed default services for new shopkeeper
          const seedPayload = SEED_SERVICES.map((s) => ({
            user_id: user.id,
            name: s.name,
            category: s.category,
            base_price: s.basePrice,
            max_price: s.maxPrice,
            tat: s.tat,
            status: s.status,
            description: s.description,
            popular: s.popular,
            jobs_completed: s.jobsCompleted,
          }));
          const { error: seedError } = await (supabase as any).from("services").insert(seedPayload);
          if (seedError) {
            console.error("Seeding error:", seedError);
          } else {
            // reload
            const { data: reloaded } = await (supabase as any)
              .from("services")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false });
            if (reloaded) {
              setServices(
                reloaded.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  category: s.category as ServiceCategory,
                  basePrice: Number(s.base_price),
                  maxPrice: Number(s.max_price),
                  tat: s.tat,
                  status: s.status as ServiceStatus,
                  description: s.description || "",
                  popular: s.popular,
                  createdAt: s.created_at ? new Date(s.created_at).toISOString().split("T")[0] : "",
                  jobsCompleted: s.jobs_completed || 0,
                }))
              );
            }
          }
        } else {
          setServices(
            data.map((s: any) => ({
              id: s.id,
              name: s.name,
              category: s.category as ServiceCategory,
              basePrice: Number(s.base_price),
              maxPrice: Number(s.max_price),
              tat: s.tat,
              status: s.status as ServiceStatus,
              description: s.description || "",
              popular: s.popular,
              createdAt: s.created_at ? new Date(s.created_at).toISOString().split("T")[0] : "",
              jobsCompleted: s.jobs_completed || 0,
            }))
          );
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [user?.id]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = services.filter((s) => s.status === "Active").length;
    const totalJobs = services.reduce((s, x) => s + x.jobsCompleted, 0);
    const popular = services.filter((s) => s.popular).length;
    const categories = new Set(services.map((s) => s.category)).size;
    return { active, totalJobs, popular, categories };
  }, [services]);

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      services.filter((s) => {
        const matchSearch =
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.category.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase());
        const matchCat =
          filterCategory === "All" || s.category === filterCategory;
        const matchStatus = filterStatus === "All" || s.status === filterStatus;
        return matchSearch && matchCat && matchStatus;
      }),
    [services, search, filterCategory, filterStatus],
  );

  // ── Category groups ────────────────────────────────────────────────────────
  const categoryGroups = useMemo(() => {
    const map: Record<string, Service[]> = {};
    filtered.forEach((s) => {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    });
    return map;
  }, [filtered]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setDialogOpen(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category,
      basePrice: s.basePrice,
      maxPrice: s.maxPrice,
      tat: s.tat,
      status: s.status,
      description: s.description,
      popular: s.popular,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Service name is required");
      return;
    }
    if (form.basePrice <= 0) {
      toast.error("Base price must be greater than 0");
      return;
    }
    if (!form.tat.trim()) {
      toast.error("Turnaround time is required");
      return;
    }

    const payload = {
      name: form.name,
      category: form.category,
      base_price: form.basePrice,
      max_price: form.maxPrice,
      tat: form.tat,
      status: form.status,
      description: form.description,
      popular: form.popular,
    };

    if (editing) {
      const { error } = await (supabase as any)
        .from("services")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Service updated successfully");
        loadServices();
        setDialogOpen(false);
      }
    } else {
      const { error } = await (supabase as any)
        .from("services")
        .insert({
          ...payload,
          user_id: user?.id,
          jobs_completed: 0,
        });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("New service added");
        loadServices();
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await (supabase as any)
      .from("services")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Service removed");
      loadServices();
      setDeleteTarget(null);
    }
  };

  const togglePopular = async (id: string) => {
    const service = services.find((s) => s.id === id);
    if (!service) return;
    const { error } = await (supabase as any)
      .from("services")
      .update({ popular: !service.popular })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      loadServices();
    }
  };

  const toggleStatus = async (id: string) => {
    const service = services.find((s) => s.id === id);
    if (!service) return;
    const nextStatus = service.status === "Active" ? "Inactive" : "Active";
    const { error } = await (supabase as any)
      .from("services")
      .update({ status: nextStatus })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      loadServices();
    }
  };

  return (
    <MainLayout title="Services Management">
      <div className="space-y-6 animate-fade-in">
        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <Card className="gradient-primary border-0 shadow-2xl shadow-primary/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardContent className="py-7 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary-foreground/70 uppercase tracking-widest">
                Multi Services Management
              </p>
              <h2 className="text-3xl font-black text-primary-foreground tracking-tight">
                Service Catalog
              </h2>
              <p className="text-sm text-primary-foreground/70">
                Manage all your repair services, pricing & turnaround times
              </p>
            </div>
            <Button
              onClick={openAdd}
              className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg shrink-0 gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" /> Add New Service
            </Button>
          </CardContent>
        </Card>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat
            icon={CheckCircle2}
            label="Active Services"
            value={stats.active}
            color="text-green-600"
            bg="bg-green-500/10"
          />
          <MiniStat
            icon={BarChart3}
            label="Jobs Completed"
            value={stats.totalJobs}
            color="text-primary"
            bg="bg-primary/10"
          />
          <MiniStat
            icon={Star}
            label="Popular Services"
            value={stats.popular}
            color="text-amber-600"
            bg="bg-amber-500/10"
          />
          <MiniStat
            icon={Layers}
            label="Categories"
            value={stats.categories}
            color="text-violet-600"
            bg="bg-violet-500/10"
          />
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services by name, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 shrink-0">
            <Button
              variant={activeTab === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("grid")}
            >
              Grid
            </Button>
            <Button
              variant={activeTab === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("table")}
            >
              Table
            </Button>
          </div>
        </div>

        {/* ── Results count ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>
            Showing{" "}
            <strong className="text-foreground">{filtered.length}</strong> of{" "}
            {services.length} services
          </span>
        </div>

        {/* ── Grid View ───────────────────────────────────────────────────── */}
        {activeTab === "grid" && (
          <div className="space-y-8">
            {Object.entries(categoryGroups).map(([cat, items]) => {
              const CatIcon = CATEGORY_ICONS[cat as ServiceCategory] || Wrench;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CatIcon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-bold text-base tracking-tight">
                      {cat}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {items.length} services
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((s) => (
                      <ServiceCard
                        key={s.id}
                        service={s}
                        onEdit={() => openEdit(s)}
                        onDelete={() => setDeleteTarget(s)}
                        onTogglePopular={() => togglePopular(s.id)}
                        onToggleStatus={() => toggleStatus(s.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <EmptyState />}
          </div>
        )}

        {/* ── Table View ──────────────────────────────────────────────────── */}
        {activeTab === "table" && (
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                      Service
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                      Pricing
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                      TAT
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                      Jobs
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No services found
                      </td>
                    </tr>
                  )}
                  {filtered.map((s, i) => {
                    const CatIcon = CATEGORY_ICONS[s.category] || Wrench;
                    return (
                      <tr
                        key={s.id}
                        className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {s.popular && (
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                            <span className="font-semibold">{s.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {s.description}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CatIcon className="h-3.5 w-3.5" /> {s.category}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <span className="text-primary">
                            ₹{s.basePrice.toLocaleString()}
                          </span>
                          {s.maxPrice > s.basePrice && (
                            <span className="text-muted-foreground">
                              {" "}
                              – ₹{s.maxPrice.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {s.tat}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs font-bold">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />{" "}
                            {s.jobsCompleted}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-[10px] font-bold border ${STATUS_COLORS[s.status]}`}
                          >
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEdit(s)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(s)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ── Add / Edit Dialog ───────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {editing ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>
                  Service Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Screen Replacement"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v as ServiceCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>
                    Base Price (₹) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 500"
                    value={form.basePrice || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        basePrice: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Max Price (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 2000"
                    value={form.maxPrice || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxPrice: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>
                    Turnaround Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. 1-2 hrs, 24 hrs"
                    value={form.tat}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tat: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as ServiceStatus }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Short description of the service…"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="popular"
                  checked={form.popular}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, popular: e.target.checked }))
                  }
                  className="accent-primary h-4 w-4"
                />
                <label
                  htmlFor="popular"
                  className="text-sm font-medium cursor-pointer flex items-center gap-1"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500" /> Mark as
                  Popular
                </label>
              </div>
            </div>
          </div>
          <Separator />
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Update Service" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Service?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete{" "}
            <strong>"{deleteTarget?.name}"</strong>? This action cannot be
            undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServiceCard({
  service: s,
  onEdit,
  onDelete,
  onTogglePopular,
  onToggleStatus,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePopular: () => void;
  onToggleStatus: () => void;
}) {
  const CatIcon = CATEGORY_ICONS[s.category] || Wrench;
  return (
    <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-border/60">
      {/* Top accent */}
      <div
        className={`h-1 w-full ${s.status === "Active" ? "bg-gradient-to-r from-primary to-blue-400" : s.status === "Coming Soon" ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-muted"}`}
      />
      <CardContent className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CatIcon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm leading-tight truncate">
                  {s.name}
                </h4>
                {s.popular && (
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {s.category}
              </p>
            </div>
          </div>
          <Badge
            className={`text-[9px] font-bold border shrink-0 ${STATUS_COLORS[s.status]}`}
          >
            {s.status}
          </Badge>
        </div>

        {/* Description */}
        {s.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {s.description}
          </p>
        )}

        {/* Pricing + TAT */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
              Price Range
            </p>
            <p className="text-sm font-bold text-primary flex items-center gap-0.5">
              <IndianRupee className="h-3 w-3" />
              {s.basePrice.toLocaleString()}
              {s.maxPrice > s.basePrice && (
                <span className="text-muted-foreground font-normal text-xs">
                  {" "}
                  – {s.maxPrice.toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
              Turnaround
            </p>
            <p className="text-sm font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" /> {s.tat}
            </p>
          </div>
        </div>

        {/* Jobs done */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span>
            <strong className="text-foreground">{s.jobsCompleted}</strong> jobs
            completed
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1"
            onClick={onEdit}
          >
            <Edit2 className="h-3 w-3" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={onToggleStatus}
            title={s.status === "Active" ? "Deactivate" : "Activate"}
          >
            {s.status === "Active" ? (
              <XCircle className="h-3 w-3 text-destructive" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={onTogglePopular}
            title={s.popular ? "Unmark Popular" : "Mark Popular"}
          >
            <Star
              className={`h-3 w-3 ${s.popular ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-black tracking-tight">{value}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 space-y-3">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
        <Wrench className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-bold text-lg">No services found</h3>
      <p className="text-sm text-muted-foreground">
        Try adjusting your filters or add a new service
      </p>
    </div>
  );
}
