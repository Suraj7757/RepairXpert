import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarCheck, CheckCircle2, Store, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";

export default function BookRepair() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    device_brand: "",
    device_model: "",
    problem_description: "",
    preferred_date: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("shop_settings")
        .select("user_id, shop_name, address, phone, booking_slug")
        .eq("booking_enabled", true)
        .limit(50);
      setShops(data || []);
      if (data?.length) setSelectedShopId(data[0].user_id);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!selectedShopId) return toast.error("Please select a shop");
    if (!form.device_brand || !form.problem_description) return toast.error("Please fill all required fields");
    setSubmitting(true);
    const { error } = await (supabase as any).from("booking_requests").insert({
      customer_name: user?.user_metadata?.display_name || "Customer",
      customer_mobile: user?.user_metadata?.mobile || "",
      customer_email: user?.email,
      device_brand: form.device_brand,
      device_model: form.device_model,
      problem_description: form.problem_description,
      preferred_date: form.preferred_date || null,
      user_id: selectedShopId,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setSubmitted(true);
  };

  return (
    <MainLayout title="Book a Repair">
      <div className="max-w-3xl mx-auto space-y-6">
        {submitted ? (
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold">Booking Sent!</h2>
              <p className="text-muted-foreground">The shop will contact you shortly to confirm.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/customer/bookings")}>View My Bookings</Button>
                <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ device_brand: "", device_model: "", problem_description: "", preferred_date: "" }); }}>
                  Book Another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" /> Book a Repair
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <Label className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5" /> Choose a Shop *</Label>
                  <select
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5"
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a shop...</option>
                    {shops.map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.shop_name}{s.address ? ` — ${s.address}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Device Brand *</Label>
                    <Input
                      placeholder="Samsung, Apple..."
                      value={form.device_brand}
                      onChange={(e) => setForm({ ...form, device_brand: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Device Model</Label>
                    <Input
                      placeholder="Galaxy S21, iPhone 13..."
                      value={form.device_model}
                      onChange={(e) => setForm({ ...form, device_model: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Describe the Problem *</Label>
                  <Textarea
                    placeholder="Screen is cracked, won't turn on, battery drains fast..."
                    value={form.problem_description}
                    onChange={(e) => setForm({ ...form, problem_description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label>Preferred Date</Label>
                  <Input
                    type="date"
                    value={form.preferred_date}
                    onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Booking"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Need to track an existing job?{" "}
                  <Link to="/track" className="text-primary font-semibold underline">
                    Track Order
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
