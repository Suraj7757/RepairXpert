import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Package, Search, Store, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  ready: "bg-teal-100 text-teal-700 border-teal-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  converted: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function CustomerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [shops, setShops] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      setLoading(true);
      const { data } = await (supabase as any)
        .from("booking_requests")
        .select("*")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });
      setBookings(data || []);

      const shopIds = Array.from(new Set((data || []).map((b: any) => b.user_id)));
      if (shopIds.length) {
        const { data: sd } = await (supabase as any)
          .from("shop_settings")
          .select("user_id, shop_name")
          .in("user_id", shopIds);
        const map: Record<string, string> = {};
        (sd || []).forEach((s: any) => (map[s.user_id] = s.shop_name));
        setShops(map);
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <MainLayout title="My Bookings">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">My Repair Bookings</h1>
            <p className="text-sm text-muted-foreground">
              Track every repair request you've sent to shops.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/customer/book"><CalendarCheck className="h-4 w-4 mr-1" /> New Booking</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.dispatchEvent(new CustomEvent("open-rx-track"))}
            >
              <Search className="h-4 w-4 mr-1" /> Track by ID
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Bookings
              <Badge variant="secondary" className="ml-auto">{bookings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-6">Loading...</p>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No bookings yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/customer/book">Book Your First Repair</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl border hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="h-4 w-4 text-primary shrink-0" />
                          <p className="font-bold truncate">{shops[b.user_id] || "Shop"}</p>
                        </div>
                        <p className="text-sm font-semibold">{b.device_brand} {b.device_model}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{b.problem_description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(b.created_at).toLocaleString("en-IN")}
                          {b.converted_job_id && (
                            <span className="ml-2 text-primary font-semibold">→ Job {b.converted_job_id}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border ${statusColor[b.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {(b.status || "pending").replace("_", " ").toUpperCase()}
                        </span>
                        {b.converted_job_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent("open-rx-track", { detail: { id: b.converted_job_id } })
                              )
                            }
                          >
                            Track <ChevronRight className="h-3 w-3 ml-0.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
