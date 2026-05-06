import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useSoftDelete } from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import { Search, RotateCcw, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TrashItem {
  id: string;
  name: string;
  type: "Customer" | "Job" | "Inventory" | "Settlement";
  table: "customers" | "repair_jobs" | "inventory" | "settlement_cycles";
  deletedAt: string;
}

export default function Trash() {
  const { user, role } = useAuth();
  const { restore, permanentDelete } = useSoftDelete();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "bulk-delete" | "bulk-restore"
  >("delete");
  const [targetId, setTargetId] = useState("");
  const [tab, setTab] = useState("all");

  const fetchTrash = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const all: TrashItem[] = [];

    const [customers, jobs, inventory, settlements] = await Promise.all([
      supabase
        .from("customers")
        .select("id, name, deleted_at")
        .eq("user_id", user.id)
        .eq("deleted", true),
      supabase
        .from("repair_jobs")
        .select("id, job_id, customer_name, device_brand, deleted_at")
        .eq("user_id", user.id)
        .eq("deleted", true),
      supabase
        .from("inventory")
        .select("id, name, deleted_at")
        .eq("user_id", user.id)
        .eq("deleted", true),
      supabase
        .from("settlement_cycles")
        .select("id, start_date, end_date, deleted_at")
        .eq("user_id", user.id)
        .eq("deleted", true),
    ]);

    customers.data?.forEach((c) =>
      all.push({
        id: c.id,
        name: c.name,
        type: "Customer",
        table: "customers",
        deletedAt: c.deleted_at || "",
      }),
    );
    jobs.data?.forEach((j) =>
      all.push({
        id: j.id,
        name: `${j.job_id} - ${j.customer_name} (${j.device_brand})`,
        type: "Job",
        table: "repair_jobs",
        deletedAt: j.deleted_at || "",
      }),
    );
    inventory.data?.forEach((i) =>
      all.push({
        id: i.id,
        name: i.name,
        type: "Inventory",
        table: "inventory",
        deletedAt: i.deleted_at || "",
      }),
    );
    settlements.data?.forEach((s) =>
      all.push({
        id: s.id,
        name: `${s.start_date} → ${s.end_date}`,
        type: "Settlement",
        table: "settlement_cycles",
        deletedAt: s.deleted_at || "",
      }),
    );

    all.sort(
      (a, b) =>
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
    );
    setItems(all);
    setSelected(new Set());
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const filtered = items.filter((i) => {
    const matchTab = tab === "all" || i.type.toLowerCase() === tab;
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.type.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleRestore = async (item: TrashItem) => {
    const ok = await restore(item.table, item.id, item.name);
    if (ok) {
      toast.success(`${item.name} restored`);
      fetchTrash();
    }
  };

  const handlePermanentDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const ok = await permanentDelete(item.table, item.id, item.name);
    if (ok) {
      toast.success("Permanently deleted");
      fetchTrash();
    }
    setConfirmOpen(false);
  };

  const handleBulkRestore = async () => {
    const selectedItems = items.filter((i) => selected.has(i.id));
    for (const item of selectedItems) {
      await restore(item.table, item.id, item.name);
    }
    toast.success(`${selectedItems.length} items restored`);
    fetchTrash();
    setConfirmOpen(false);
  };

  const handleBulkDelete = async () => {
    const selectedItems = items.filter((i) => selected.has(i.id));
    for (const item of selectedItems) {
      await permanentDelete(item.table, item.id, item.name);
    }
    toast.success(`${selectedItems.length} items permanently deleted`);
    fetchTrash();
    setConfirmOpen(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((i) => i.id)));
  };

  const typeColors: Record<string, string> = {
    Customer: "bg-info/10 text-info",
    Job: "bg-primary/10 text-primary",
    Inventory: "bg-warning/10 text-warning",
    Settlement: "bg-success/10 text-success",
  };

  const isAdmin = isSuperAdmin;

  return (
    <MainLayout title="🗑️ Trash">
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmAction("bulk-restore");
                  setConfirmOpen(true);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Restore ({selected.size})
              </Button>
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setConfirmAction("bulk-delete");
                    setConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete ({selected.size})
                </Button>
              )}
            </div>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All ({items.length})</TabsTrigger>
            <TabsTrigger value="customer">
              Customers ({items.filter((i) => i.type === "Customer").length})
            </TabsTrigger>
            <TabsTrigger value="job">
              Jobs ({items.filter((i) => i.type === "Job").length})
            </TabsTrigger>
            <TabsTrigger value="inventory">
              Inventory ({items.filter((i) => i.type === "Inventory").length})
            </TabsTrigger>
            <TabsTrigger value="settlement">
              Settlements ({items.filter((i) => i.type === "Settlement").length}
              )
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={
                        filtered.length > 0 && selected.size === filtered.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="text-left p-3 font-semibold">Name / Title</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">
                    Deleted Date
                  </th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3">
                      <Badge
                        className={`${typeColors[item.type]} border-0 text-xs`}
                      >
                        {item.type}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {item.deletedAt
                        ? new Date(item.deletedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleRestore(item)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Restore
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => {
                              setTargetId(item.id);
                              setConfirmAction("delete");
                              setConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {loading ? "Loading..." : "🗑️ Trash is empty"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {confirmAction === "delete"
                  ? "Permanent Delete"
                  : confirmAction === "bulk-delete"
                    ? "Bulk Permanent Delete"
                    : "Bulk Restore"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {confirmAction === "delete" || confirmAction === "bulk-delete"
                ? "This action cannot be undone. Data will be permanently removed."
                : `Restore ${selected.size} item(s)?`}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              {confirmAction === "delete" && (
                <Button
                  variant="destructive"
                  onClick={() => handlePermanentDelete(targetId)}
                >
                  Delete Forever
                </Button>
              )}
              {confirmAction === "bulk-delete" && (
                <Button variant="destructive" onClick={handleBulkDelete}>
                  Delete All Forever
                </Button>
              )}
              {confirmAction === "bulk-restore" && (
                <Button onClick={handleBulkRestore}>Restore All</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
