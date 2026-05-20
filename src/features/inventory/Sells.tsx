import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import {
  useSupabaseQuery,
  useSoftDelete,
  useShopSettings,
} from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import {
  ShoppingCart,
  Search,
  Package,
  Minus,
  Plus,
  Share2,
  FileText,
  MoreVertical,
  Trash2,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import { downloadSellInvoice, SellInvoiceData } from "@/lib/invoice";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { QRCodeSVG } from "qrcode.react";
import TrackDialog from "../jobs/components/TrackDialog";
import { Copy } from "lucide-react";
import { BarcodeScanner } from "@/components/common/BarcodeScanner";

async function getNextSellId(
  userId: string,
  itemName: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("next_sell_id", {
    _user_id: userId,
    _item_name: itemName,
  });
  if (error) throw error;
  return data as string;
}

export default function Sells() {
  const { user } = useAuth();
  const { data: inventory, refetch: refetchInventory } =
    useSupabaseQuery<any>("inventory");
  const { data: sells, refetch: refetchSells } = useSupabaseQuery<any>(
    "sells" as any,
  );
  const { settings } = useShopSettings();
  const { softDelete } = useSoftDelete();
  const [search, setSearch] = useState("");
  const [sellOpen, setSellOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [sellPrice, setSellPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [tab, setTab] = useState<"shop" | "history">("shop");
  const [selectedSell, setSelectedSell] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const handleScanned = (code: string) => {
    setSearch(code);
    const found = inventory.find(
      (i: any) => i.sku?.toLowerCase() === code.toLowerCase(),
    );
    if (found) {
      toast.success(`Found: ${found.name}`);
      openSell(found);
    } else {
      toast.error("No item found with this SKU in stock.");
    }
  };

  const filtered = inventory.filter(
    (i: any) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#new") {
        setTab("shop");
        window.history.replaceState(null, "", window.location.pathname);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const openSell = (item: any) => {
    setSelectedItem(item);
    setQty(1);
    setSellPrice(String(item.sell_price));
    setCustomerName("");
    setCustomerMobile("");
    setPaymentMethod("Cash");
    setSellOpen(true);
  };

  const handleSell = async () => {
    if (!selectedItem || !user || isSubmitting) return;
    if (qty > selectedItem.quantity) {
      toast.error("Not enough stock");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer name required");
      return;
    }

    setIsSubmitting(true);
    try {
      const sellId = await getNextSellId(user.id, selectedItem.name);
      const total = qty * (parseFloat(sellPrice) || 0);
      const newQty = selectedItem.quantity - qty;

      // Use a single transaction to update inventory and insert sell
      const { error: invError } = await supabase
        .from("inventory")
        .update({ quantity: newQty })
        .eq("id", selectedItem.id);
      if (invError) throw invError;

      const { error: sellError } = await supabase.from("sells" as any).insert({
        user_id: user.id,
        sell_id: sellId,
        inventory_item_id: selectedItem.id,
        item_name: selectedItem.name,
        item_sku: selectedItem.sku,
        quantity: qty,
        sell_price: parseFloat(sellPrice) || 0,
        total,
        customer_name: customerName,
        customer_mobile: customerMobile,
        payment_method: paymentMethod,
        status: "Completed",
      } as any);
      if (sellError) throw sellError;

      toast.success(`Sold ${qty}x ${selectedItem.name} — ${sellId}`);
      refetchInventory();
      refetchSells();
      setSellOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to process sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareWhatsApp = (sell: any) => {
    const shopName = settings?.shop_name || "RepairDesk";
    const msg = `*${shopName} - Sale Receipt*\n\nSale ID: ${sell.sell_id}\nItem: ${sell.item_name}\nQty: ${sell.quantity}\nTotal: Rs.${Number(sell.total).toLocaleString()}\nPayment: ${sell.payment_method}\n\nTrack: ${window.location.origin}/track?id=${sell.sell_id}`;
    window.open(
      `https://wa.me/${(sell.customer_mobile || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  const handleInvoice = (sell: any) => {
    const s = settings || {
      shop_name: "RepairDesk",
      phone: "",
      address: "",
      gstin: "",
      admin_share_percent: 50,
      staff_share_percent: 50,
      qr_receivers: [],
    };
    const data: SellInvoiceData = {
      sellId: sell.sell_id,
      itemName: sell.item_name,
      itemSku: sell.item_sku,
      quantity: sell.quantity,
      sellPrice: Number(sell.sell_price),
      total: Number(sell.total),
      customerName: sell.customer_name,
      customerMobile: sell.customer_mobile,
      paymentMethod: sell.payment_method,
      createdAt: sell.created_at,
    };
    downloadSellInvoice(data, {
      shopName: s.shop_name,
      phone: s.phone,
      address: s.address,
      gstin: s.gstin,
      adminSharePercent: s.admin_share_percent,
      staffSharePercent: s.staff_share_percent,
      qrReceivers: s.qr_receivers,
    });
  };

  const handleDeleteSell = async (sell: any) => {
    const ok = await softDelete("sells" as any, sell.id, sell.sell_id);
    if (ok) {
      toast("Sale moved to trash", {
        action: {
          label: "Undo",
          onClick: async () => {
            await supabase
              .from("sells" as any)
              .update({ deleted: false, deleted_at: null } as any)
              .eq("id", sell.id);
            refetchSells();
          },
        },
        duration: 5000,
      });
      refetchSells();
    }
  };

  const exportSellsToExcel = () => {
    const headers = [
      "Sell ID",
      "Date",
      "Item",
      "SKU",
      "Qty",
      "Price",
      "Total",
      "Customer",
      "Payment",
    ];
    const rows = (sells as any[]).map((s) => [
      s.sell_id,
      new Date(s.created_at).toLocaleDateString(),
      s.item_name,
      s.item_sku,
      s.quantity,
      s.sell_price,
      s.total,
      s.customer_name,
      s.payment_method,
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Excel (CSV) exported");
  };

  const exportSellsToPDF = () => {
    const doc = new jsPDF() as any;
    doc.text("Sales History Report", 14, 15);
    const tableData = (sells as any[]).map((s) => [
      s.sell_id,
      s.item_name,
      s.quantity,
      "Rs." + Number(s.total).toLocaleString(),
      s.payment_method,
    ]);
    autoTable(doc, {
      head: [["ID", "Item", "Qty", "Total", "Payment"]],
      body: tableData,
      startY: 20,
    });
    doc.save(`sales_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported");
  };

  return (
    <MainLayout title="Sell Inventory">
      <div className="space-y-4 animate-fade-in">
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "shop" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("shop")}
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> Shop
          </Button>
          <Button
            variant={tab === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("history")}
          >
            <FileText className="h-4 w-4 mr-1" /> Sales History
          </Button>
          {tab === "history" && (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={exportSellsToExcel}>
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportSellsToPDF}>
                PDF
              </Button>
            </div>
          )}
        </div>

        {tab === "shop" && (
          <>
            <div className="flex gap-2 mb-4 w-full max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl border-2"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setScanOpen(true)}
                className="h-10 px-4 rounded-xl gap-2 border-2"
              >
                <ScanLine className="h-4 w-4" /> Scan
              </Button>
            </div>
            <BarcodeScanner
              open={scanOpen}
              onClose={() => setScanOpen(false)}
              onScan={handleScanned}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item: any) => (
                <Card
                  key={item.id}
                  className="shadow-card hover:shadow-card-hover transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.sku}
                        </p>
                      </div>
                      <Badge
                        className={`${item.quantity <= item.min_stock ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"} border-0 text-xs`}
                      >
                        Stock: {item.quantity}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">
                        Rs.{Number(item.sell_price).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => openSell(item)}
                        disabled={item.quantity <= 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" /> Sell
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center p-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No items found</p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "history" && (
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">Sale ID</th>
                    <th className="text-left p-3 font-semibold">Item</th>
                    <th className="text-left p-3 font-semibold hidden sm:table-cell">
                      Customer
                    </th>
                    <th className="text-left p-3 font-semibold">Qty</th>
                    <th className="text-left p-3 font-semibold">Total</th>
                    <th className="text-left p-3 font-semibold hidden md:table-cell">
                      Payment
                    </th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(sells as any[]).map((s: any) => (
                    <tr
                      key={s.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span
                            className="font-mono font-bold text-primary cursor-pointer hover:underline"
                            onClick={() => {
                              setSelectedSell(s);
                              setDetailsOpen(true);
                            }}
                          >
                            {s.sell_id}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => {
                              navigator.clipboard.writeText(s.sell_id);
                              toast.success("Copied!");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => {
                              setSelectedTrackId(s.sell_id);
                              setTrackOpen(true);
                            }}
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-3">{s.item_name}</td>
                      <td className="p-3 hidden sm:table-cell">
                        {s.customer_name || "—"}
                      </td>
                      <td className="p-3">{s.quantity}</td>
                      <td className="p-3 font-semibold">
                        Rs.{Number(s.total).toLocaleString()}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {s.payment_method}
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSell(s);
                                setDetailsOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleInvoice(s)}>
                              <FileText className="h-4 w-4 mr-2" /> Invoice PDF
                            </DropdownMenuItem>
                            {s.customer_mobile && (
                              <DropdownMenuItem
                                onClick={() => shareWhatsApp(s)}
                              >
                                <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteSell(s)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {(sells as any[]).length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No sales yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Dialog open={sellOpen} onOpenChange={setSellOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Sell — {selectedItem?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Available Stock: <strong>{selectedItem?.quantity}</strong>
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center">
                  {qty}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setQty(Math.min(selectedItem?.quantity || 1, qty + 1))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label>Customer Name *</Label>
                <Input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <Label>Customer Mobile <span className="text-[10px] text-muted-foreground">(10 digits)</span></Label>
                <Input
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
              <div>
                <Label>Sell Price (Rs.)</Label>
                <Input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI/QR">UPI/QR</SelectItem>
                    <SelectItem value="Due">Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "UPI/QR" && (
                <div className="mt-2 p-4 border rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center gap-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Scan to Pay ₹
                    {(qty * (parseFloat(sellPrice) || 0)).toLocaleString()}
                  </p>
                  <div className="bg-white p-3 rounded-xl shadow-md border-2 border-primary/10">
                    {settings?.upi_id ? (
                      <QRCodeSVG
                        value={`upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.shop_name || "Merchant")}&am=${qty * (parseFloat(sellPrice) || 0)}&cu=INR&tn=${encodeURIComponent("Sale " + (selectedItem?.name || ""))}`}
                        size={140}
                        fgColor="#4f46e5"
                        includeMargin
                      />
                    ) : (
                      <div className="h-[140px] w-[140px] flex items-center justify-center text-xs text-muted-foreground text-center p-4">
                        UPI ID not set in settings
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-muted rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span>Total</span>
                  <strong>
                    Rs.{(qty * (parseFloat(sellPrice) || 0)).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSellOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSell} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Confirm Sale"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Sell Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sale Details — {selectedSell?.sell_id}</DialogTitle>
            </DialogHeader>
            {selectedSell && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Item Name</p>
                    <p className="font-semibold">{selectedSell.item_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SKU</p>
                    <p className="font-mono text-xs">{selectedSell.item_sku}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="font-semibold">{selectedSell.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Amount
                    </p>
                    <p className="font-semibold text-primary">
                      Rs.{Number(selectedSell.total).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-semibold">
                      {selectedSell.customer_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="font-semibold">
                      {selectedSell.customer_mobile || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Payment Method
                    </p>
                    <Badge variant="outline">
                      {selectedSell.payment_method}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {new Date(selectedSell.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <TrackDialog
          open={trackOpen}
          onOpenChange={setTrackOpen}
          initialId={selectedTrackId}
        />
      </div>
    </MainLayout>
  );
}
