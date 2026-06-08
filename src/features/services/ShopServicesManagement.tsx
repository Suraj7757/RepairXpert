import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Wrench, IndianRupee, Clock } from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const CATEGORIES = [
  "mobile", "laptop", "tv", "tablet", "smartwatch", "audio", "printer", "appliance", "general",
];

type ShopService = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration_minutes: number;
  active: boolean;
  bookable: boolean;
};

const empty = {
  id: "",
  name: "",
  category: "mobile",
  description: "",
  price: "",
  duration_minutes: "60",
};

export default function ShopServicesManagement() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShopService[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShopService | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("shop_services")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data || []) as ShopService[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const startEdit = (s: ShopService | null) => {
    if (s) {
      setEditing(s);
      setForm({
        id: s.id, name: s.name, category: s.category,
        description: s.description || "", price: String(s.price),
        duration_minutes: String(s.duration_minutes),
      });
    } else {
      setEditing(null);
      setForm(empty);
    }
    setOpen(true);
  };

  const submit = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price required");
      return;
    }
    const payload: any = {
      user_id: user.id,
      name: form.name.trim(),
      category: form.category,
      description: form.description,
      price: Number(form.price) || 0,
      duration_minutes: Number(form.duration_minutes) || 60,
    };
    const { error } = editing
      ? await (supabase as any).from("shop_services").update(payload).eq("id", editing.id)
      : await (supabase as any).from("shop_services").insert({ ...payload, active: true, bookable: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Service updated" : "Service added");
    setOpen(false);
    setEditing(null);
    setForm(empty);
    load();
  };

  const toggle = async (s: ShopService, field: "active" | "bookable") => {
    const { error } = await (supabase as any)
      .from("shop_services")
      .update({ [field]: !s[field] })
      .eq("id", s.id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (s: ShopService) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    const { error } = await (supabase as any).from("shop_services").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <MainLayout title="Shop Services">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" /> Bookable Services
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add services customers can see on your public shop page and book online.
            </p>
          </div>
          <Button onClick={() => startEdit(null)} className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Plus className="h-4 w-4 mr-1.5" /> Add Service
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center bg-card/60 border-border/50">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold mb-1">No services yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first service so customers can book online.
            </p>
            <Button onClick={() => startEdit(null)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Service
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s) => (
              <Card
                key={s.id}
                className={`bg-card/70 border-border/50 transition ${!s.active ? "opacity-60" : "hover:border-primary/50 hover:shadow-glow"}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">{s.name}</h3>
                      <Badge variant="outline" className="mt-1 text-[10px] capitalize">{s.category}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm border-t border-border/40 pt-2">
                    <span className="font-bold text-primary flex items-center">
                      <IndianRupee className="h-3.5 w-3.5" />{s.price}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {s.duration_minutes} min
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs">
                      <span>Visible</span>
                      <Switch checked={s.active} onCheckedChange={() => toggle(s, "active")} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Bookable</span>
                      <Switch checked={s.bookable} onCheckedChange={() => toggle(s, "bookable")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Service Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. iPhone Screen Replacement"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm capitalize"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹) *</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What's included? Warranty? Parts brand?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-gradient-primary text-primary-foreground">
              {editing ? "Save changes" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
