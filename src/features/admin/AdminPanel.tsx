import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";
import {
  Users,
  Wallet,
  Gift,
  Monitor,
  Shield,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  Tag,
  IndianRupee,
  Eye,
  Image,
  BarChart3,
  TrendingUp,
  Smartphone,
  Settings,
  Download,
  Megaphone,
  AlertTriangle,
  Ban,
  RotateCcw,
  ToggleLeft,
  Store,
} from "lucide-react";
import AdminRefunds from "./AdminRefunds";
import BroadcastMessage from "./BroadcastMessage";
import { toast } from "sonner";
import { SUPER_ADMIN_EMAIL } from "@/lib/accountType";

export default function AdminPanel() {
  const { user, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [paymentSubs, setPaymentSubs] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [shopApplications, setShopApplications] = useState<any[]>([]);
  const [appFilter, setAppFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Ad dialog
  const [adOpen, setAdOpen] = useState(false);
  const [adTitle, setAdTitle] = useState("");
  const [adDesc, setAdDesc] = useState("");
  const [adReward, setAdReward] = useState("0.5");
  const [adLimit, setAdLimit] = useState("10");
  const [adLink, setAdLink] = useState("");

  // Promo dialog
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoValidity, setPromoValidity] = useState("7");
  const [promoLimit, setPromoLimit] = useState("1");
  const [promoExpiry, setPromoExpiry] = useState("");

  // User edit dialog
  const [editUser, setEditUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("staff");

  // Screenshot preview
  const [previewUrl, setPreviewUrl] = useState("");

  // System actions
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [maintenance, setMaintenance] = useState(false);

  // Edit User details
  const [editPlan, setEditPlan] = useState("free");
  const [editPlanExpiry, setEditPlanExpiry] = useState("");

  const isAdmin = isSuperAdmin;

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const [
      profilesRes,
      walletsRes,
      withdrawRes,
      referralsRes,
      adsRes,
      subsRes,
      paySubsRes,
      promoRes,
      jobsRes,
      paymentsRes,
      configRes,
      featuresRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }) as any,
      supabase.from("wallets").select("*") as any,
      supabase
        .from("withdraw_requests")
        .select("*")
        .order("created_at", { ascending: false }) as any,
      supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false }) as any,
      supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false }) as any,
      supabase.from("subscriptions").select("*") as any,
      supabase
        .from("payment_submissions")
        .select("*")
        .order("created_at", { ascending: false }) as any,
      supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false }) as any,
      supabase.from("repair_jobs").select("*") as any,
      supabase.from("payments").select("*") as any,
      supabase
        .from("system_config")
        .select("*")
        .eq("id", "maintenance")
        .maybeSingle() as any,
      supabase.from("features").select("*").order("name") as any,
    ]);
    setUsers(profilesRes.data || []);
    setWallets(walletsRes.data || []);
    setWithdrawals(withdrawRes.data || []);
    setReferrals(referralsRes.data || []);
    setAds(adsRes.data || []);
    setSubscriptions(subsRes.data || []);
    setPaymentSubs(paySubsRes.data || []);
    setPromoCodes(promoRes.data || []);
    setAllJobs(jobsRes.data || []);
    setAllPayments(paymentsRes.data || []);
    if (configRes.data) {
      setMaintenance(configRes.data.value?.enabled || false);
    }
    setFeatures(featuresRes.data || []);
    // Load shop applications
    const { data: appsData } = await (supabase as any).from("shopkeeper_applications").select("*").order("created_at", { ascending: false });
    setShopApplications(appsData || []);
    setLoading(false);
  };

  const getWallet = (userId: string) =>
    wallets.find((w) => w.user_id === userId);
  const getSub = (userId: string) =>
    subscriptions.find((s) => s.user_id === userId);

  const handleWithdrawal = async (id: string, status: string) => {
    const { error } = await supabase
      .from("withdraw_requests")
      .update({ status, processed_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) toast.error("Update failed");
    else {
      toast.success(`Withdrawal ${status}`);
      fetchAll();
    }
  };

  const handlePaymentApproval = async (sub: any, status: string) => {
    await supabase
      .from("payment_submissions")
      .update({ status, processed_at: new Date().toISOString() } as any)
      .eq("id", sub.id);
    if (status === "approved") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          plan: sub.plan,
          expires_at: expiresAt.toISOString(),
        } as any)
        .eq("user_id", sub.user_id);
    }
    toast.success(`Payment ${status}`);
    fetchAll();
  };

  const handleCreateAd = async () => {
    if (!adTitle || !user) return;
    const { error } = await supabase.from("ads").insert({
      title: adTitle,
      description: adDesc,
      reward_amount: parseFloat(adReward) || 0.5,
      daily_limit: parseInt(adLimit) || 10,
      link_url: adLink,
      created_by: user.id,
    } as any);
    if (error) toast.error("Failed to create ad");
    else {
      toast.success("Ad created");
      setAdOpen(false);
      setAdTitle("");
      setAdDesc("");
      fetchAll();
    }
  };

  const handleCreatePromo = async () => {
    if (!promoCode || !user) return;
    const { error } = await supabase.from("promo_codes").insert({
      code: promoCode.toUpperCase(),
      validity_days: parseInt(promoValidity) || 7,
      usage_limit: parseInt(promoLimit) || 1,
      created_by: user.id,
      expiry_date: promoExpiry ? new Date(promoExpiry).toISOString() : null,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Promo code created");
      setPromoOpen(false);
      setPromoCode("");
      fetchAll();
    }
  };

  const toggleAd = async (id: string, active: boolean) => {
    await supabase
      .from("ads")
      .update({ active: !active } as any)
      .eq("id", id);
    fetchAll();
  };

  const toggleFeature = async (id: string, isEnabled: boolean) => {
    await supabase
      .from("features")
      .update({ is_enabled: !isEnabled } as any)
      .eq("id", id);
    toast.success("Feature toggled successfully");
    fetchAll();
  };

  const deleteAd = async (id: string) => {
    await supabase.from("ads").delete().eq("id", id);
    fetchAll();
  };

  const deletePromo = async (id: string) => {
    await supabase.from("promo_codes").delete().eq("id", id);
    toast.success("Promo deleted");
    fetchAll();
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    await supabase
      .from("profiles")
      .update({
        display_name: editName,
        plan_type: editPlan,
        plan_expires_at: editPlanExpiry
          ? new Date(editPlanExpiry).toISOString()
          : null,
      } as any)
      .eq("user_id", editUser.user_id);
    await supabase
      .from("user_roles")
      .update({ role: editRole } as any)
      .eq("user_id", editUser.user_id);

    // Also update subscriptions table to keep it backwards compatible
    await supabase.from("subscriptions").upsert({
      user_id: editUser.user_id,
      plan: editPlan,
      status: editPlanExpiry
        ? new Date(editPlanExpiry) > new Date()
          ? "active"
          : "expired"
        : "active",
      expires_at: editPlanExpiry
        ? new Date(editPlanExpiry).toISOString()
        : null,
    } as any);

    toast.success("User updated");
    setEditUser(null);
    fetchAll();
  };

  const toggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    // If RPC doesn't exist, we fallback to updating profiles directly
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: !currentBanStatus } as any)
      .eq("user_id", userId);
    if (error) toast.error("Failed to update ban status");
    else {
      toast.success(
        currentBanStatus
          ? "User unbanned successfully"
          : "User banned successfully",
      );
      fetchAll();
    }
  };

  const [userDetail, setUserDetail] = useState<any>(null);
  const showUserDetail = (u: any) => {
    const userJobs = allJobs.filter((j) => j.user_id === u.user_id);
    const userPayments = allPayments.filter((p) => p.user_id === u.user_id);
    const totalRevenue = userPayments.reduce(
      (s, p) => s + (Number(p.amount) || 0),
      0,
    );
    const totalProfit = userPayments.reduce(
      (s, p) => s + (Number(p.admin_share) || 0),
      0,
    ); // Assuming admin share is shop profit

    setUserDetail({
      ...u,
      jobCount: userJobs.length,
      sellCount: userPayments.filter((p) => !p.repair_job_id).length,
      totalRevenue,
      totalProfit,
      wallet: getWallet(u.user_id),
      sub: getSub(u.user_id),
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.referral_code?.toLowerCase().includes(search.toLowerCase()),
  );

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast.error("No data to export");
      return;
    }
    const keys = Object.keys(data[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      keys.join(",") +
      "\n" +
      data
        .map((row) =>
          keys
            .map((k) => `"${(row[k] || "").toString().replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filename}.csv`);
  };

  const handleBroadcast = () => {
    if (!broadcastMsg) return;
    toast.success("Global broadcast sent to all users!");
    setBroadcastMsg("");
  };

  if (!isSuperAdmin) {
    return (
      <MainLayout title="Admin Panel">
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground mt-2">
              Only the main super-admin can access this panel.
            </p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (loading)
    return (
      <MainLayout title="Admin Panel">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black">Admin Management</h1>
          {isSuperAdmin && (
             <Button variant="outline" className="gap-2 border-2" onClick={() => window.location.href='/dev-panel'}>
                <Shield className="h-4 w-4" /> Dev Control
             </Button>
          )}
        </div>
        <p className="text-center p-8 text-muted-foreground">Loading...</p>
      </MainLayout>
    );

  return (
    <MainLayout title="Admin Panel">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black">Admin Management</h1>
          {isSuperAdmin && (
             <Button variant="outline" className="gap-2 border-2" onClick={() => window.location.href='/dev-panel'}>
                <Shield className="h-4 w-4" /> Dev Control
             </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Users, label: "Total Users", value: users.length, color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20" },
            { icon: Store, label: "Active Shops", value: users.filter((u: any) => u.account_type === "shopkeeper").length, color: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-500/20" },
            { icon: IndianRupee, label: "Pending Payments", value: paymentSubs.filter((p) => p.status === "pending").length, color: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/20" },
            { icon: TrendingUp, label: "Total Revenue", value: `₹${allPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString()}`, color: "from-green-400 to-emerald-600", shadow: "shadow-green-500/20" },
            { icon: Gift, label: "Referrals", value: referrals.length, color: "from-purple-400 to-violet-600", shadow: "shadow-purple-500/20" },
            { icon: Tag, label: "Promo Codes", value: promoCodes.length, color: "from-cyan-400 to-blue-500", shadow: "shadow-cyan-500/20" },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative ring-1 ring-white/20 dark:ring-white/10">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full group-hover:scale-150 transition-transform duration-500`} />
              <CardContent className="p-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-xl font-black tracking-tight text-foreground">{stat.value}</p>
                  </div>
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${stat.color} ${stat.shadow} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="grid grid-cols-4 md:grid-cols-9 w-full">
            <TabsTrigger value="applications" className="flex items-center gap-1 relative">
              <Store className="h-3 w-3" /> Shop Apps
              {shopApplications.filter((a) => a.status === "pending").length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-black">
                  {shopApplications.filter((a) => a.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payments">Sub Payments</TabsTrigger>
            <TabsTrigger value="promos">Promos</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              Refunds
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex items-center gap-1">
              <Megaphone className="h-3 w-3" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-1">
              <ToggleLeft className="h-3 w-3" />
              Features
            </TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Shop Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold">Shopkeeper Applications</h3>
                <p className="text-sm text-muted-foreground">Review and approve shop registrations</p>
              </div>
              <div className="flex gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                  <button key={f} onClick={() => setAppFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${
                      appFilter === f ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-transparent hover:border-border"
                    }`}>
                    {f} ({f === "all" ? shopApplications.length : shopApplications.filter((a) => a.status === f).length})
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {shopApplications
                .filter((a) => appFilter === "all" || a.status === appFilter)
                .map((app) => {
                  const profile = users.find((u: any) => u.user_id === app.user_id);
                  return (
                    <Card key={app.id} className={`shadow-sm ${
                      app.status === "pending" ? "border-amber-200 bg-amber-50/30" :
                      app.status === "approved" ? "border-emerald-200 bg-emerald-50/30" :
                      "border-rose-200 bg-rose-50/30"
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-bold text-base">{app.shop_name}</p>
                            <p className="text-sm text-muted-foreground">{app.owner_name} · {app.phone}</p>
                            <p className="text-xs text-muted-foreground">{app.city}{app.state ? `, ${app.state}` : ""} · {app.business_type}</p>
                            {app.email && <p className="text-xs text-blue-600">{app.email}</p>}
                            {profile && <p className="text-xs text-muted-foreground mt-1">Account: {profile.display_name}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={app.status === "pending" ? "secondary" : app.status === "approved" ? "default" : "destructive"}>
                              {app.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>
                        {app.address && <p className="text-xs text-muted-foreground mt-2">📍 {app.address}</p>}
                        {app.gst_number && <p className="text-xs text-muted-foreground">GST: {app.gst_number}</p>}
                        {app.rejection_reason && (
                          <p className="text-xs text-rose-600 mt-1">Reason: {app.rejection_reason}</p>
                        )}
                        {app.status === "pending" && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                              onClick={async () => {
                                const { error } = await (supabase as any).rpc("approve_shopkeeper_application", {
                                  _app_id: app.id,
                                  _approve: true,
                                  _reason: "",
                                });
                                if (error) { toast.error(error.message); return; }
                                toast.success(`${app.shop_name} approved — CRM unlocked!`);
                                fetchAll();
                              }}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 text-xs"
                              onClick={async () => {
                                const reason = prompt("Rejection reason (optional):") || "";
                                const { error } = await (supabase as any).rpc("approve_shopkeeper_application", {
                                  _app_id: app.id,
                                  _approve: false,
                                  _reason: reason,
                                });
                                if (error) { toast.error(error.message); return; }
                                toast.success("Application rejected");
                                fetchAll();
                              }}>
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              {shopApplications.filter((a) => appFilter === "all" || a.status === appFilter).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Store className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No {appFilter === "all" ? "" : appFilter} applications</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Deep Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                Deep CRM Analytics
              </h3>
              <Badge
                variant="outline"
                className="text-primary border-primary bg-primary/5"
              >
                System-Wide Data
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/10 shadow-sm bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        Total Repair Jobs
                      </p>
                      <p className="text-4xl font-black text-foreground">
                        {allJobs.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/10 shadow-sm bg-green-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-500 text-white flex items-center justify-center">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        Total Shop Revenue
                      </p>
                      <p className="text-4xl font-black text-foreground">
                        ₹
                        {allPayments
                          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/10 shadow-sm bg-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        Completed Jobs
                      </p>
                      <p className="text-4xl font-black text-foreground">
                        {allJobs.filter((j) => j.status === "Delivered").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">
                  Recent System Activity (Last 5 Jobs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Est. Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allJobs.slice(0, 5).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-bold">
                          {job.job_id}
                        </TableCell>
                        <TableCell>
                          {job.device_brand} {job.device_model}
                        </TableCell>
                        <TableCell>{job.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.status}</Badge>
                        </TableCell>
                        <TableCell>₹{job.estimated_cost}</TableCell>
                      </TableRow>
                    ))}
                    {allJobs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No jobs yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Verification Tab */}
          <TabsContent value="payments" className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              UPI Payment Verification
            </h3>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>UTR</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentSubs.map((p) => {
                    const profile = users.find((u) => u.user_id === p.user_id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {profile?.display_name || "Unknown"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.utr_number}
                        </TableCell>
                        <TableCell className="font-bold">₹{p.amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          {p.screenshot_url ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                const val = p.screenshot_url as string;
                                if (val.startsWith("http")) {
                                  setPreviewUrl(val);
                                  return;
                                }
                                const { data, error } = await supabase.storage
                                  .from("payment-screenshots")
                                  .createSignedUrl(val, 300);
                                if (error || !data) {
                                  toast.error("Cannot load screenshot");
                                  return;
                                }
                                setPreviewUrl(data.signedUrl);
                              }}
                            >
                              <Image className="h-4 w-4" />
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "approved"
                                ? "default"
                                : p.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-1">
                          {p.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handlePaymentApproval(p, "approved")
                                }
                              >
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handlePaymentApproval(p, "rejected")
                                }
                              >
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paymentSubs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No payment submissions
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const w = getWallet(u.user_id);
                    const sub = getSub(u.user_id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.display_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {u.referral_code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ₹{Number(w?.balance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge>{u.plan_type || sub?.plan || "free"}</Badge>
                        </TableCell>
                        <TableCell>
                          {u.is_banned ? (
                            <Badge variant="destructive">
                              <Ban className="h-3 w-3 mr-1" /> Banned
                            </Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => showUserDetail(u)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditUser(u);
                                setEditName(u.display_name);
                                setEditPlan(u.plan_type || sub?.plan || "free");
                                setEditPlanExpiry(
                                  u.plan_expires_at
                                    ? new Date(u.plan_expires_at)
                                        .toISOString()
                                        .split("T")[0]
                                    : sub?.expires_at
                                      ? new Date(sub.expires_at)
                                          .toISOString()
                                          .split("T")[0]
                                      : "",
                                );
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant={u.is_banned ? "default" : "destructive"}
                              onClick={() =>
                                toggleUserBan(u.user_id, !!u.is_banned)
                              }
                            >
                              {u.is_banned ? "Unban" : "Ban"}
                            </Button>
                            {isSuperAdmin && u.email !== SUPER_ADMIN_EMAIL && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to PERMANENTLY delete this user? This cannot be undone.")) return;
                                  const { error } = await supabase.from('profiles').delete().eq('user_id', u.user_id);
                                  if (error) toast.error("Delete failed: " + error.message);
                                  else {
                                    toast.success("User permanently deleted");
                                    fetchAll();
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promos" className="space-y-4">
            <Button onClick={() => setPromoOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Promo Code
            </Button>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((pc) => (
                    <TableRow key={pc.id}>
                      <TableCell className="font-mono font-bold">
                        {pc.code}
                      </TableCell>
                      <TableCell>{pc.validity_days} days</TableCell>
                      <TableCell>
                        {pc.used_count}/{pc.usage_limit}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pc.expiry_date
                          ? new Date(pc.expiry_date).toLocaleDateString()
                          : "No expiry"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={pc.active ? "default" : "secondary"}>
                          {pc.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePromo(pc.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {promoCodes.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No promo codes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            <Button onClick={() => setAdOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Ad
            </Button>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>
                        ₹{Number(ad.reward_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{ad.daily_limit}/day</TableCell>
                      <TableCell>{ad.impressions}</TableCell>
                      <TableCell>
                        <Badge variant={ad.active ? "default" : "secondary"}>
                          {ad.active ? "Active" : "Paused"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAd(ad.id, ad.active)}
                        >
                          {ad.active ? "Pause" : "Resume"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAd(ad.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ads.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No ads
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => {
                    const profile = users.find((u) => u.user_id === w.user_id);
                    return (
                      <TableRow key={w.id}>
                        <TableCell>
                          {profile?.display_name || "Unknown"}
                        </TableCell>
                        <TableCell className="font-bold">
                          ₹{Number(w.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              w.status === "approved"
                                ? "default"
                                : w.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(w.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="flex gap-1">
                          {w.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleWithdrawal(w.id, "approved")
                                }
                              >
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleWithdrawal(w.id, "rejected")
                                }
                              >
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {withdrawals.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        No withdrawal requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds">
            <AdminRefunds />
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast">
            <BroadcastMessage />
          </TabsContent>

          {/* Features Toggle Tab */}
          <TabsContent value="features" className="space-y-4">
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-bold">{f.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {f.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.is_enabled ? "default" : "secondary"}>
                          {f.is_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={f.is_enabled ? "outline" : "default"}
                          onClick={() => toggleFeature(f.id, f.is_enabled)}
                        >
                          {f.is_enabled ? "Disable" : "Enable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {features.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        No features found in database.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* System Tab */}

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" /> Data Export
                    (CSV)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Download system data for offline analysis and backup.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => exportCSV(users, "users_export")}
                    >
                      <Download className="h-4 w-4 mr-2" /> Export Users
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportCSV(allJobs, "jobs_export")}
                    >
                      <Download className="h-4 w-4 mr-2" /> Export All Jobs
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportCSV(paymentSubs, "payments_export")}
                    >
                      <Download className="h-4 w-4 mr-2" /> Export Sub Payments
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportCSV(wallets, "wallets_export")}
                    >
                      <Download className="h-4 w-4 mr-2" /> Export Wallets
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-amber-500" /> Global
                    Broadcast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Send an urgent notification or update to all users in the
                    CRM.
                  </p>
                  <Input
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Type broadcast message..."
                  />
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handleBroadcast}
                  >
                    Send Broadcast
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card border-destructive/20 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" /> Danger Zone & Config
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between p-6 bg-destructive/5 rounded-xl border border-destructive/10">
                  <div>
                    <h4 className="font-bold text-destructive">
                      Maintenance Mode
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Temporarily block all users from logging in (except Super
                      Admin).
                    </p>
                  </div>
                  <Button
                    variant={maintenance ? "destructive" : "outline"}
                    onClick={async () => {
                      const newStatus = !maintenance;
                      await supabase.from("system_config").upsert({
                        id: "maintenance",
                        value: { enabled: newStatus },
                      });
                      setMaintenance(newStatus);
                      toast(
                        newStatus
                          ? "Maintenance Mode Enabled"
                          : "Maintenance Mode Disabled",
                        {
                          description: newStatus
                            ? "Non-admins are now blocked."
                            : "All users can now login.",
                        },
                      );
                    }}
                  >
                    {maintenance ? "Disable Maintenance" : "Enable Maintenance"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Ad Dialog */}
        <Dialog open={adOpen} onOpenChange={setAdOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ad</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={adDesc}
                  onChange={(e) => setAdDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Reward (₹)</Label>
                  <Input
                    type="number"
                    value={adReward}
                    onChange={(e) => setAdReward(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Daily Limit</Label>
                  <Input
                    type="number"
                    value={adLimit}
                    onChange={(e) => setAdLimit(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateAd}>Create Ad</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Promo Dialog */}
        <Dialog open={promoOpen} onOpenChange={setPromoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Promo Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Code</Label>
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE50"
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Validity (days)</Label>
                  <Input
                    type="number"
                    value={promoValidity}
                    onChange={(e) => setPromoValidity(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Usage Limit</Label>
                  <Input
                    type="number"
                    value={promoLimit}
                    onChange={(e) => setPromoLimit(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Expiry Date (optional)</Label>
                <Input
                  type="date"
                  value={promoExpiry}
                  onChange={(e) => setPromoExpiry(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreatePromo}>Create Promo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit User — Super Admin Controls</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold">{editUser?.display_name}</span>{" "}
                · {editUser?.account_type || "shopkeeper"}
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Shopkeeper)</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="shopkeeper">Shopkeeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2 border-t mt-2">
                <Label className="text-primary font-bold">Plan Details</Label>
              </div>
              <div>
                <Label>Plan Type</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Trial</SelectItem>
                    <SelectItem value="pro">Pro Plan</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan Expiry Date</Label>
                <Input
                  type="date"
                  value={editPlanExpiry}
                  onChange={(e) => setEditPlanExpiry(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t mt-2">
                <Label className="text-primary font-bold">
                  Wallet Adjustment
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Amount (+/-)"
                  id="walletDelta"
                />
                <Input placeholder="Note" id="walletNote" />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const delta = parseFloat(
                    (document.getElementById("walletDelta") as HTMLInputElement)
                      ?.value || "0",
                  );
                  const note =
                    (document.getElementById("walletNote") as HTMLInputElement)
                      ?.value || "Admin adjustment";
                  if (!delta || !editUser) return;
                  const { error } = await (supabase as any).rpc(
                    "admin_adjust_wallet",
                    { _user_id: editUser.user_id, _delta: delta, _note: note },
                  );
                  if (error) toast.error(error.message);
                  else {
                    toast.success("Wallet updated");
                    fetchAll();
                  }
                }}
              >
                Apply Wallet Change
              </Button>

              <div className="pt-2 border-t mt-2">
                <Label className="text-primary font-bold">
                  Custom Discount
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Percent (e.g. 20)"
                  id="discPct"
                />
                <Input placeholder="Reason" id="discReason" />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const pct = parseFloat(
                    (document.getElementById("discPct") as HTMLInputElement)
                      ?.value || "0",
                  );
                  const reason =
                    (document.getElementById("discReason") as HTMLInputElement)
                      ?.value || "Admin grant";
                  if (!pct || !editUser) return;
                  const { error } = await (supabase as any).rpc(
                    "admin_apply_discount",
                    {
                      _user_id: editUser.user_id,
                      _percent: pct,
                      _reason: reason,
                    },
                  );
                  if (error) toast.error(error.message);
                  else toast.success("Discount applied");
                }}
              >
                Grant Discount
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Screenshot Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl("")}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Payment Screenshot</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Payment screenshot"
                className="w-full rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* User Detail Dialog */}
        <Dialog open={!!userDetail} onOpenChange={() => setUserDetail(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> User Statistics &
                Details
              </DialogTitle>
            </DialogHeader>
            {userDetail && (
              <div className="grid gap-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-xl font-bold">
                      {userDetail.display_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userDetail.referral_code || "No Referral"}
                    </p>
                  </div>
                  <Badge className="text-lg px-4 py-1">
                    {userDetail.plan_type || userDetail.sub?.plan || "free"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Total Jobs
                    </p>
                    <p className="text-2xl font-black">{userDetail.jobCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Total Sells
                    </p>
                    <p className="text-2xl font-black">
                      {userDetail.sellCount}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-black text-green-600">
                      ₹{userDetail.totalRevenue}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Total Profit
                    </p>
                    <p className="text-2xl font-black text-primary">
                      ₹{userDetail.totalProfit}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Wallet Balance:
                    </span>
                    <span className="font-bold">
                      ₹{Number(userDetail.wallet?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan Expiry:</span>
                    <span className="font-bold">
                      {userDetail.plan_expires_at
                        ? new Date(
                            userDetail.plan_expires_at,
                          ).toLocaleDateString()
                        : userDetail.sub?.expires_at
                          ? new Date(
                              userDetail.sub.expires_at,
                            ).toLocaleDateString()
                          : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Account Status:
                    </span>
                    <Badge
                      variant={userDetail.is_banned ? "destructive" : "default"}
                    >
                      {userDetail.is_banned ? "Suspended" : "Active"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setUserDetail(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
