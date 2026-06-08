import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Gift,
  Copy,
  Share2,
  Monitor,
  IndianRupee,
  TrendingUp,
  History,
  Coins,
} from "lucide-react";
import { toast } from "sonner";

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [todayViews, setTodayViews] = useState(0);
  const [loading, setLoading] = useState(true);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [walletR, txR, wdR, profileR, refR, adsR, viewsR] = await Promise.all(
      [
        supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("withdraw_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id),
        supabase.from("ads").select("*").eq("active", true),
        supabase
          .from("ad_views")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", today),
      ],
    );
    setWallet(walletR.data);
    setTransactions(txR.data || []);
    setWithdrawals(wdR.data || []);
    setProfile(profileR.data);
    setReferrals(refR.data || []);
    setAds(adsR.data || []);
    setTodayViews(viewsR.data?.length || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (amount > Number(wallet?.balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }
    const { error } = await supabase
      .from("withdraw_requests")
      .insert({ user_id: user!.id, amount } as any);
    if (error) toast.error("Failed to submit");
    else {
      toast.success("Withdrawal request submitted");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      fetchData();
    }
  };

  const watchAd = async (ad: any) => {
    if (todayViews >= (ad.daily_limit || 10)) {
      toast.error("Daily ad limit reached");
      return;
    }
    if (ad.link_url) window.open(ad.link_url, "_blank");
    // Record view and earn
    await supabase.from("ad_views").insert({
      user_id: user!.id,
      ad_id: ad.id,
      earned: ad.reward_amount,
    } as any);
    await supabase.from("wallet_transactions").insert({
      user_id: user!.id,
      type: "earning",
      source: "ad",
      amount: ad.reward_amount,
      description: `Watched ad: ${ad.title}`,
    } as any);
    await supabase
      .from("wallets")
      .update({
        balance: Number(wallet.balance) + Number(ad.reward_amount),
        total_earned: Number(wallet.total_earned) + Number(ad.reward_amount),
      } as any)
      .eq("user_id", user!.id);
    toast.success(`Earned ₹${ad.reward_amount}!`);
    fetchData();
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const shareReferral = () => {
    const code = profile?.referral_code || "";
    const text = `Join RepairDesk CRM with my referral code: ${code}\n${window.location.origin}/auth?mode=signup&ref=${code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading)
    return (
      <MainLayout title="Wallet">
        <p className="text-center p-8 text-muted-foreground">Loading...</p>
      </MainLayout>
    );

  return (
    <MainLayout title="Wallet & Earnings">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="gradient-primary border-0 shadow-xl shadow-primary/20 relative overflow-hidden group col-span-1 md:col-span-2">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardContent className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <p className="text-sm font-bold text-primary-foreground/70 uppercase tracking-widest flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Available Balance
                </p>
                <h2 className="text-5xl font-black text-primary-foreground tracking-tight">
                  ₹{Number(wallet?.balance || 0).toLocaleString()}
                </h2>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setWithdrawOpen(true)}
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 border-0 text-white font-bold h-10"
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-2" /> Withdraw
                  </Button>
                </div>
              </div>
              <div className="flex gap-10 border-l border-white/10 pl-8">
                <div>
                  <p className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest mb-1">
                    Total Earned
                  </p>
                  <p className="text-2xl font-black text-primary-foreground">
                    ₹{Number(wallet?.total_earned || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest mb-1">
                    Withdrawn
                  </p>
                  <p className="text-2xl font-black text-primary-foreground">
                    ₹{Number(wallet?.total_withdrawn || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur-md overflow-hidden relative group">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl gradient-warning flex items-center justify-center shadow-lg shadow-warning/20 group-hover:scale-110 transition-transform">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">
                  {referrals.length}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Total Referrals
                </p>
              </div>
              <Badge className="bg-warning/10 text-warning border-warning/20">
                Active Program
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-2xl border-primary/5 bg-gradient-to-br from-card to-muted/30 overflow-hidden">
          <CardHeader className="pb-3 px-8 pt-8">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Coins className="h-5 w-5 text-warning" /> Referral Program
            </CardTitle>
            <CardDescription>
              Share your unique code and earn ₹50 for every verified business
              signup.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-center gap-6 mt-4">
              <div className="flex items-center gap-4 bg-muted/50 p-6 rounded-2xl border border-dashed border-primary/20 w-full md:w-auto">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 mt-12">
                    Secured by RepairXpert Enterprise Infrastructure
                  </p>
                  <p className="text-4xl font-black text-primary tracking-tighter">
                    {profile?.referral_code || "REPAIRXPERT-PRO"}
                  </p>
                </div>
                <div className="h-12 w-[1px] bg-primary/10 mx-2" />
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={copyReferralCode}
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={shareReferral}
                    className="hover:bg-green-500/10 hover:text-green-600 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold text-xs shadow-sm">
                    1
                  </div>
                  <p className="text-sm font-medium">
                    Friend joins using your link or code during signup.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm">
                    2
                  </div>
                  <p className="text-sm font-medium">
                    They complete their first settlement cycle.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-xs shadow-sm">
                    3
                  </div>
                  <p className="text-sm font-bold text-primary">
                    You both receive rewards in your wallets!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="transactions">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="ads">Watch & Earn</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-3 mt-4">
            {transactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet
              </p>
            )}
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tx.description || tx.source}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${tx.type === "earning" ? "text-green-600" : "text-destructive"}`}
                  >
                    {tx.type === "earning" ? "+" : "-"}₹
                    {Number(tx.amount).toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ads" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Today's views: {todayViews} | Watch ads to earn rewards!
            </p>
            {ads.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No ads available
              </p>
            )}
            {ads.map((ad) => (
              <Card key={ad.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{ad.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ad.description}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      Earn ₹{Number(ad.reward_amount).toFixed(2)}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={() => watchAd(ad)}>
                    <Monitor className="h-4 w-4 mr-1" /> Watch
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-3 mt-4">
            {withdrawals.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No withdrawal requests
              </p>
            )}
            {withdrawals.map((w) => (
              <Card key={w.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      ₹{Number(w.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(w.created_at).toLocaleString()}
                    </p>
                  </div>
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
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Available balance: ₹{Number(wallet?.balance || 0).toFixed(2)}
              </p>
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleWithdraw}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
