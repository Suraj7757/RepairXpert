import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Truck, Plus, Trash2, Phone, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  notes: string | null;
  created_at: string;
}

const empty = { name: "", phone: "", email: "", address: "", gstin: "", notes: "" };

export default function Suppliers() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("suppliers")
      .select("*")
      .eq("user_id", user.id)
      .eq("deleted", false)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Supplier[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name, phone: s.phone || "", email: s.email || "",
      address: s.address || "", gstin: s.gstin || "", notes: s.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast.error("Name required");
    const payload = { ...form, user_id: user.id };
    if (editing) {
      const { error } = await (supabase as any).from("suppliers").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Supplier updated");
    } else {
      const { error } = await (supabase as any).from("suppliers").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Supplier added");
    }
    setOpen(false); load();
  };

  const del = async (id: string) => {
    const { error } = await (supabase as any).from("suppliers").update({ deleted: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const filtered = rows.filter(r =>
    !q || r.name.toLowerCase().includes(q.toLowerCase()) ||
    (r.phone || "").includes(q) || (r.gstin || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <MainLayout title="Suppliers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Suppliers</h2>
              <p className="text-sm text-muted-foreground">Manage vendors for parts and stock</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search name / phone / GSTIN" value={q} onChange={e => setQ(e.target.value)} className="w-64" />
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Add Supplier</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>All Suppliers ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No suppliers yet. Add your first vendor.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(s => (
                  <Card key={s.id} className="border-primary/10">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{s.name}</p>
                          {s.gstin && <p className="text-xs text-muted-foreground">GSTIN: {s.gstin}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                      {s.phone && (
                        <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-sm text-primary">
                          <Phone className="h-3 w-3" />{s.phone}
                        </a>
                      )}
                      {s.email && (
                        <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />{s.email}
                        </a>
                      )}
                      {s.address && <p className="text-xs text-muted-foreground">{s.address}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Supplier" : "New Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>GSTIN</Label><Input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} /></div>
            <div><Label>Address</Label><Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
