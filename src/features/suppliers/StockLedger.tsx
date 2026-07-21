import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Download, ArrowUp, ArrowDown } from "lucide-react";

interface Movement {
  id: string;
  inventory_item_id: string | null;
  item_name: string | null;
  delta: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_at: string;
}

export default function StockLedger() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("stock_movements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);
      setRows((data as Movement[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = rows.filter(r =>
    !q || (r.item_name || "").toLowerCase().includes(q.toLowerCase()) ||
    r.reason.toLowerCase().includes(q.toLowerCase())
  );

  const exportCSV = () => {
    const header = "Date,Item,Delta,Reason,Reference,Note\n";
    const csv = header + filtered.map(r =>
      [new Date(r.created_at).toLocaleString(), r.item_name || "-", r.delta,
       r.reason, `${r.reference_type || ""}:${r.reference_id || ""}`, r.note || ""]
        .map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `stock-ledger-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout title="Stock Ledger">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Stock Movements</h2>
              <p className="text-sm text-muted-foreground">Every stock change — purchases, sales, adjustments</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search item / reason" value={q} onChange={e => setQ(e.target.value)} className="w-56" />
            <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Ledger ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">Loading…</p> :
              filtered.length === 0 ? <p className="text-muted-foreground py-8 text-center">No movements yet.</p> :
              <div className="space-y-1 max-h-[70vh] overflow-auto">
                {filtered.map(r => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 p-2 border-b text-sm">
                    <div className="w-40 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                    <div className="flex-1 font-medium">{r.item_name || "—"}</div>
                    <Badge variant="outline">{r.reason}</Badge>
                    <div className={`flex items-center gap-1 font-bold w-16 justify-end ${r.delta >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                      {r.delta >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {r.delta > 0 ? "+" : ""}{r.delta}
                    </div>
                    <div className="w-full sm:w-auto text-xs text-muted-foreground">{r.note}</div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
