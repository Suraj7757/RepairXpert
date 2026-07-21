import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardList, Plus, Trash2, Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface POItem {
  inventory_item_id?: string | null;
  item_name: string;
  sku?: string;
  quantity: number;
  cost_price: number;
}
interface PO {
  id: string;
  po_number: string;
  supplier_name: string | null;
  supplier_id: string | null;
  status: string;
  total: number;
  subtotal: number;
  notes: string | null;
  ordered_at: string | null;
  received_at: string | null;
  created_at: string;
}
interface Supplier { id: string; name: string }
interface InvItem { id: string; name: string; sku: string; cost_price: number }

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-blue-500/20 text-blue-500",
  received: "bg-emerald-500/20 text-emerald-500",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function PurchaseOrders() {
  const { user } = useAuth();
  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inv, setInv] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([{ item_name: "", quantity: 1, cost_price: 0 }]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: pd }, { data: sd }, { data: id }] = await Promise.all([
      (supabase as any).from("purchase_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      (supabase as any).from("suppliers").select("id,name").eq("user_id", user.id).eq("deleted", false).order("name"),
      supabase.from("inventory").select("id,name,sku,cost_price").eq("user_id", user.id).eq("deleted", false).order("name"),
    ]);
    setPos((pd as PO[]) || []);
    setSuppliers((sd as Supplier[]) || []);
    setInv((id as InvItem[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.cost_price) || 0), 0);

  const addRow = () => setItems([...items, { item_name: "", quantity: 1, cost_price: 0 }]);
  const rmRow = (i: number) => setItems(items.filter((_, x) => x !== i));
  const updRow = (i: number, patch: Partial<POItem>) => setItems(items.map((it, x) => x === i ? { ...it, ...patch } : it));
  const pickInv = (i: number, invId: string) => {
    const it = inv.find(x => x.id === invId);
    if (!it) return;
    updRow(i, { inventory_item_id: it.id, item_name: it.name, sku: it.sku, cost_price: it.cost_price });
  };

  const createPO = async () => {
    if (!user) return;
    if (items.some(i => !i.item_name || i.quantity <= 0)) return toast.error("Fill all item rows");
    const sup = suppliers.find(s => s.id === supplierId);
    const po_number = "PO-" + Date.now().toString(36).toUpperCase();
    const { data: p, error } = await (supabase as any).from("purchase_orders").insert({
      user_id: user.id, po_number, supplier_id: supplierId || null, supplier_name: sup?.name || null,
      subtotal, total: subtotal, status: "ordered", ordered_at: new Date().toISOString(), notes,
    }).select().single();
    if (error) return toast.error(error.message);
    const rows = items.map(i => ({
      po_id: p.id, inventory_item_id: i.inventory_item_id || null, item_name: i.item_name,
      sku: i.sku || null, quantity: Number(i.quantity), cost_price: Number(i.cost_price),
      line_total: Number(i.quantity) * Number(i.cost_price),
    }));
    const { error: e2 } = await (supabase as any).from("purchase_order_items").insert(rows);
    if (e2) return toast.error(e2.message);
    toast.success("Purchase Order created: " + po_number);
    setOpen(false); setItems([{ item_name: "", quantity: 1, cost_price: 0 }]); setSupplierId(""); setNotes("");
    load();
  };

  const receivePO = async (id: string) => {
    const { error } = await (supabase as any).rpc("receive_purchase_order", { _po_id: id });
    if (error) return toast.error(error.message);
    toast.success("Stock received & inventory updated");
    load();
  };

  const cancelPO = async (id: string) => {
    const { error } = await (supabase as any).from("purchase_orders").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <MainLayout title="Purchase Orders">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Purchase Orders</h2>
              <p className="text-sm text-muted-foreground">Order stock from suppliers, receive to update inventory</p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New Purchase Order</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>All POs ({pos.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">Loading…</p> :
              pos.length === 0 ? <p className="text-muted-foreground py-8 text-center">No purchase orders yet.</p> :
              <div className="space-y-2">
                {pos.map(p => (
                  <div key={p.id} className="flex flex-wrap justify-between items-center gap-3 p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{p.po_number}</span>
                        <Badge className={statusColors[p.status] || ""}>{p.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.supplier_name || "No supplier"} · ₹{Number(p.total).toLocaleString()} · {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {p.status === "ordered" && (
                        <>
                          <Button size="sm" onClick={() => receivePO(p.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />Receive
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancelPO(p.id)}>Cancel</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>

            <div className="border rounded-lg p-3 space-y-2 max-h-80 overflow-auto">
              <div className="flex justify-between items-center">
                <Label>Items</Label>
                <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-3 w-3 mr-1" />Add row</Button>
              </div>
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Select value={it.inventory_item_id || "custom"} onValueChange={v => v === "custom" ? updRow(i, { inventory_item_id: null }) : pickInv(i, v)}>
                      <SelectTrigger><SelectValue placeholder="Pick item" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom item</SelectItem>
                        {inv.map(x => <SelectItem key={x.id} value={x.id}>{x.name} ({x.sku})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="mt-1" placeholder="Item name" value={it.item_name} onChange={e => updRow(i, { item_name: e.target.value })} />
                  </div>
                  <div className="col-span-2"><Label className="text-xs">Qty</Label><Input type="number" value={it.quantity} onChange={e => updRow(i, { quantity: Number(e.target.value) })} /></div>
                  <div className="col-span-3"><Label className="text-xs">Cost ₹</Label><Input type="number" value={it.cost_price} onChange={e => updRow(i, { cost_price: Number(e.target.value) })} /></div>
                  <div className="col-span-2 flex justify-end">
                    <Button size="icon" variant="ghost" onClick={() => rmRow(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end font-bold text-lg">Total: ₹{subtotal.toLocaleString()}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createPO}>Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
