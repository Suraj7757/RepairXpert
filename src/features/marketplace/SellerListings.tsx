import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const CATEGORIES = ["general", "screen", "battery", "charger", "accessory", "tools", "other"];

export default function SellerListings() {
  const { user, accountType } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const empty = { title: "", category: "general", description: "", price: "", mrp: "", stock: "0", moq: "1", images: "", location: "" };
  const [form, setForm] = useState(empty);

  const sellerType = accountType === "wholesaler" ? "wholesaler" : "shopkeeper";

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("inventory")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_marketplace_listed", true)
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const submit = async () => {
    if (!form.title || !form.price) return toast.error("Title and price required");
    const payload = {
      user_id: user!.id,
      name: form.title,
      category: form.category,
      description: form.description,
      sell_price: Number(form.price) || 0,
      cost_price: Number(form.mrp) || 0,
      quantity: Number(form.stock) || 0,
      min_stock: Number(form.moq) || 1,
      image_url: form.images ? form.images.split(",")[0].trim() : "",
      is_marketplace_listed: true,
      sku: "MK-" + Date.now().toString().slice(-6),
    };
    
    // If editing, use the existing sku if available, otherwise it updates
    const { error } = editing
      ? await (supabase as any).from("inventory").update({
          name: payload.name,
          category: payload.category,
          description: payload.description,
          sell_price: payload.sell_price,
          cost_price: payload.cost_price,
          quantity: payload.quantity,
          min_stock: payload.min_stock,
          image_url: payload.image_url,
          is_marketplace_listed: true,
        }).eq("id", editing.id)
      : await (supabase as any).from("inventory").insert(payload);
      
    if (error) return toast.error(error.message);
    toast.success(editing ? "Updated" : "Added");
    setOpen(false);
    setEditing(null);
    setForm(empty);
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await (supabase as any).from("inventory").update({ is_marketplace_listed: !active }).eq("id", id);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete listing?")) return;
    await (supabase as any).from("inventory").update({ deleted: true }).eq("id", id);
    load();
  };

  const startEdit = (it: any) => {
    setEditing(it);
    setForm({
      title: it.name, category: it.category, description: it.description || "",
      price: String(it.sell_price), mrp: String(it.cost_price || ""), stock: String(it.quantity),
      moq: String(it.min_stock || "1"), images: it.image_url || "", location: "",
    });
    setOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">My Marketplace Listings</h1>
            <p className="text-muted-foreground text-sm">List products that customers can browse and buy directly</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Listing
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No listings yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling on the marketplace.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <Card key={it.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">{it.name}</CardTitle>
                    <Badge variant={it.is_marketplace_listed ? "default" : "outline"}>{it.is_marketplace_listed ? "Active" : "Hidden"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">₹{it.sell_price}</span>
                    {it.cost_price > it.sell_price && <span className="text-xs line-through text-muted-foreground">₹{it.cost_price}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{it.category} · Stock: {it.quantity}</div>
                  <div className="flex gap-1 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => startEdit(it)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(it.id, it.is_marketplace_listed)}>{it.is_marketplace_listed ? "Hide" : "Show"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => del(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Listing" : "Add New Listing"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>Location</Label><Input placeholder="City" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price ₹ *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>MRP ₹</Label><Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div><Label>MOQ</Label><Input type="number" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} /></div>
            </div>
            <div><Label>Image URLs (comma separated)</Label><Input placeholder="https://..." value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
