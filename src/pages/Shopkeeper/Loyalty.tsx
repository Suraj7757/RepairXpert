import React, { useState } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, Plus, Minus, History, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ShopkeeperLoyalty() {
  const { data: profiles = [], refetch } = useSupabaseQuery<any>("profiles");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [pointsDelta, setPointsDelta] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter only customers
  const customers = profiles.filter((p: any) => p.role === "customer" || !p.role);

  const handleAdjustPoints = async (type: "add" | "deduct") => {
    const delta = parseInt(pointsDelta);
    if (isNaN(delta) || delta <= 0) {
      toast.error("Please enter a valid positive number.");
      return;
    }

    setLoading(true);
    const finalDelta = type === "add" ? delta : -delta;
    const currentPoints = selectedProfile.loyalty_points || 0;
    const newPoints = Math.max(0, currentPoints + finalDelta);

    try {
      // 1. Update profiles table
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .update({ loyalty_points: newPoints })
        .eq("id", selectedProfile.id);

      if (profileError) throw profileError;

      // 2. Insert ledger entry
      const { error: ledgerError } = await (supabase as any).from("loyalty_ledger").insert({
        user_id: selectedProfile.user_id,
        points: finalDelta,
        description: reason || (type === "add" ? "Manual credit" : "Manual debit"),
      });

      if (ledgerError) throw ledgerError;

      toast.success(`Successfully updated points balance!`);
      setAdjustOpen(false);
      setPointsDelta("");
      setReason("");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update points: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <Gift className="h-8 w-8 text-primary animate-pulse" /> Customer Loyalty System
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Manage customer loyalty points, rewards, and ledger transactions.
        </p>
      </div>

      <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Customer Directory & Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {customers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-medium">
              No registered customer profiles found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground text-xs uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Loyalty Points</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-4 px-4 font-bold text-sm">
                      {customer.display_name || "Valued Customer"}
                    </td>
                    <td className="py-4 px-4 text-xs text-muted-foreground font-medium">
                      {customer.email || "N/A"}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-primary">
                      {customer.role || "customer"}
                    </td>
                    <td className="py-4 px-4 text-center font-black text-base text-primary">
                      {customer.loyalty_points || 0} pts
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProfile(customer);
                          setAdjustOpen(true);
                        }}
                        className="rounded-xl font-bold gap-1 text-xs"
                      >
                        Adjust Points
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Adjust Points Modal */}
      {selectedProfile && (
        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight">
                Adjust Points for {selectedProfile.display_name || "Customer"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <span className="text-sm font-bold">Current Balance:</span>
                <span className="text-lg font-black text-primary">
                  {selectedProfile.loyalty_points || 0} pts
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Points Amount</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Reason / Description</Label>
                <Input
                  placeholder="e.g. Completed screen replacement bonus"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button
                  onClick={() => handleAdjustPoints("add")}
                  disabled={loading}
                  className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Credit Points
                </Button>
                <Button
                  onClick={() => handleAdjustPoints("deduct")}
                  disabled={loading}
                  variant="outline"
                  className="rounded-xl font-bold border-rose-500/25 text-rose-600 hover:bg-rose-50"
                >
                  <Minus className="h-4 w-4 mr-1.5" /> Debit Points
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
