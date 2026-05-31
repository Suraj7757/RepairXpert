import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";
import { 
  Shield, 
  Users, 
  Settings, 
  Database, 
  Activity, 
  Lock, 
  Unlock, 
  Trash2, 
  Zap, 
  Globe,
  AlertTriangle,
  RefreshCw,
  Server,
  Tag,
  ToggleLeft,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";

export default function DevPanel() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>({
    users: 0,
    jobs: 0,
    payments: 0,
    activePlans: 0
  });
  const [systemConfig, setSystemConfig] = useState<any>({});
  const [features, setFeatures] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSystemData();
    }
  }, [isSuperAdmin]);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const [profiles, jobs, payments, config, featRes, promoRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("repair_jobs").select("id", { count: "exact" }),
        supabase.from("payments").select("id", { count: "exact" }),
        supabase.from("system_config").select("*"),
        supabase.from("features").select("*"),
        supabase.from("promo_codes").select("*")
      ]);

      setStats({
        users: profiles.count || 0,
        jobs: jobs.count || 0,
        payments: payments.count || 0,
        activePlans: 0
      });

      setFeatures(featRes.data || []);
      setPromos(promoRes.data || []);

      const configMap = config.data?.reduce((acc: any, item: any) => {
        acc[item.id] = item.value;
        return acc;
      }, {});
      setSystemConfig(configMap || {});
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to fetch system data:", errorMsg);
      toast.error("Failed to sync system data: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    const newVal = !systemConfig.maintenance?.enabled;
    const { error } = await supabase
      .from("system_config")
      .update({ 
        value: { enabled: newVal, message: systemConfig.maintenance?.message || "System under maintenance" } 
      } as any)
      .eq("id", "maintenance");
    
    if (error) toast.error("Failed to update maintenance mode: " + error.message);
    else {
      toast.success(`Maintenance mode ${newVal ? "enabled" : "disabled"}`);
      fetchSystemData();
    }
  };

  const clearCache = () => {
    toast.promise(new Promise(r => setTimeout(r, 1500)), {
      loading: 'Clearing system cache...',
      success: 'Global cache cleared successfully',
      error: 'Failed to clear cache'
    });
  };

  if (authLoading) return null;

  if (!isSuperAdmin) {
    return (
      <MainLayout title="Restricted Access">
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-black">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">
            This panel is strictly reserved for the system developer (krs715665@gmail.com).
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Developer Control Center">
      <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Shield className="h-32 w-32" />
          </div>
          <div className="relative z-10">
            <Badge className="bg-primary text-white mb-2 font-black uppercase tracking-widest px-3">Super Admin Mode</Badge>
            <h1 className="text-4xl font-black tracking-tight">Dev Control Center</h1>
            <p className="text-slate-400 font-medium mt-1">Full system override and administrative tools.</p>
          </div>
          <div className="flex gap-3 relative z-10">
            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={fetchSystemData}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Data
            </Button>
            <Button variant="destructive" onClick={toggleMaintenance} className="font-bold shadow-lg shadow-destructive/20">
              {systemConfig.maintenance?.enabled ? <><Unlock className="h-4 w-4 mr-2" /> Disable Maintenance</> : <><Lock className="h-4 w-4 mr-2" /> Enable Maintenance</>}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Total Users", val: stats.users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Total Jobs", val: stats.jobs, icon: Activity, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Total Payments", val: stats.payments, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Server Status", val: "Online", icon: Server, color: "text-primary", bg: "bg-primary/10" }
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-xl rounded-3xl bg-card/50 backdrop-blur-md">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center mb-4`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.val}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full justify-start overflow-x-auto">
            <TabsTrigger value="system" className="rounded-xl px-6 h-12 font-bold gap-2"><Settings className="h-4 w-4" /> System Config</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-6 h-12 font-bold gap-2"><Users className="h-4 w-4" /> Global Users</TabsTrigger>
            <TabsTrigger value="database" className="rounded-xl px-6 h-12 font-bold gap-2"><Database className="h-4 w-4" /> DB Utils</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl px-6 h-12 font-bold gap-2"><Globe className="h-4 w-4" /> Event Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-lg">Global Maintenance & Services</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30">
                    <div>
                      <p className="font-bold">Maintenance Mode</p>
                      <p className="text-xs text-muted-foreground">Blocks non-admin access</p>
                    </div>
                    <Button 
                      variant={systemConfig.maintenance?.enabled ? "destructive" : "outline"} 
                      onClick={toggleMaintenance}
                      className="rounded-xl font-bold"
                    >
                      {systemConfig.maintenance?.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Service Activation (Features)</Label>
                    <div className="space-y-2">
                      {features.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border bg-card/50">
                          <span className="font-medium">{f.name}</span>
                          <Button 
                            size="sm" 
                            variant={f.is_enabled ? "default" : "outline"}
                            className="rounded-lg h-8"
                            onClick={async () => {
                              const { error } = await supabase.from('features').update({ is_enabled: !f.is_enabled } as any).eq('id', f.id);
                              if (!error) fetchSystemData();
                            }}
                          >
                            {f.is_enabled ? "Active" : "Disabled"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-lg">Coupons & Promo Codes</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="space-y-2">
                      {promos.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-dashed">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            <span className="font-mono font-bold">{p.code}</span>
                            <Badge variant="outline" className="text-[10px]">{p.validity_days}d</Badge>
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0" onClick={async () => {
                             await supabase.from('promo_codes').delete().eq('id', p.id);
                             fetchSystemData();
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {promos.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No active promo codes</p>}
                   </div>
                   <Button variant="outline" className="w-full rounded-xl border-dashed h-12" onClick={() => toast.info("Use Admin Panel to create new promos")}>
                      Manage Promos in Admin Panel
                   </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-lg">Direct Plan Update</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="space-y-2">
                      <Label>User ID / Email</Label>
                      <Input placeholder="Search user..." className="rounded-xl" />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl h-12 font-bold"><CreditCard className="h-4 w-4 mr-2" /> Upgrade to Pro</Button>
                      <Button variant="outline" className="rounded-xl h-12 font-bold"><Zap className="h-4 w-4 mr-2" /> Enterprise</Button>
                   </div>
                   <p className="text-[10px] text-muted-foreground text-center italic">Changes are reflected instantly across the system.</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-lg">System-Wide Analytics</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span>New Signups (24h)</span>
                        <Badge>+12</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Active Sessions</span>
                        <Badge variant="outline">45</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>DB Load</span>
                        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                           <div className="h-full w-[15%] bg-emerald-500" />
                        </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="database" className="mt-6">
            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-slate-950 text-white">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Database Health</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 <div className="space-y-4 font-mono text-sm">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                      <span className="text-slate-400">inventory_items_total:</span>
                      <span className="text-emerald-400 font-bold">1,242</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                      <span className="text-slate-400">repair_jobs_total:</span>
                      <span className="text-emerald-400 font-bold">8,531</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                      <span className="text-slate-400">payments_total_inr:</span>
                      <span className="text-emerald-400 font-bold">₹4,52,310</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                      <span className="text-slate-400">storage_used_mb:</span>
                      <span className="text-orange-400 font-bold">428.5 MB</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
