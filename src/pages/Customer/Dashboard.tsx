import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, BrainCircuit, Calendar, Gift, ChevronRight, Smartphone } from "lucide-react";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: jobs = [], loading: jobsLoading } = useSupabaseQuery<any>("repair_jobs");
  const { data: bookings = [], loading: bookingsLoading } = useSupabaseQuery<any>("service_bookings");
  const { data: profiles = [] } = useSupabaseQuery<any>("profiles");

  const myProfile = useMemo(() => {
    return profiles.find((p: any) => p.user_id === user?.id);
  }, [profiles, user]);

  const activeJobs = useMemo(() => {
    return jobs.filter((j: any) => j.status !== "Delivered" && j.status !== "Cancelled");
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome back, {user?.user_metadata?.display_name || "Valued Customer"}!
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Manage your device repairs, appointments, and shopping
          </p>
        </div>
        
        {/* Loyalty Points Display */}
        <Card className="border border-white/10 shadow-md bg-gradient-to-r from-amber-500/10 to-orange-500/10 flex items-center gap-4 px-5 py-3 rounded-2xl shrink-0">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Gift className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
              Loyalty Points
            </p>
            <p className="text-xl font-black tracking-tight">
              {myProfile?.loyalty_points || 0} pts
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-2 border-primary/10 hover:border-primary/20 shadow-md hover:shadow-lg transition-all overflow-hidden relative group">
          <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-primary/5 group-hover:scale-125 transition-transform" />
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg font-bold tracking-tight">Book a Repair</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground font-medium mb-4">
              Schedule a visit to our shop or book a pickup for your damaged device.
            </p>
            <Button onClick={() => navigate("/customer/booking")} className="rounded-xl font-bold gap-2">
              Schedule Now <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/10 hover:border-blue-500/20 shadow-md hover:shadow-lg transition-all overflow-hidden relative group">
          <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-blue-500/5 group-hover:scale-125 transition-transform" />
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
              <BrainCircuit className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-lg font-bold tracking-tight">AI Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground font-medium mb-4">
              Describe your device problem and get a smart diagnosis instantly using AI.
            </p>
            <Button onClick={() => navigate("/customer/ai-diagnostic")} variant="outline" className="rounded-xl font-bold border-blue-500/25 text-blue-500 hover:bg-blue-500/5 gap-2">
              Start Diagnosis <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Repair Jobs */}
        <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-tight">Active Repairs</CardTitle>
            <Wrench className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {jobsLoading ? (
              <div className="space-y-2">
                <div className="h-12 bg-muted animate-pulse rounded-xl" />
                <div className="h-12 bg-muted animate-pulse rounded-xl" />
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground font-medium">No active repair jobs found.</p>
              </div>
            ) : (
              activeJobs.map((job: any) => (
                <div key={job.id} className="p-4 rounded-xl border border-white/5 bg-background/40 hover:bg-background/60 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold tracking-tight">{job.device_name || "Unknown Device"}</p>
                    <p className="text-xs text-muted-foreground font-medium">Tracking ID: {job.tracking_id || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={job.status === "Ready" ? "success" : "default"} className="rounded-lg font-bold">
                      {job.status}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/track?id=${job.tracking_id}`)} className="rounded-xl">
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="border border-white/10 shadow-lg bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-tight">Upcoming Appointments</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {bookingsLoading ? (
              <div className="space-y-2">
                <div className="h-12 bg-muted animate-pulse rounded-xl" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground font-medium">No upcoming bookings scheduled.</p>
              </div>
            ) : (
              bookings.map((booking: any) => (
                <div key={booking.id} className="p-4 rounded-xl border border-white/5 bg-background/40 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold tracking-tight">{booking.service_name || "Device Service"}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      Date: {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time || "N/A"}
                    </p>
                  </div>
                  <Badge className="rounded-lg font-bold">
                    {booking.status || "Confirmed"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
