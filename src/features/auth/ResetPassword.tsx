import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/services/supabase";
import {
  Lock,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type PageState = "loading" | "form" | "success";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const handleSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (
        session ||
        window.location.hash.includes("type=recovery") ||
        window.location.hash.includes("access_token=")
      ) {
        setPageState("form");
      }
    };

    handleSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setPageState("form");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      setPageState("success");
    }
    setLoading(false);
  };

  /* ─── Success Screen ─── */
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/5 bg-card/80 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 gradient-primary opacity-50" />
          <CardContent className="p-10 flex flex-col items-center text-center gap-6">
            <div className="h-24 w-24 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary/30 animate-bounce">
              <PartyPopper className="h-12 w-12 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter text-foreground">
                Password <span className="text-primary italic">Changed!</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your new password has been set successfully.
                <br />
                You can now log in with your new credentials.
              </p>
            </div>
            <div className="bg-green-500/5 rounded-2xl border border-green-500/20 p-4 w-full space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span className="font-semibold">
                  Password updated successfully
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Your account is secured with the new password</span>
              </div>
            </div>
            <Button
              className="w-full h-12 font-black uppercase tracking-widest text-sm gradient-primary shadow-xl"
              onClick={() => navigate("/auth")}
            >
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─── Loading Screen ─── */
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/5 bg-card/80 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 gradient-primary opacity-50" />
          <CardContent className="p-10 flex flex-col items-center gap-6 text-center">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Validating Reset Link...
            </p>
            <p className="text-xs text-muted-foreground">
              Please wait while we verify your identity
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─── Set New Password Form ─── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 flex-col gap-6">
      <Card className="w-full max-w-md shadow-2xl border-primary/5 bg-card/80 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 gradient-primary opacity-50" />
        <CardHeader className="text-center space-y-3 pb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-2xl shadow-primary/30 rotate-3">
            <KeyRound className="h-10 w-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter">
            Set New Password
          </CardTitle>
          <CardDescription className="uppercase text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
            Reset Your ServiceHub Account Access
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                <Input
                  className="pl-10 h-12 bg-muted/30 border-0 focus-visible:ring-1 transition-all"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Confirm Password
              </Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                <Input
                  className="pl-10 h-12 bg-muted/30 border-0 focus-visible:ring-1 transition-all"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>

            {password && confirm && password !== confirm && (
              <p className="text-xs text-red-500 font-semibold text-center">
                Passwords do not match
              </p>
            )}
            {password &&
              confirm &&
              password === confirm &&
              password.length >= 6 && (
                <p className="text-xs text-green-600 font-semibold text-center flex items-center justify-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Passwords match
                </p>
              )}

            <Button
              type="submit"
              className="w-full h-12 font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/30 gradient-primary transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? "Updating..." : "Confirm New Password"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/auth")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Back to Login
            </button>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-50">
        ServiceHub Secure Recovery Portal
      </p>
    </div>
  );
}
