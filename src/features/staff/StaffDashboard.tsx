import { useMemo, useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";
import {
  Wrench,
  IndianRupee,
  Clock,
  LogIn,
  LogOut,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  Calendar,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

export default function StaffDashboard() {
  const { user, shopId } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !shopId) return;
    setLoading(true);

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const [jobsRes, earningsRes, attendanceRes] = await Promise.all([
      (supabase as any)
        .from("repair_jobs")
        .select("*")
        .eq("user_id", shopId)
        .eq("deleted", false)
        .order("created_at", { ascending: false })
        .limit(50),
      (supabase as any)
        .from("staff_earnings")
        .select("*")
        .eq("staff_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      (supabase as any)
        .from("staff_attendance")
        .select("*")
        .eq("staff_user_id", user.id)
        .gte("check_in", startOfDay)
        .order("check_in", { ascending: false }),
    ]);

    setJobs(jobsRes.data || []);
    setEarnings(earningsRes.data || []);
    setTodayAttendance(attendanceRes.data || []);

    // Current active session (checked in but not out)
    const activeSession = (attendanceRes.data || []).find((a: any) => !a.check_out);
    setAttendance(activeSession || null);

    setLoading(false);
  }, [user, shopId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    if (!user || !shopId) return;
    setCheckingIn(true);

    let lat: number | undefined;
    let lng: number | undefined;

    // Try to get location
    try {
      if ("geolocation" in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
    } catch {
      // Location not available, proceed without
    }

    const { error } = await (supabase as any)
      .from("staff_attendance")
      .insert({
        staff_user_id: user.id,
        shop_user_id: shopId,
        check_in: new Date().toISOString(),
        location_lat: lat,
        location_lng: lng,
      });

    if (error) {
      toast.error("Check-in failed: " + error.message);
    } else {
      toast.success("✅ Checked in successfully!");
      fetchData();
    }
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    if (!attendance) return;
    setCheckingIn(true);

    const { error } = await (supabase as any)
      .from("staff_attendance")
      .update({ check_out: new Date().toISOString() })
      .eq("id", attendance.id);

    if (error) {
      toast.error("Check-out failed: " + error.message);
    } else {
      toast.success("👋 Checked out successfully!");
      fetchData();
    }
    setCheckingIn(false);
  };

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status !== "Delivered").length;
    const completedToday = jobs.filter((j) => {
      const d = new Date(j.updated_at || j.created_at);
      const today = new Date();
      return j.status === "Delivered" && d.toDateString() === today.toDateString();
    }).length;
    const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount || 0), 0);
    const unpaidEarnings = earnings.filter((e) => !e.paid).reduce((s, e) => s + Number(e.amount || 0), 0);
    const thisMonthEarnings = earnings
      .filter((e) => {
        const d = new Date(e.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    return { activeJobs, completedToday, totalEarnings, unpaidEarnings, thisMonthEarnings };
  }, [jobs, earnings]);

  const statusData = useMemo(() => [
    { name: "Received", count: jobs.filter((j) => j.status === "Received").length },
    { name: "In Progress", count: jobs.filter((j) => j.status === "In Progress").length },
    { name: "Ready", count: jobs.filter((j) => j.status === "Ready").length },
    { name: "Delivered", count: jobs.filter((j) => j.status === "Delivered").length },
  ], [jobs]);

  const recentJobs = useMemo(() => {
    return jobs
      .filter((j) => j.status !== "Delivered")
      .slice(0, 6);
  }, [jobs]);

  if (loading) {
    return (
      <MainLayout title="Staff Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Staff Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome & Check-in */}
        <Card className="border-0 shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 blur-3xl rounded-full group-hover:scale-110 transition-transform duration-700" />
          </div>
          <CardContent className="py-8 px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <p className="text-xs md:text-sm font-bold text-white/80 uppercase tracking-[0.2em]">
                Welcome Back
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                {user?.user_metadata?.display_name || "Staff Member"}
              </h2>
              <div className="flex items-center gap-3 mt-3">
                {attendance ? (
                  <Badge className="bg-green-400/20 text-green-100 border-green-400/30 text-xs py-1 px-3">
                    <Clock className="h-3 w-3 mr-1" />
                    Checked in since {new Date(attendance.check_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                ) : (
                  <Badge className="bg-white/20 text-white/80 border-white/30 text-xs py-1 px-3">
                    Not checked in today
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {!attendance ? (
                <Button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="bg-white text-emerald-700 hover:bg-white/90 font-black shadow-xl h-12 px-6 rounded-xl"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  {checkingIn ? "Checking in..." : "Check In"}
                </Button>
              ) : (
                <Button
                  onClick={handleCheckOut}
                  disabled={checkingIn}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-black h-12 px-6 rounded-xl"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  {checkingIn ? "Checking out..." : "Check Out"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaffStatCard
            icon={Wrench}
            label="Active Jobs"
            value={stats.activeJobs}
            sub="Pending completion"
            variant="primary"
            link="/jobs"
          />
          <StaffStatCard
            icon={CheckCircle}
            label="Done Today"
            value={stats.completedToday}
            sub="Jobs delivered"
            variant="success"
          />
          <StaffStatCard
            icon={IndianRupee}
            label="This Month"
            value={`₹${stats.thisMonthEarnings.toLocaleString()}`}
            sub="Earnings"
            variant="info"
          />
          <StaffStatCard
            icon={TrendingUp}
            label="Unpaid"
            value={`₹${stats.unpaidEarnings.toLocaleString()}`}
            sub="Pending payout"
            variant="warning"
          />
        </div>

        {/* Active Jobs + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Active Jobs */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  My Active Jobs
                </CardTitle>
                <Link to="/jobs">
                  <Button size="sm" variant="ghost" className="text-xs font-bold">
                    View All →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{job.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.device_brand} {job.device_model || ""} · {job.job_id}
                        </p>
                      </div>
                      <Badge
                        className={`shrink-0 text-[10px] font-bold ${
                          job.status === "Received"
                            ? "bg-blue-500/10 text-blue-600"
                            : job.status === "In Progress"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-green-500/10 text-green-600"
                        }`}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No active jobs right now
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs by Status Chart */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Jobs Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(160,60%,45%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Overview + Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Earnings */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Recent Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {earnings.length > 0 ? (
                <div className="space-y-3">
                  {earnings.slice(0, 5).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold capitalize">{e.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.description || "Commission"} · {new Date(e.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${e.type === "deduction" ? "text-destructive" : "text-emerald-600"}`}>
                          {e.type === "deduction" ? "-" : "+"}₹{Number(e.amount).toLocaleString()}
                        </p>
                        <Badge variant={e.paid ? "default" : "outline"} className="text-[9px]">
                          {e.paid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No earnings recorded yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Attendance */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAttendance.length > 0 ? (
                <div className="space-y-3">
                  {todayAttendance.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${a.check_out ? "bg-gray-200" : "bg-emerald-500/20"}`}>
                          {a.check_out ? (
                            <LogOut className="h-4 w-4 text-gray-500" />
                          ) : (
                            <LogIn className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold">
                            {new Date(a.check_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            {a.check_out && (
                              <span className="text-muted-foreground">
                                {" → "}
                                {new Date(a.check_out).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.check_out
                              ? `Duration: ${Math.round((new Date(a.check_out).getTime() - new Date(a.check_in).getTime()) / 60000)} min`
                              : "Active session"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={a.check_out ? "secondary" : "default"} className="text-[10px]">
                        {a.check_out ? "Completed" : "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No attendance logged today. Check in to start!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "View Jobs", icon: Wrench, href: "/jobs", color: "text-blue-600", bg: "bg-blue-500/10" },
                { label: "Customers", icon: AlertTriangle, href: "/customers", color: "text-amber-600", bg: "bg-amber-500/10" },
                { label: "Invoices", icon: IndianRupee, href: "/invoices", color: "text-emerald-600", bg: "bg-emerald-500/10" },
                { label: "Settings", icon: CheckCircle, href: "/settings", color: "text-purple-600", bg: "bg-purple-500/10" },
              ].map((action) => (
                <Link to={action.href} key={action.label}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border hover:bg-muted/50 hover:shadow-md transition-all group cursor-pointer">
                    <div className={`h-10 w-10 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-bold text-center">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// Stat Card component for the staff dashboard
function StaffStatCard({
  icon: Icon,
  label,
  value,
  sub,
  variant,
  link,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub: string;
  variant: "primary" | "success" | "warning" | "info";
  link?: string;
}) {
  const bgMap = {
    primary: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    success: "from-emerald-400 to-teal-500 shadow-emerald-500/20",
    warning: "from-amber-400 to-orange-500 shadow-amber-500/20",
    info: "from-cyan-400 to-blue-500 shadow-cyan-500/20",
  };

  const textMap = {
    primary: "text-indigo-600 dark:text-indigo-400",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-cyan-600 dark:text-cyan-400",
  };

  const content = (
    <Card className="h-full border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative ring-1 ring-white/20 dark:ring-white/10">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${bgMap[variant]} opacity-10 rounded-bl-full group-hover:scale-150 transition-transform duration-500`} />
      <CardContent className="p-4 md:p-5 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {label}
            </p>
            <p className="text-xl md:text-2xl font-black tracking-tight text-foreground">{value}</p>
            <p className={`text-[10px] md:text-xs font-semibold mt-1 ${textMap[variant]}`}>
              {sub}
            </p>
          </div>
          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br ${bgMap[variant]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (link) return <Link to={link}>{content}</Link>;
  return content;
}
