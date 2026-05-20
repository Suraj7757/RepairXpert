import { useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Package,
  ShoppingCart,
  IndianRupee,
  Trash2,
  Pencil,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function WholesaleDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    item_name: "",
    sku: "",
    category: "",
    bulk_price: "",
    moq: "1",
    stock: "0",
    description: "",
  });

  const reset = () => {
    setEditing(null);
    setForm({
      item_name: "",
      sku: "",
      category: "",
      bulk_price: "",
      moq: "1",
      stock: "0",
      description: "",
    });
  };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [itemsRes, ordersRes] = await Promise.all([
      (supabase as any)
        .from("wholesale_catalog")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("customer_orders")
        .select("*")
        .eq("shopkeeper_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setItems(itemsRes.data || []);
    setOrders(ordersRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const submit = async () => {
    if (!form.item_name) return toast.error("Item name required");
    const payload = {
      user_id: user!.id,
      item_name: form.item_name,
      sku: form.sku,
      category: form.category,
      bulk_price: Number(form.bulk_price) || 0,
      moq: Number(form.moq) || 1,
      stock: Number(form.stock) || 0,
      description: form.description,
    };
    const { error } = editing
      ? await (supabase as any)
          .from("wholesale_catalog")
          .update(payload)
          .eq("id", editing.id)
      : await (supabase as any).from("wholesale_catalog").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Updated" : "Added");
    setOpen(false);
    reset();
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete item?")) return;
    const { error } = await (supabase as any)
      .from("wholesale_catalog")
      .delete()
      .eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const updateOrder = async (id: string, status: string) => {
    const { error } = await (supabase as any)
      .from("customer_orders")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Wholesale Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Manage your bulk catalog and incoming orders
            </p>
          </div>
          <Button
            onClick={() => {
              reset();
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{items.length}</div>
                <div className="text-xs text-muted-foreground">
                  Catalog Items
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{orders.length}</div>
                <div className="text-xs text-muted-foreground">
                  Total Orders
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  ₹{totalRevenue.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Bulk ₹</TableHead>
                  <TableHead>MOQ</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.item_name}</TableCell>
                    <TableCell>{i.sku || "-"}</TableCell>
                    <TableCell>₹{i.bulk_price}</TableCell>
                    <TableCell>{i.moq}</TableCell>
                    <TableCell>{i.stock}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(i);
                          setForm({
                            item_name: i.item_name,
                            sku: i.sku || "",
                            category: i.category || "",
                            bulk_price: String(i.bulk_price),
                            moq: String(i.moq),
                            stock: String(i.stock),
                            description: i.description || "",
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => del(i.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-6"
                    >
                      No items yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incoming Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {Array.isArray(o.items) ? o.items.length : 0}
                    </TableCell>
                    <TableCell>₹{o.total}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === "completed" ? "default" : "outline"
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {o.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrder(o.id, "accepted")}
                        >
                          Accept
                        </Button>
                      )}
                      {o.status === "accepted" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrder(o.id, "completed")}
                        >
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-6"
                    >
                      No orders yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Item" : "Add Catalog Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Item Name</Label>
              <Input
                value={form.item_name}
                onChange={(e) =>
                  setForm({ ...form, item_name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Bulk Price ₹</Label>
                <Input
                  type="number"
                  value={form.bulk_price}
                  onChange={(e) =>
                    setForm({ ...form, bulk_price: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>MOQ</Label>
                <Input
                  type="number"
                  value={form.moq}
                  onChange={(e) => setForm({ ...form, moq: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
