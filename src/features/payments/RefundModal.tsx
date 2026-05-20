import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  RotateCcw,
  User,
  IndianRupee,
  AlertCircle,
  Banknote,
  Smartphone,
  Building2,
  CheckCircle,
} from "lucide-react";

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  payment: {
    id?: string;
    job_id: string;
    amount: number;
    customer_name?: string;
    customer_mobile?: string;
  } | null;
  onSuccess?: () => void;
}

const refundReasons = [
  "Device not repairable",
  "Overcharged by mistake",
  "Service cancelled by customer",
  "Quality complaint",
  "Warranty claim",
  "Duplicate payment",
  "Customer dissatisfied",
  "Other",
];

export default function RefundModal({
  open,
  onClose,
  payment,
  onSuccess,
}: RefundModalProps) {
  const { user, shopId } = useAuth();
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("cash");
  const [upiOrAccount, setUpiOrAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const finalAmount =
    refundType === "full"
      ? payment?.amount || 0
      : parseFloat(refundAmount) || 0;

  const handleRefund = async () => {
    if (!user || !payment) return;
    if (!reason) {
      toast.error("Please select a refund reason");
      return;
    }
    if (refundType === "partial" && (!refundAmount || finalAmount <= 0)) {
      toast.error("Enter a valid refund amount");
      return;
    }
    if (finalAmount > (payment.amount || 0)) {
      toast.error("Refund amount cannot exceed original amount");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("payment_refunds").insert({
        job_id: payment.job_id,
        payment_id: payment.id || null,
        user_id: user.id,
        shop_id: shopId || null,
        customer_name: payment.customer_name || "",
        customer_phone: (payment as any).customer_mobile || "",
        original_amount: payment.amount,
        refund_amount: finalAmount,
        refund_method: method,
        processed_at: new Date().toISOString(),
      } as any);

      if (error) throw error;

      // Deduct from wallet if exists
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (wallet) {
        await supabase
          .from("wallets")
          .update({
            balance: Math.max(0, Number(wallet.balance) - finalAmount),
          })
          .eq("user_id", user.id);

        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          type: "withdrawal",
          source: "business",
          amount: finalAmount,
          description: `Refund for Job ${payment.job_id}: ${reason}`,
        } as any);
      }

      // Mark payment as refunded
      if (payment.id) {
        await supabase
          .from("payments")
          .update({ method: "Refunded" as any })
          .eq("id", payment.id);
      }

      setDone(true);
      toast.success(`Refund of ₹${finalAmount.toLocaleString()} processed!`);
      onSuccess?.();
    } catch (e) {
      toast.error("Failed to process refund");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setDone(false);
    setRefundType("full");
    setRefundAmount("");
    setReason("");
    setNotes("");
    setMethod("cash");
    setUpiOrAccount("");
    onClose();
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Initiate Refund
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-orange-100 text-sm">
                <User className="h-3.5 w-3.5" />
                <span>{payment.customer_name || "Customer"}</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <span className="text-xs text-orange-200">Original Paid:</span>
                <IndianRupee className="h-4 w-4" />
                <span className="font-black text-xl">
                  {payment.amount.toLocaleString()}
                </span>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-0">
              Job #{payment.job_id}
            </Badge>
          </div>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-lg">Refund Processed!</h3>
            <p className="text-muted-foreground text-sm">
              ₹{finalAmount.toLocaleString()} refund has been recorded via{" "}
              {method}.
            </p>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Refund Type */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Refund Type
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      val: "full",
                      label: "Full Refund",
                      amount: `₹${payment.amount.toLocaleString()}`,
                    },
                    {
                      val: "partial",
                      label: "Partial Refund",
                      amount: "Custom",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setRefundType(opt.val as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        refundType === opt.val
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                          : "border-border hover:border-orange-300"
                      }`}
                    >
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div
                        className={`text-xs mt-0.5 ${refundType === opt.val ? "text-orange-600" : "text-muted-foreground"}`}
                      >
                        {opt.amount}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Partial Amount */}
              {refundType === "partial" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Refund Amount (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-8 font-bold text-orange-600 border-orange-300 focus-visible:ring-orange-400"
                      placeholder="Enter amount"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={payment.amount}
                    />
                  </div>
                  {parseFloat(refundAmount) > payment.amount && (
                    <div className="flex items-center gap-1 text-destructive text-xs">
                      <AlertCircle className="h-3 w-3" />
                      Amount exceeds original payment
                    </div>
                  )}
                </div>
              )}

              {/* Refund Amount Summary */}
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  Refund Amount
                </span>
                <span className="text-xl font-black text-orange-600">
                  ₹{finalAmount.toLocaleString()}
                </span>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Refund Reason *
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {refundReasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Additional Notes
                </Label>
                <Textarea
                  placeholder="Internal notes about this refund..."
                  className="resize-none min-h-[70px] text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Refund Method */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Refund Method
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      val: "cash",
                      label: "Cash",
                      icon: Banknote,
                      color: "green",
                    },
                    {
                      val: "upi",
                      label: "UPI",
                      icon: Smartphone,
                      color: "blue",
                    },
                    {
                      val: "bank_transfer",
                      label: "Bank",
                      icon: Building2,
                      color: "purple",
                    },
                  ].map((m) => (
                    <button
                      key={m.val}
                      onClick={() => setMethod(m.val)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                        method === m.val
                          ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-950/20`
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <m.icon
                        className={`h-5 w-5 ${method === m.val ? `text-${m.color}-600` : "text-muted-foreground"}`}
                      />
                      <span
                        className={`text-xs font-bold ${method === m.val ? `text-${m.color}-600` : "text-muted-foreground"}`}
                      >
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {(method === "upi" || method === "bank_transfer") && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">
                    {method === "upi" ? "UPI ID" : "Account / IFSC"}
                  </Label>
                  <Input
                    placeholder={
                      method === "upi"
                        ? "customer@upi"
                        : "Account number or IFSC"
                    }
                    value={upiOrAccount}
                    onChange={(e) => setUpiOrAccount(e.target.value)}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t bg-muted/30 gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                disabled={loading || !reason || finalAmount <= 0}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {loading
                  ? "Processing..."
                  : `Refund ₹${finalAmount.toLocaleString()}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
