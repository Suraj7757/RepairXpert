import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import {
  Megaphone,
  MessageSquare,
  Send,
  Gift,
  Users,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { logger } from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReferralStats {
  total_referrals: number;
  total_rewards_given: number;
  active_referrals: number;
}

interface Referral {
  id: string;
  referred_customer_name: string;
  referred_customer_phone: string;
  referral_date: string;
  reward_amount: number;
  status: "pending" | "completed" | "rejected";
}

export default function MarketingDashboard() {
  const { data: customers } = useSupabaseQuery<any>("customers");
  const { shopId } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    total_referrals: 0,
    total_rewards_given: 0,
    active_referrals: 0,
  });
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);

  // Fetch referral stats on mount and when shopId changes
  useEffect(() => {
    fetchReferralStats();
    const interval = setInterval(fetchReferralStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [shopId]);

  const fetchReferralStats = async () => {
    try {
      if (!shopId) return;

      // Get referral stats from database
      const { data, error } = await supabase
        .from("referral_program")
        .select("*")
        .eq("shop_id", shopId);

      if (error) {
        logger.error("Failed to fetch referral stats", { error: error.message });
        return;
      }

      if (data && data.length > 0) {
        const stats = data[0];
        setReferralStats({
          total_referrals: stats.total_referrals || 0,
          total_rewards_given: stats.total_rewards_given || 0,
          active_referrals: stats.active_referrals || 0,
        });
      }
    } catch (err) {
      logger.error("Error fetching referral stats", { error: err });
    }
  };

  const handleManageReferrals = async () => {
    setShowReferralDialog(true);
    setIsLoadingReferrals(true);

    try {
      if (!shopId) return;

      // Fetch all referrals for this shop
      const { data, error } = await supabase
        .from("referral_program_details")
        .select("*")
        .eq("shop_id", shopId)
        .order("referral_date", { ascending: false });

      if (error) {
        logger.error("Failed to fetch referrals", { error: error.message });
        toast.error("Failed to load referrals");
        return;
      }

      setReferrals(data || []);
    } catch (err) {
      logger.error("Error loading referrals", { error: err });
      toast.error("Error loading referrals");
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  const handleBulkSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to send.");
      return;
    }
    setIsSending(true);

    try {
      // Log the broadcast message for audit trail
      const { error: logError } = await supabase.from("activity_log").insert({
        shop_id: shopId,
        action: "broadcast_sent",
        description: `WhatsApp broadcast sent to ${customers.length} customers`,
        details: { customer_count: customers.length, message_preview: message.substring(0, 100) },
      });

      if (logError) {
        logger.warn("Failed to log broadcast", { error: logError.message });
      }

      // Simulate sending bulk messages (in production, would call WhatsApp Business API)
      await new Promise((r) => setTimeout(r, 2000));
      toast.success(`Successfully sent to ${customers.length} customers!`);
      setMessage("");
    } catch (e) {
      logger.error("Failed to send broadcast", { error: e });
      toast.error("Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MainLayout title="Marketing & Automation">
      <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
        <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-2xl border border-primary/10">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Megaphone className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Marketing Center
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Run bulk campaigns and manage customer engagement.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-2xl border-0 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-emerald-500" /> WhatsApp
                Broadcast
              </CardTitle>
              <CardDescription>
                Send promotional offers to all {customers.length} registered
                customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Message Content
                </Label>
                <Textarea
                  placeholder="Hey [Name]! Get 20% off on screen repairs this weekend..."
                  className="min-h-[150px] rounded-xl resize-none bg-background"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <div>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Target Audience
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    All active customers with mobile numbers
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-white dark:bg-slate-900 font-black"
                >
                  {customers.length} Contacts
                </Badge>
              </div>
              <Button
                onClick={handleBulkSend}
                disabled={isSending || customers.length === 0}
                className="w-full h-12 rounded-xl font-bold shadow-xl shadow-primary/20"
              >
                {isSending ? (
                  "Sending Broadcast..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Broadcast to{" "}
                    {customers.length} Customers
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-xl border-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Gift className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative z-10 space-y-4">
                <div>
                  <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">
                    Referral Program
                  </p>
                  <h3 className="text-3xl font-black">Active</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium bg-white/10 p-2 rounded-lg">
                    <span>Total Referrals</span>
                    <span className="font-black text-lg">{referralStats.total_referrals}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium bg-white/10 p-2 rounded-lg">
                    <span>Rewards Given</span>
                    <span className="font-black text-lg flex items-center">
                      <IndianRupee className="h-4 w-4" /> {referralStats.total_rewards_given.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleManageReferrals}
                  variant="secondary"
                  className="w-full rounded-xl font-bold mt-2 hover:scale-[1.02] transition-transform"
                >
                  Manage Referrals
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 rounded-3xl bg-card">
              <CardHeader className="pb-3 border-b border-muted/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Automated Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-muted/30">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">Payment Dues</p>
                    <p className="text-[10px] text-muted-foreground">
                      Sent 3 days before due
                    </p>
                  </div>
                  <Badge className="bg-success/10 text-success border-0">
                    Enabled
                  </Badge>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">Service Ready</p>
                    <p className="text-[10px] text-muted-foreground">
                      When status updates to Ready
                    </p>
                  </div>
                  <Badge className="bg-success/10 text-success border-0">
                    Enabled
                  </Badge>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">Birthday Wishes</p>
                    <p className="text-[10px] text-muted-foreground">
                      Annual greetings
                    </p>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">
                    Disabled
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Manage Referrals Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Referrals</DialogTitle>
            <DialogDescription>
              View and manage all referrals for your shop
            </DialogDescription>
          </DialogHeader>

          {isLoadingReferrals ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-muted-foreground">Loading referrals...</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-muted-foreground">No referrals yet</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        {referral.referred_customer_name}
                      </TableCell>
                      <TableCell>{referral.referred_customer_phone}</TableCell>
                      <TableCell>
                        {new Date(referral.referral_date).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{referral.reward_amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            referral.status === "completed"
                              ? "default"
                              : referral.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {referral.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
