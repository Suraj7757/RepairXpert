import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseQuery, useSoftDelete } from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import {
  Plus,
  Search,
  AlertTriangle,
  Trash2,
  Package,
  Headphones,
  Settings as SettingsIcon,
  Pencil,
  Info,
  ScanLine,
  Globe,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/common/BarcodeScanner";

export default function Inventory() {
  const { user } = useAuth();
  const { data: items, loading, refetch } = useSupabaseQuery<any>("inventory");
  const { softDelete } = useSoftDelete();
  const [search, setSearch] = useState("");
  const [categoryTab, setCategoryTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "Accessories",
    quantity: "",
    minStock: "5",
    costPrice: "",
    sellPrice: "",
    gstPercent: "18",
    is_marketplace_listed: false,
    description: "",
    image_url: "",
  });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#new") {
        setEditingItem(null);
        setForm({
          name: "",
          sku: "",
          category: "Accessories",
          quantity: "",
          minStock: "5",
          costPrice: "",
          sellPrice: "",
          gstPercent: "18",
          is_marketplace_listed: false,
          description: "",
          image_url: "",
        });
        setOpen(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleScanned = (code: string) => {
    setSearch(code);
    const found = items.find(
      (i: any) => i.sku?.toLowerCase() === code.toLowerCase(),
    );
    if (found) {
      toast.success(`Found: ${found.name}`);
      openEdit(found);
    } else {
      toast.info("No item with this SKU. Add as new?");
      setEditingItem(null);
      setForm({
        name: "",
        sku: code,
        category: "Accessories",
        quantity: "",
        minStock: "5",
        costPrice: "",
        sellPrice: "",
        gstPercent: "18",
        is_marketplace_listed: false,
        description: "",
        image_url: "",
      });
      setOpen(true);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((i: any) => {
      const matchesSearch =
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryTab === "all" || i.category === categoryTab;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryTab]);

  const handleAdd = async () => {
    if (!form.name || !form.sku || !user) {
      toast.error("Name and SKU required");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category || "Accessories",
        quantity: parseInt(form.quantity) || 0,
        min_stock: parseInt(form.minStock) || 5,
        cost_price: parseFloat(form.costPrice) || 0,
        sell_price: parseFloat(form.sellPrice) || 0,
        gst_percent: parseFloat(form.gstPercent) || 18,
        is_marketplace_listed: form.is_marketplace_listed,
        description: form.description,
        image_url: form.image_url,
      };

      if (editingItem) {
        await supabase
          .from("inventory")
          .update(payload)
          .eq("id", editingItem.id);
        toast.success("Item updated");
      } else {
        await supabase
          .from("inventory")
          .insert({ user_id: user.id, ...payload });
        toast.success("Item added");
      }
      refetch();
      setOpen(false);
      setEditingItem(null);
      setForm({
        name: "",
        sku: "",
        category: "Accessories",
        quantity: "",
        minStock: "5",
        costPrice: "",
        sellPrice: "",
        gstPercent: "18",
        is_marketplace_listed: false,
        description: "",
        image_url: "",
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      sku: item.sku,
      category: item.category || "Accessories",
      quantity: String(item.quantity),
      minStock: String(item.min_stock),
      costPrice: String(item.cost_price),
      sellPrice: String(item.sell_price),
      gstPercent: String(item.gst_percent),
      is_marketplace_listed: item.is_marketplace_listed || false,
      description: item.description || "",
      image_url: item.image_url || "",
    });
    setOpen(true);
  };

  const handleDelete = async (item: any) => {
    const ok = await softDelete("inventory", item.id, item.name);
    if (ok) {
      toast("Item moved to trash", {
        action: {
          label: "Undo",
          onClick: async () => {
            await supabase
              .from("inventory")
              .update({ deleted: false, deleted_at: null })
              .eq("id", item.id);
            refetch();
          },
        },
        duration: 5000,
      });
      refetch();
    }
  };

  return (
    <MainLayout title="Inventory Stock">
      <div className="space-y-6 animate-fade-in">
        {/* Header Stats & Search */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Stock Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your Accessories and Spare Parts inventory.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 rounded-xl border-2 focus-visible:ring-primary/20"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setScanOpen(true)}
              className="h-11 px-4 rounded-xl gap-2"
            >
              <ScanLine className="h-4 w-4" /> Scan
            </Button>
            <Button
              onClick={() => {
                setEditingItem(null);
                setForm({
                  name: "",
                  sku: "",
                  category: "Accessories",
                  quantity: "",
                  minStock: "5",
                  costPrice: "",
                  sellPrice: "",
                  gstPercent: "18",
                  is_marketplace_listed: false,
                  description: "",
                  image_url: "",
                });
                setOpen(true);
              }}
              className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              <Plus className="h-5 w-5 mr-1" /> Add Stock
            </Button>
          </div>
        </div>

        <BarcodeScanner
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onScan={handleScanned}
        />

        {/* Low Stock Alerts */}
        {(() => {
          const lowItems = items.filter((i: any) => Number(i.quantity) <= Number(i.min_stock || 5));
          if (lowItems.length === 0) return null;
          return (
            <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse" />
                  <h3 className="font-bold text-amber-800 dark:text-amber-300">
                    {lowItems.length} item{lowItems.length > 1 ? "s" : ""} below threshold — reorder soon
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {lowItems.slice(0, 6).map((i: any) => {
                    const suggested = Math.max(1, (Number(i.min_stock || 5) * 3) - Number(i.quantity || 0));
                    const supplier = (i as any).supplier || "";
                    const supplierPhone = ((i as any).supplier_phone || "").replace(/\D/g, "");
                    const waText = encodeURIComponent(`Hi${supplier ? ` ${supplier}` : ""}, please send ${suggested} × ${i.name} (SKU: ${i.sku}). Thanks!`);
                    return (
                      <div key={i.id} className="rounded-lg bg-background border p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold truncate">{i.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground truncate">{i.sku}</p>
                          </div>
                          <Badge variant="destructive" className="text-[10px] shrink-0">{i.quantity} left</Badge>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Suggested reorder: <span className="font-bold text-foreground">{suggested}</span>
                          {supplier && <> · Supplier: <span className="font-semibold">{supplier}</span></>}
                        </p>
                        <div className="flex gap-1.5 mt-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => openEdit(i)}>
                            <Pencil className="h-3 w-3 mr-1" /> Restock
                          </Button>
                          {supplierPhone && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => window.open(`https://wa.me/${supplierPhone}?text=${waText}`, "_blank")}
                            >
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {lowItems.length > 6 && (
                  <p className="text-xs text-muted-foreground">+ {lowItems.length - 6} more low-stock items below</p>
                )}
              </CardContent>
            </Card>
          );
        })()}


        {/* Category Tabs */}
        <Tabs
          value={categoryTab}
          onValueChange={setCategoryTab}
          className="w-full"
        >
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger
              value="all"
              className="rounded-xl px-8 h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2"
            >
              <Package className="h-4 w-4" /> All
            </TabsTrigger>
            <TabsTrigger
              value="Accessories"
              className="rounded-xl px-8 h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2"
            >
              <Headphones className="h-4 w-4" /> Accessories
            </TabsTrigger>
            <TabsTrigger
              value="Spare Parts"
              className="rounded-xl px-8 h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold gap-2"
            >
              <SettingsIcon className="h-4 w-4" /> Spare Parts
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Inventory Grid/Table */}
        <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                    Item Details
                  </th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                    Stock Status
                  </th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden lg:table-cell">
                    Cost (Unit)
                  </th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                    Selling Price
                  </th>
                  <th className="p-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-center hidden sm:table-cell">
                    Marketplace
                  </th>
                  <th className="p-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/10">
                {filtered.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-all group"
                  >
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-black text-foreground text-base group-hover:text-primary transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground font-bold">
                          {item.sku}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className="rounded-lg px-3 py-1 font-bold text-[10px] bg-background"
                      >
                        {item.category || "Accessories"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2.5 w-24 rounded-full bg-muted overflow-hidden relative`}
                        >
                          <div
                            className={`h-full absolute left-0 top-0 transition-all duration-500 ${item.quantity <= item.min_stock ? "bg-destructive" : "bg-success"}`}
                            style={{
                              width: `${Math.min(100, (item.quantity / (item.min_stock * 2)) * 100)}%`,
                            }}
                          />
                        </div>
                        <Badge
                          className={`${item.quantity <= item.min_stock ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"} border-0 font-black text-xs min-w-[3rem] justify-center`}
                        >
                          {item.quantity}
                        </Badge>
                        {item.quantity <= item.min_stock && (
                          <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell font-bold text-muted-foreground">
                      ₹{Number(item.cost_price).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <p className="font-black text-lg text-foreground">
                        ₹{Number(item.sell_price).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        GST {item.gst_percent}% incl.
                      </p>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={!!item.is_marketplace_listed}
                          onCheckedChange={async (checked) => {
                            await supabase.from("inventory").update({ is_marketplace_listed: checked, deleted: item.deleted || false }).eq("id", item.id);
                            toast.success(checked ? "Listed on marketplace" : "Removed from marketplace");
                            refetch();
                          }}
                        />
                        <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                          item.is_marketplace_listed ? "text-emerald-600" : "text-muted-foreground"
                        }`}>
                          {item.is_marketplace_listed ? <><Globe className="h-2.5 w-2.5" /> Live</> : <><EyeOff className="h-2.5 w-2.5" /> Hidden</>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-20 text-center space-y-3">
                      <Package className="h-16 w-16 mx-auto text-muted-foreground/20" />
                      <div>
                        <p className="text-lg font-bold text-muted-foreground">
                          No items found
                        </p>
                        <p className="text-sm text-muted-foreground/60">
                          Try searching for something else or add a new item.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Dialog for Add/Edit */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-3xl rounded-[2rem]">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <Package className="h-8 w-8" />{" "}
                  {editingItem ? "Edit Item" : "New Stock Item"}
                </DialogTitle>
                <p className="text-primary-foreground/70 font-medium">
                  Fill in the details to update your inventory levels.
                </p>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6 bg-background">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Item Name *
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-12 rounded-xl"
                    placeholder="e.g. iPhone 13 Screen"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    SKU / Model ID *
                  </Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="h-12 rounded-xl"
                    placeholder="SCR-IPH13-ORG"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Category
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl font-bold">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                      <SelectItem value="Spare Parts">Spare Parts</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Low Stock Alert
                  </Label>
                  <Input
                    type="number"
                    value={form.minStock}
                    onChange={(e) =>
                      setForm({ ...form, minStock: e.target.value })
                    }
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Cost Price (₹)
                  </Label>
                  <Input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) =>
                      setForm({ ...form, costPrice: e.target.value })
                    }
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Sell Price (₹)
                  </Label>
                  <Input
                    type="number"
                    value={form.sellPrice}
                    onChange={(e) =>
                      setForm({ ...form, sellPrice: e.target.value })
                    }
                    className="h-12 rounded-xl font-bold border-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    GST %
                  </Label>
                  <Input
                    type="number"
                    value={form.gstPercent}
                    onChange={(e) =>
                      setForm({ ...form, gstPercent: e.target.value })
                    }
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">List on Marketplace</Label>
                    <p className="text-xs text-muted-foreground">Make this item available for customers to buy online.</p>
                  </div>
                  <Switch
                    checked={form.is_marketplace_listed}
                    onCheckedChange={(checked) => setForm({ ...form, is_marketplace_listed: checked })}
                  />
                </div>
                
                {form.is_marketplace_listed && (
                  <div className="grid grid-cols-1 gap-4 animate-fade-in">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Image URL</Label>
                      <Input
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        className="h-12 rounded-xl"
                        placeholder="https://example.com/image.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Description</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="rounded-xl"
                        placeholder="Describe the product for customers..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 p-4 rounded-2xl flex items-start gap-3 border border-primary/10">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary/80 font-medium leading-relaxed uppercase tracking-tight">
                  This item will be available in the **Sales** module for
                  checkout once added to stock.
                </p>
              </div>
            </div>

            <DialogFooter className="p-8 pt-0 bg-background flex gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="h-14 flex-1 rounded-2xl font-black border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isSubmitting}
                className="h-14 flex-[2] rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
              >
                {isSubmitting
                  ? "Processing..."
                  : editingItem
                    ? "Update Stock"
                    : "Confirm & Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
