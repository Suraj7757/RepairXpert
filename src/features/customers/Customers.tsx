import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
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
import { useAuth } from "@/context/AuthContext";
import { useSupabaseQuery, useSoftDelete } from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import { Plus, Search, Trash2, Gift } from "lucide-react";
import { toast } from "sonner";

export default function Customers() {
  const { user } = useAuth();
  const {
    data: customers,
    loading,
    refetch,
  } = useSupabaseQuery<any>("customers");
  const { data: jobs } = useSupabaseQuery<any>("repair_jobs");
  const { softDelete } = useSoftDelete();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#new") {
        setEditingCustomer(null);
        setName("");
        setMobile("");
        setEmail("");
        setAddress("");
        setOpen(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const filtered = customers.filter(
    (c: any) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search),
  );

  const handleAdd = async () => {
    if (!name || !mobile || !user || isSubmitting) {
      toast.error("Name and mobile required");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update({
            name,
            mobile,
            email: email || null,
            address: address || null,
          })
          .eq("id", editingCustomer.id);
        if (error) throw error;
        toast.success("Customer updated");
      } else {
        const { error } = await supabase.from("customers").insert({
          user_id: user.id,
          name,
          mobile,
          email: email || null,
          address: address || null,
        });
        if (error) throw error;
        toast.success("Customer added");
      }
      refetch();
      setOpen(false);
      setEditingCustomer(null);
      setName("");
      setMobile("");
      setEmail("");
      setAddress("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (c: any) => {
    setEditingCustomer(c);
    setName(c.name);
    setMobile(c.mobile);
    setEmail(c.email || "");
    setAddress(c.address || "");
    setOpen(true);
  };

  const handleDelete = async (c: any) => {
    const ok = await softDelete("customers", c.id, c.name);
    if (ok) {
      toast("Customer moved to trash", {
        action: {
          label: "Undo",
          onClick: async () => {
            await supabase
              .from("customers")
              .update({ deleted: false, deleted_at: null })
              .eq("id", c.id);
            refetch();
          },
        },
        duration: 5000,
      });
      refetch();
    }
  };

  const redeemPoints = async (c: any) => {
    const input = prompt(
      `Customer ${c.name} has ${c.points || 0} points. How many to redeem?`,
    );
    if (!input) return;
    const pts = parseInt(input);
    if (!pts || pts <= 0) {
      toast.error("Invalid points");
      return;
    }
    const { data, error } = await (supabase as any).rpc(
      "redeem_loyalty_points",
      { _customer_id: c.id, _points: pts },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      `Redeemed ${data.points_redeemed} pts → ₹${data.rupee_value} discount`,
    );
    refetch();
  };

  return (
    <MainLayout title="Customers">
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => {
              setEditingCustomer(null);
              setName("");
              setMobile("");
              setEmail("");
              setAddress("");
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Customer
          </Button>
        </div>

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Mobile</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left p-3 font-semibold">Jobs</th>
                  <th className="text-left p-3 font-semibold">Points</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">
                    Since
                  </th>
                  <th className="text-left p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr
                    key={c.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">{c.mobile}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {c.email || "—"}
                    </td>
                    <td className="p-3">
                      {jobs.filter((j: any) => j.customer_id === c.id).length}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-primary">
                        {c.points || 0}
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-amber-600"
                        title="Redeem points"
                        onClick={() => redeemPoints(c)}
                      >
                        <Gift className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(c)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {loading ? "Loading..." : "No customers found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
              setEditingCustomer(null);
              setName("");
              setMobile("");
              setEmail("");
              setAddress("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit" : "Add"} Customer
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Mobile * <span className="text-[10px] text-muted-foreground">(10 digits)</span></Label>
                <Input
                  value={mobile}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (editingCustomer ? "Save Changes" : "Add")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
