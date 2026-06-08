import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useSupabaseQuery, useShopSettings } from "@/hooks/useSupabaseData";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Search,
  Download,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  User,
  Phone,
  IndianRupee,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { downloadGenericInvoice, shareInvoiceWhatsApp } from "@/lib/invoice";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceItem {
  description: string;
  cost: number;
}

export default function Invoices() {
  const { user, role, shopId } = useAuth();
  const { settings } = useShopSettings();
  
  // Data queries
  const { data: invoices, loading: invoicesLoading, refetch: refetchInvoices } = useSupabaseQuery<any>("invoices");
  const { data: customers } = useSupabaseQuery<any>("customers");

  // State
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<any | null>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("manual");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [status, setStatus] = useState("unpaid");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", cost: 0 }]);
  const [formLoading, setFormLoading] = useState(false);

  // Handle Customer Selection change
  const handleCustomerChange = (val: string) => {
    setSelectedCustomerId(val);
    if (val === "manual") {
      setCustomerName("");
      setCustomerMobile("");
    } else {
      const found = customers.find((c: any) => c.id === val);
      if (found) {
        setCustomerName(found.name || "");
        setCustomerMobile(found.mobile || "");
      }
    }
  };

  // Add Item Line
  const addItemRow = () => {
    setItems([...items, { description: "", cost: 0 }]);
  };

  // Remove Item Line
  const removeItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Update Item field
  const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
    const updated = items.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setItems(updated);
  };

  // Total calculation
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerMobile.trim()) {
      toast.error("Customer mobile is required");
      return;
    }
    if (items.some((item) => !item.description.trim() || Number(item.cost) <= 0)) {
      toast.error("Please fill all items with valid descriptions and positive costs");
      return;
    }

    setFormLoading(true);

    try {
      const targetUserId = role === "staff" && shopId ? shopId : user?.id;
      const payload = {
        user_id: targetUserId,
        shop_id: shopId || null,
        customer_id: selectedCustomerId === "manual" ? null : selectedCustomerId,
        customer_name: customerName.trim(),
        customer_mobile: customerMobile.trim(),
        amount: totalAmount,
        status,
        payment_method: paymentMethod,
        jobs_details: JSON.stringify(items),
      };

      const { error } = await (supabase as any).from("invoices").insert(payload);

      if (error) {
        throw error;
      }

      toast.success("Invoice created successfully!");
      setIsOpen(false);
      resetForm();
      refetchInvoices();
    } catch (error: any) {
      toast.error("Failed to create invoice: " + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("manual");
    setCustomerName("");
    setCustomerMobile("");
    setStatus("unpaid");
    setPaymentMethod("cash");
    setItems([{ description: "", cost: 0 }]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const { error } = await (supabase as any).from("invoices").delete().eq("id", id);
      if (error) throw error;
      toast.success("Invoice deleted");
      refetchInvoices();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Filtered Invoices list
  const filteredInvoices = invoices?.filter((inv: any) => {
    const term = search.toLowerCase();
    return (
      (inv.customer_name?.toLowerCase() || "").includes(term) ||
      (inv.customer_mobile || "").includes(term) ||
      (inv.id?.toLowerCase() || "").includes(term)
    );
  }) || [];

  return (
    <MainLayout title="Invoices">
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, phone, or invoice ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-2xl border-white/10 bg-muted/40"
            />
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-2xl gradient-primary font-bold shadow-lg shadow-primary/20 flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="h-5 w-5" /> Generate Invoice
          </Button>
        </div>

        {/* Invoices List Grid */}
        {invoicesLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center p-12 bg-card/30 rounded-3xl border border-dashed border-white/10">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold">No Invoices Found</h3>
            <p className="text-sm text-muted-foreground mt-1">Generate your first premium customer invoice today.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInvoices.map((inv: any) => {
              const dateStr = new Date(inv.created_at).toLocaleDateString();
              const isPaid = inv.status === "paid";
              let itemsList: InvoiceItem[] = [];
              try {
                itemsList = typeof inv.jobs_details === "string" ? JSON.parse(inv.jobs_details) : inv.jobs_details || [];
              } catch (e) {}

              return (
                <motion.div
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-white/10 bg-card/65 backdrop-blur-md overflow-hidden relative group">
                    <div className={`absolute top-0 inset-x-0 h-1.5 ${isPaid ? "bg-green-500" : "bg-orange-500"}`} />
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-muted-foreground uppercase">
                            #{inv.id.substring(0, 8)}
                          </span>
                          <Badge variant={isPaid ? "default" : "secondary"} className={`h-5 text-[10px] uppercase font-bold ${isPaid ? "bg-green-500/10 text-green-500 hover:bg-green-500/15" : "bg-orange-500/10 text-orange-500 hover:bg-orange-500/15"}`}>
                            {inv.status}
                          </Badge>
                        </div>
                        <h4 className="text-base font-black tracking-tight">{inv.customer_name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{dateStr}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-white/5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-muted-foreground uppercase">{inv.payment_method}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-lg font-black text-foreground">
                          <IndianRupee className="h-4 w-4 shrink-0" />
                          <span>{inv.amount}</span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      {itemsList.length > 0 && (
                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Items billed</p>
                          {itemsList.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-medium text-foreground/80">
                              <span className="truncate max-w-[200px]">{item.description}</span>
                              <span className="font-semibold">Rs. {item.cost}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailInvoice(inv)}
                          className="flex-1 rounded-xl text-xs font-bold"
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadGenericInvoice(inv, settings)}
                          className="rounded-xl h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 border-blue-500/20"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const desc = itemsList.map(i => i.description).join(", ");
                            shareInvoiceWhatsApp(
                              inv.customer_mobile,
                              inv.customer_name,
                              inv.amount,
                              inv.id,
                              desc || "Services Billed",
                              settings?.shop_name || "RepairXpert"
                            );
                          }}
                          className="rounded-xl h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10 border-green-500/20"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(inv.id)}
                          className="rounded-xl h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 ml-auto"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Generate Invoice Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl bg-card border-white/10 text-foreground overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight">Generate Professional Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {/* Customer Selector */}
              <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-white/5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger className="rounded-xl border-white/10 bg-background/50">
                      <SelectValue placeholder="Search or select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">-- Enter Manually --</SelectItem>
                      {customers?.map((cust: any) => (
                        <SelectItem key={cust.id} value={cust.id}>
                          {cust.name} ({cust.mobile})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Customer Name
                    </Label>
                    <Input
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={selectedCustomerId !== "manual"}
                      className="rounded-xl border-white/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Mobile Number
                    </Label>
                    <Input
                      required
                      placeholder="e.g. 9876543210"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      disabled={selectedCustomerId !== "manual"}
                      className="rounded-xl border-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Items Line Editor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billed Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="h-8 rounded-lg font-bold text-xs">
                    + Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <Input
                        required
                        placeholder="Description (e.g. Screen Replacement)"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        className="flex-1 rounded-xl border-white/10"
                      />
                      <div className="relative w-32">
                        <Input
                          required
                          type="number"
                          placeholder="Cost"
                          value={item.cost || ""}
                          onChange={(e) => updateItem(idx, "cost", parseFloat(e.target.value) || 0)}
                          className="pl-8 rounded-xl border-white/10"
                        />
                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(idx)}
                          className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Payment details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-muted/20 border border-white/5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="rounded-xl border-white/10 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="rounded-xl border-white/10 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI / QR Code</SelectItem>
                        <SelectItem value="card">Debit / Credit Card</SelectItem>
                        <SelectItem value="netbanking">Net Banking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-end p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Total Bill Amount</span>
                  <div className="flex items-center gap-0.5 text-3xl font-black text-foreground mt-1">
                    <IndianRupee className="h-7 w-7 text-primary shrink-0" />
                    <span>{totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading} className="rounded-xl gradient-primary font-bold px-6 shadow-lg shadow-primary/20">
                  {formLoading ? "Generating..." : "Save & Generate"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Invoice Detail Dialog */}
        <Dialog open={!!detailInvoice} onOpenChange={(open) => !open && setDetailInvoice(null)}>
          <DialogContent className="max-w-lg bg-card border-white/10 text-foreground overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight flex items-center justify-between w-full pr-6">
                <span>Invoice Information</span>
                {detailInvoice && (
                  <Badge variant={detailInvoice.status === "paid" ? "default" : "secondary"} className={`text-xs font-bold uppercase ${detailInvoice.status === "paid" ? "bg-green-500/10 text-green-500 hover:bg-green-500/15" : "bg-orange-500/10 text-orange-500 hover:bg-orange-500/15"}`}>
                    {detailInvoice.status}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {detailInvoice && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Invoice ID</span>
                    <span className="font-mono font-semibold uppercase">{detailInvoice.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Created At</span>
                    <span className="font-semibold">{new Date(detailInvoice.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Customer</span>
                    <span className="font-semibold">{detailInvoice.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Mobile</span>
                    <span className="font-semibold">{detailInvoice.customer_mobile}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Billed Items</span>
                  <div className="border border-white/5 rounded-2xl overflow-hidden bg-background/50 divide-y divide-white/5">
                    {(() => {
                      let list: InvoiceItem[] = [];
                      try {
                        list = typeof detailInvoice.jobs_details === "string" ? JSON.parse(detailInvoice.jobs_details) : detailInvoice.jobs_details || [];
                      } catch (e) {}

                      return list.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 text-sm">
                          <span>{item.description}</span>
                          <span className="font-bold">Rs. {item.cost}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Payment Method</span>
                    <span className="text-xs font-black uppercase text-foreground/80">{detailInvoice.payment_method}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-primary uppercase block">Total Amount</span>
                    <span className="text-2xl font-black text-foreground">Rs. {detailInvoice.amount}</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                  <Button variant="outline" onClick={() => setDetailInvoice(null)} className="rounded-xl">
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadGenericInvoice(detailInvoice, settings)}
                    className="rounded-xl border-blue-500/20 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 flex items-center gap-2 font-bold"
                  >
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                  <Button
                    onClick={() => {
                      let list: InvoiceItem[] = [];
                      try {
                        list = typeof detailInvoice.jobs_details === "string" ? JSON.parse(detailInvoice.jobs_details) : detailInvoice.jobs_details || [];
                      } catch (e) {}
                      const desc = list.map(i => i.description).join(", ");
                      shareInvoiceWhatsApp(
                        detailInvoice.customer_mobile,
                        detailInvoice.customer_name,
                        detailInvoice.amount,
                        detailInvoice.id,
                        desc || "Services Billed",
                        settings?.shop_name || "RepairXpert"
                      );
                    }}
                    className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-green-600/15"
                  >
                    <Share2 className="h-4 w-4" /> Share WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
