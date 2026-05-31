import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarCheck,
  Copy,
  ExternalLink,
  Check,
  X,
  Wrench,
  MessageCircle,
  Clock,
  Phone,
  ChevronRight,
  PackageCheck,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = ["all", "pending", "accepted", "in_progress", "ready", "completed", "rejected", "converted"] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pending",    color: "text-amber-600",   bg: "bg-amber-50 border-amber-200" },
  accepted:   { label: "Accepted",   color: "text-blue-600",    bg: "bg-blue-50 border-blue-200" },
  in_progress:{ label: "In Progress",color: "text-indigo-600",  bg: "bg-indigo-50 border-indigo-200" },
  ready:      { label: "Ready",      color: "text-teal-600",    bg: "bg-teal-50 border-teal-200" },
  completed:  { label: "Completed",  color: "text-green-600",   bg: "bg-green-50 border-green-200" },
  rejected:   { label: "Rejected",   color: "text-rose-600",    bg: "bg-rose-50 border-rose-200" },
  converted:  { label: "Converted",  color: "text-purple-600",  bg: "bg-purple-50 border-purple-200" },
};

export default function BookingsAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [convertOpen, setConvertOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectBooking, setRejectBooking] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [convertBooking, setConvertBooking] = useState<any>(null);
  const [convertForm, setConvertForm] = useState({ technician_name: "", estimated_cost: "" });
  const [slug, setSlug] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<any>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [shopRes, bookRes] = await Promise.all([
      (supabase as any).from("shop_settings").select("booking_slug, booking_enabled").eq("user_id", user.id).maybeSingle(),
      (supabase as any).from("booking_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setSlug(shopRes.data?.booking_slug || "");
    setEnabled(shopRes.data?.booking_enabled || false);
    setBookings(bookRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const saveSettings = async () => {
    if (!user || isSubmitting) return;
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!cleanSlug) { toast.error("Slug required"); return; }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from("shop_settings").update({ booking_slug: cleanSlug, booking_enabled: enabled }).eq("user_id", user.id);
      if (error) throw error;
      setSlug(cleanSlug);
      toast.success("Booking page settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally { setIsSubmitting(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from("booking_requests").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Status → ${status}`);
      load();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally { setIsSubmitting(false); }
  };

  const sendWhatsApp = (b: any, msg: string) => {
    const phone = (b.customer_mobile || "").replace(/\D/g, "");
    if (!phone) { toast.error("No mobile number on this booking"); return; }
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const notifyAccepted = (b: any) => {
    sendWhatsApp(b, `✅ Hello ${b.customer_name}, your repair request for ${b.device_brand} ${b.device_model || ""} has been *ACCEPTED*.\n\nProblem: ${b.problem_description}\n\nWe will contact you shortly. Thank you! 🙏`);
  };

  const notifyReady = (b: any) => {
    sendWhatsApp(b, `📦 Hello ${b.customer_name}, your *${b.device_brand} ${b.device_model || ""}* repair is *READY for pickup*!\n\nPlease visit our shop to collect your device. Thank you! 🎉`);
  };

  const notifyRejected = (b: any, reason: string) => {
    sendWhatsApp(b, `❌ Hello ${b.customer_name}, unfortunately we are unable to service your ${b.device_brand} ${b.device_model || ""} at this time.\n\nReason: ${reason || "Not specified"}\n\nWe apologize for the inconvenience.`);
  };

  const url = slug ? `${window.location.origin}/book/${slug}` : "";
  const copyUrl = () => { navigator.clipboard.writeText(url); toast.success("Link copied"); };

  const filtered = bookings.filter((b) => {
    const matchTab = activeTab === "all" || b.status === activeTab;
    const matchSearch = !search || b.customer_name?.toLowerCase().includes(search.toLowerCase()) || b.customer_mobile?.includes(search) || b.device_brand?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === "all" ? bookings.length : bookings.filter((b) => b.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const urgentCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
              <CalendarCheck className="h-7 w-7 text-primary" /> Online Bookings
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage customer repair requests & booking flow</p>
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-300 rounded-xl">
              <AlertCircle className="h-4 w-4 text-amber-600 animate-pulse" />
              <span className="text-sm font-bold text-amber-700">{urgentCount} pending request{urgentCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Booking Page Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">🔗 Your Public Booking Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Enable public booking page</Label>
                <p className="text-xs text-muted-foreground">Customers can submit repair requests via your link</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} disabled={isSubmitting} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Your booking link slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-shop-name" disabled={isSubmitting} />
              </div>
              <Button onClick={saveSettings} disabled={isSubmitting} className="mt-5">{isSubmitting ? "Saving..." : "Save"}</Button>
            </div>
            {url && enabled && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-2 flex-wrap">
                <code className="text-xs break-all text-primary font-semibold">{url}</code>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyUrl}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(url, "_blank")}><ExternalLink className="h-3 w-3 mr-1" /> Open</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input placeholder="Search by name, mobile, device..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {STATUS_TABS.map((tab) => {
              const count = counts[tab] || 0;
              const cfg = tab === "all" ? null : STATUS_CONFIG[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:border-border"
                  }`}
                >
                  {tab === "all" ? "All" : cfg?.label}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab ? "bg-white/20" : "bg-muted"}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Booking Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No bookings found</p>
              <p className="text-xs mt-1">{activeTab !== "all" ? `No ${activeTab} bookings` : "Share your booking link to get started"}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((b) => {
                const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG["pending"];
                const age = Math.floor((Date.now() - new Date(b.created_at).getTime()) / 60000);
                const ageLabel = age < 60 ? `${age}m ago` : age < 1440 ? `${Math.floor(age / 60)}h ago` : `${Math.floor(age / 1440)}d ago`;
                return (
                  <Card key={b.id} className={`border shadow-sm hover:shadow-md transition-all ${b.status === "pending" ? "border-amber-200 bg-amber-50/30" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Status dot */}
                        <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${b.status === "pending" ? "bg-amber-500 animate-pulse" : b.status === "accepted" || b.status === "in_progress" ? "bg-blue-500" : b.status === "completed" || b.status === "converted" ? "bg-green-500" : b.status === "rejected" ? "bg-rose-500" : "bg-teal-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-bold text-base">{b.customer_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                <Phone className="h-3 w-3" /> {b.customer_mobile}
                                {b.customer_email && <span>· {b.customer_email}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase border ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              <button onClick={() => { setDetailBooking(b); setDetailOpen(true); }} className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5">
                                Details <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="bg-white rounded-lg p-2 border">
                              <p className="text-muted-foreground">Device</p>
                              <p className="font-bold">{b.device_brand} {b.device_model || ""}</p>
                            </div>
                            {b.device_type && (
                              <div className="bg-white rounded-lg p-2 border">
                                <p className="text-muted-foreground">Type</p>
                                <p className="font-bold">{b.device_type}</p>
                              </div>
                            )}
                            {b.service_type && (
                              <div className="bg-white rounded-lg p-2 border">
                                <p className="text-muted-foreground">Service</p>
                                <p className="font-bold">{b.service_type}</p>
                              </div>
                            )}
                            {b.preferred_date && (
                              <div className="bg-white rounded-lg p-2 border">
                                <p className="text-muted-foreground">Preferred</p>
                                <p className="font-bold">{new Date(b.preferred_date).toLocaleDateString("en-IN")}</p>
                                {b.preferred_time && <p className="text-[10px] text-muted-foreground">{b.preferred_time}</p>}
                              </div>
                            )}
                          </div>

                          <div className="mt-2 p-2 bg-white rounded-lg border text-xs">
                            <p className="text-muted-foreground mb-0.5">Problem</p>
                            <p className="font-medium line-clamp-2">{b.problem_description}</p>
                          </div>

                          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> {ageLabel}
                              {b.is_urgent && <Badge className="ml-2 bg-red-100 text-red-600 border-red-200 text-[9px]">URGENT</Badge>}
                            </div>
                            {/* Action Buttons */}
                            <div className="flex gap-1.5 flex-wrap">
                              {b.status === "pending" && (
                                <>
                                  <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={async () => { await updateStatus(b.id, "accepted"); notifyAccepted(b); }}>
                                    <Check className="h-3 w-3 mr-1" /> Accept
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => { setRejectBooking(b); setRejectReason(""); setRejectOpen(true); }}>
                                    <X className="h-3 w-3 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {b.status === "accepted" && (
                                <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={() => updateStatus(b.id, "in_progress")}>
                                  <Wrench className="h-3 w-3 mr-1" /> Mark In Progress
                                </Button>
                              )}
                              {b.status === "in_progress" && (
                                <Button size="sm" className="h-7 text-xs bg-teal-600 hover:bg-teal-700" onClick={() => { updateStatus(b.id, "ready"); notifyReady(b); }}>
                                  <PackageCheck className="h-3 w-3 mr-1" /> Mark Ready
                                </Button>
                              )}
                              {b.status === "ready" && (
                                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus(b.id, "completed")}>
                                  <Check className="h-3 w-3 mr-1" /> Mark Delivered
                                </Button>
                              )}
                              {(b.status === "pending" || b.status === "accepted" || b.status === "in_progress") && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setConvertBooking(b); setConvertForm({ technician_name: "", estimated_cost: "" }); setConvertOpen(true); }}>
                                  <Wrench className="h-3 w-3 mr-1" /> → Job
                                </Button>
                              )}
                              {b.status === "converted" && b.converted_job_id && (
                                <Button size="sm" variant="outline" className="h-7 text-xs text-purple-600" onClick={() => navigate(`/jobs?search=${b.converted_job_id}`)}>
                                  View Job: {b.converted_job_id}
                                </Button>
                              )}
                              {b.status === "completed" && (
                                <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600" onClick={() => updateStatus(b.id, "accepted")}>
                                  <RotateCcw className="h-3 w-3 mr-1" /> Reopen
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600" onClick={() => sendWhatsApp(b, `Hello ${b.customer_name}, regarding your ${b.device_brand} repair request.`)}>
                                <MessageCircle className="h-3 w-3 mr-1" /> WA
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Booking</DialogTitle></DialogHeader>
          {rejectBooking && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-bold">{rejectBooking.customer_name}</p>
                <p className="text-muted-foreground">{rejectBooking.device_brand} — {rejectBooking.problem_description}</p>
              </div>
              <div>
                <Label>Reason for rejection (optional)</Label>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Parts not available, Fully booked..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              await updateStatus(rejectBooking.id, "rejected");
              notifyRejected(rejectBooking, rejectReason);
              setRejectOpen(false);
            }}>
              <X className="h-3 w-3 mr-1" /> Reject & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Job Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convert to Repair Job</DialogTitle></DialogHeader>
          {convertBooking && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-bold">{convertBooking.customer_name} · {convertBooking.customer_mobile}</p>
                <p className="text-muted-foreground">{convertBooking.device_brand} {convertBooking.device_model}</p>
                <p className="mt-1">{convertBooking.problem_description}</p>
              </div>
              <div>
                <Label>Assign Technician (optional)</Label>
                <Input value={convertForm.technician_name} onChange={(e) => setConvertForm({ ...convertForm, technician_name: e.target.value })} placeholder="Technician name" disabled={isSubmitting} />
              </div>
              <div>
                <Label>Estimated Cost (₹)</Label>
                <Input type="number" value={convertForm.estimated_cost} onChange={(e) => setConvertForm({ ...convertForm, estimated_cost: e.target.value })} placeholder="0" disabled={isSubmitting} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button disabled={isSubmitting} onClick={async () => {
              if (!convertBooking || isSubmitting) return;
              setIsSubmitting(true);
              try {
                const { data, error } = await (supabase as any).rpc("convert_booking_to_job", {
                  _booking_id: convertBooking.id,
                  _technician_name: convertForm.technician_name || null,
                  _estimated_cost: Number(convertForm.estimated_cost) || 0,
                });
                if (error) throw error;
                toast.success(`Job created: ${data}`);
                setConvertOpen(false);
                load();
              } catch (error: any) {
                toast.error(error.message || "Conversion failed");
              } finally { setIsSubmitting(false); }
            }}>
              {isSubmitting ? "Converting..." : "✅ Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
          {detailBooking && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Customer", value: detailBooking.customer_name },
                  { label: "Mobile", value: detailBooking.customer_mobile },
                  { label: "Email", value: detailBooking.customer_email || "—" },
                  { label: "Device Brand", value: detailBooking.device_brand },
                  { label: "Model", value: detailBooking.device_model || "—" },
                  { label: "Device Type", value: detailBooking.device_type || "—" },
                  { label: "Service", value: detailBooking.service_type || "—" },
                  { label: "Preferred Date", value: detailBooking.preferred_date ? `${new Date(detailBooking.preferred_date).toLocaleDateString("en-IN")} ${detailBooking.preferred_time ? `(${detailBooking.preferred_time})` : ""}` : "—" },
                  { label: "Submitted", value: new Date(detailBooking.created_at).toLocaleString("en-IN") },
                  { label: "Status", value: STATUS_CONFIG[detailBooking.status]?.label || detailBooking.status },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{label}</p>
                    <p className="font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Problem Description</p>
                <p className="font-medium">{detailBooking.problem_description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            {detailBooking && <Button onClick={() => sendWhatsApp(detailBooking, `Hello ${detailBooking.customer_name}, regarding your repair booking.`)}><MessageCircle className="h-3 w-3 mr-1" /> WhatsApp</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
