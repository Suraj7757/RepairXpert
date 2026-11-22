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
import { Plus, Search, Trash2, Gift, History, Copy } from "lucide-react";
import { toast } from "sonner";

export default function Customers() {
  const { user } = useAuth();
  const {
    data: customers,
    loading,
    refetch,
  } = useSupabaseQuery<any>("customers");
  const { data: jobs } = useSupabaseQuery<any>("repair_jobs");
  const { data: payments } = useSupabaseQuery<any>("payments");
  const { softDelete } = useSoftDelete();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [historyCustomer, setHistoryCustomer] = useState<any>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const historyJobs = historyCustomer
    ? jobs
        .filter((j: any) =>
          j.customer_id === historyCustomer.id ||
          j.customer_mobile === historyCustomer.mobile
        )
        .sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    : [];

  const paidForJob = (jobId: string) =>
    payments
      .filter((p: any) =>
        p.repair_job_id === jobId &&
        !p.deleted &&
        !["Due", "Refunded"].includes(String(p.method))
      )
      .reduce((total: number, p: any) => total + Number(p.amount || 0), 0);

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
                        className="h-8 w-8 p-0"
                        title="View repair history"
                        onClick={() => {
                          setHistoryCustomer(c);
                          setHistoryOpen(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
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

        <Dialog
          open={historyOpen}
          onOpenChange={(open) => {
            setHistoryOpen(open);
            if (!open) setHistoryCustomer(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Repair History — {historyCustomer?.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {historyCustomer?.mobile} · {historyJobs.length} repair job{historyJobs.length === 1 ? "" : "s"}
              </p>
            </DialogHeader>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">Tracking ID</th>
                    <th className="p-3 text-left">Device / Issue</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-right">Estimate</th>
                    <th className="p-3 text-right">Received</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyJobs.map((job: any) => {
                    const received = paidForJob(job.id);
                    const balance = Math.max(0, Number(job.estimated_cost || 0) - received);
                    return (
                      <tr key={job.id} className="border-b last:border-0">
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-semibold text-primary">{job.job_id}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              title="Copy tracking ID"
                              onClick={() => {
                                navigator.clipboard.writeText(job.job_id);
                                toast.success("Tracking ID copied");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{job.device_brand} {job.device_model}</p>
                          <p className="max-w-48 truncate text-xs text-muted-foreground">{job.problem_description}</p>
                        </td>
                        <td className="p-3">{job.status}</td>
                        <td className="p-3 text-right tabular-nums">₹{Number(job.estimated_cost || 0).toLocaleString("en-IN")}</td>
                        <td className="p-3 text-right tabular-nums text-emerald-600">₹{received.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-right tabular-nums text-amber-600">₹{balance.toLocaleString("en-IN")}</td>
                        <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(job.created_at).toLocaleDateString("en-IN")}</td>
                      </tr>
                    );
                  })}
                  {historyJobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">No repair history found for this customer.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
