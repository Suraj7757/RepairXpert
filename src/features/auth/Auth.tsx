import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Mail,
  Lock,
  User,
  Gift,
  Tag,
  KeyRound,
  CheckCircle,
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";

type AuthMode =
  | "login"
  | "signup"
  | "forgot"
  | "signup_done"
  | "forgot_done"
  | "account_confirmed"
  | "magiclink_sent";

// Password strength validator
function getPasswordStrength(pwd: string) {
  let score = 0;
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  };
  score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}

export default function Auth() {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    sendPasswordReset,
    resendVerification,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get("mode") as AuthMode) || "login",
  );
  const [loginMethod, setLoginMethod] = useState<"password" | "magiclink">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [mobile, setMobile] = useState("");
  const [referralCode, setReferralCode] = useState(
    searchParams.get("ref") || "",
  );
  const [couponCode, setCouponCode] = useState("");
  const initialTab = (searchParams.get("tab") || searchParams.get("as") || "customer") as
    | "shopkeeper"
    | "wholesaler"
    | "customer";
  const [accountType, setAccountType] = useState<
    "shopkeeper" | "wholesaler" | "customer"
  >(initialTab);
  // If user lands with ?tab=shopkeeper, default mode to signup
  useEffect(() => {
    if ((searchParams.get("tab") === "shopkeeper" || searchParams.get("as") === "shopkeeper") && !searchParams.get("mode")) {
      setMode("signup");
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const pwdStrength = getPasswordStrength(password);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  // Intercept Supabase email confirmation magic link
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const type = params.get("type");
    if (type === "signup" || type === "magiclink") {
      supabase.auth.signOut().then(() => {
        setMode("account_confirmed");
        window.history.replaceState(null, "", window.location.pathname);
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await sendPasswordReset(email);
        if (error) toast.error(error);
        else setMode("forgot_done");
      } else if (mode === "login") {
        if (loginMethod === "magiclink") {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) {
            toast.error(error.message);
          } else {
            toast.success("Magic link sent! Check your inbox.");
            setMode("magiclink_sent");
          }
          setLoading(false);
          return;
        }
        if (!password) {
          toast.error("Password is required");
          setLoading(false);
          return;
        }
        const { error } = await signIn(email, password);
        if (error) {
          if (error.toLowerCase().includes("email not confirmed")) {
            toast.error("Email not verified. Please check your inbox.", {
              action: {
                label: "Resend Link",
                onClick: handleResendVerification,
              },
              duration: 10000,
            });
          } else {
            toast.error(error);
          }
        } else {
          toast.success("Welcome back!");
        }
      } else if (mode === "signup") {
        if (!password) {
          toast.error("Password is required");
          setLoading(false);
          return;
        }
        if (!pwdStrength.checks.length || !pwdStrength.checks.number || !pwdStrength.checks.special || !(pwdStrength.checks.uppercase || pwdStrength.checks.lowercase)) {
          toast.error(
            "Password must be at least 8 characters, alphanumeric, with a special character.",
          );
          setLoading(false);
          return;
        }
        if (!mobile || mobile.length < 10) {
          toast.error("Valid 10-digit mobile is required");
          setLoading(false);
          return;
        }
        const { error } = await signUp(
          email,
          password,
          displayName,
          mobile,
          accountType,
        );
        if (error) {
          toast.error(error);
        } else {
          setMode("signup_done");
          setPassword("");
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !isEmailValid) {
      toast.error("Please enter a valid email first");
      return;
    }
    setResendLoading(true);
    const { error } = await resendVerification(email);
    setResendLoading(false);
    if (error) toast.error(error);
    else {
      toast.success("Verification link resent! Please check your inbox.");
      setMode("signup_done");
    }
  };

  const handleGoogle = async () => {
    if (mode === "signup" && accountType) {
      localStorage.setItem("rx_pending_account_type", accountType);
    } else {
      localStorage.removeItem("rx_pending_account_type");
    }
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
      setLoading(false);
    }
    // On success, Supabase redirects — no need to setLoading(false)
  };

  /* ─── Account Confirmed Screen ─── */
  if (mode === "account_confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/5 bg-card/80 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 gradient-primary opacity-50" />
          <CardContent className="p-10 flex flex-col items-center text-center gap-6">
            <div className="h-24 w-24 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary/30 animate-bounce">
              <PartyPopper className="h-12 w-12 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">
                Account <span className="text-primary italic">Activated!</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Your email is verified. Log in with your email & password.
              </p>
            </div>
            <div className="bg-green-500/5 rounded-2xl border border-green-500/20 p-4 w-full text-left space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span className="font-semibold">
                  Email verified successfully
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>Your Servixo account is now active</span>
              </div>
            </div>
            <Button
              className="w-full h-12 font-black gradient-primary"
              onClick={() => setMode("login")}
            >
              Login to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─── Signup Done Screen ─── */
  if (mode === "signup_done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/5 bg-card/80 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 gradient-primary opacity-50" />
          <CardContent className="p-10 flex flex-col items-center text-center gap-6">
            <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">
                Check Your <span className="text-primary italic">Email!</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Confirmation link sent to{" "}
                <span className="font-bold text-foreground">{email}</span>.
                <br />
                Click the link to activate your account.
              </p>
            </div>
            <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 w-full text-left space-y-2">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Check inbox & spam folder</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Click magic link → Account Activated screen → Login</span>
              </div>
            </div>
            <Button
              className="w-full h-12 font-black gradient-primary"
              onClick={() => setMode("login")}
            >
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─── Forgot Done Screen ─── */
  if (mode === "forgot_done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/5 bg-card/80 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 gradient-primary opacity-50" />
          <CardContent className="p-10 flex flex-col items-center text-center gap-6">
            <div className="h-24 w-24 rounded-3xl bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-12 w-12 text-blue-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">
                Reset Link Sent!
              </h2>
              <p className="text-sm text-muted-foreground">
                Link sent to{" "}
                <span className="font-bold text-foreground">{email}</span>.
                <br />
                Open email → click magic link → set new password.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-12 font-bold"
              onClick={() => setMode("login")}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─── Magic Link Sent Screen ─── */
  if (mode === "magiclink_sent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/5 bg-card/80 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 gradient-primary opacity-50" />
          <CardContent className="p-10 flex flex-col items-center text-center gap-6">
            <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter animate-bounce">
                Magic Link <span className="text-primary italic">Sent!</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                We sent a passwordless sign-in link to{" "}
                <span className="font-bold text-foreground">{email}</span>.
                <br />
                Check your inbox and click the link to log in.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-12 font-bold"
              onClick={() => setMode("login")}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ─── Main Auth Form ─── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 flex-col gap-8 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors z-10"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-8 px-4 py-8">
        {/* Auth Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl border-primary/5 bg-card/80 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 gradient-primary opacity-50" />
            <CardHeader className="text-center space-y-3 pb-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-2xl shadow-primary/30 rotate-3 transform transition-transform hover:rotate-0">
                <Wrench className="h-10 w-10 text-primary-foreground" />
              </div>
              <CardTitle className="text-4xl font-black tracking-tighter">
                Servixo
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {mode === "login" && "Premium Business Access"}
                {mode === "signup" && "Create Your Account"}
                {mode === "forgot" && "Account Recovery"}
              </p>
            </CardHeader>

            <CardContent className="px-8 pb-8 space-y-4">
              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 flex items-center gap-3 font-semibold border-2 hover:bg-muted/50"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  or
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {mode === "login" && (
                  <div className="flex gap-2 p-1 bg-muted/50 rounded-xl border border-border/5">
                    <button
                      type="button"
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${loginMethod === "password" ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setLoginMethod("password")}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${loginMethod === "magiclink" ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setLoginMethod("magiclink")}
                    >
                      Magic Link
                    </button>
                  </div>
                )}
                {mode === "signup" && (
                  <>
                    {/* Name field */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                        <Input
                          className="pl-10 h-11 bg-muted/30 border-0 focus-visible:ring-1"
                          placeholder="Your full name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                        <Input
                          className="pl-10 h-11 bg-muted/30 border-0 focus-visible:ring-1"
                          placeholder="10-digit mobile"
                          inputMode="numeric"
                          maxLength={10}
                          value={mobile}
                          onChange={(e) =>
                            setMobile(
                              e.target.value.replace(/\D/g, "").slice(0, 10),
                            )
                          }
                          required
                        />
                        {mobile.length > 0 && (
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold ${mobile.length === 10 ? "text-green-500" : "text-orange-400"}`}>
                            {mobile.length}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Email Address
                    </Label>
                    {email && (
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest ${isEmailValid ? "text-green-500" : "text-red-500"}`}
                      >
                        {isEmailValid ? "Valid Format" : "Invalid Email"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail
                      className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isEmailValid ? "text-green-500" : "text-primary/50"}`}
                    />
                    <Input
                      className={`pl-10 h-11 bg-muted/30 border-0 focus-visible:ring-1 transition-all ${isEmailValid ? "ring-1 ring-green-500/30" : ""}`}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="off"
                    />
                    {isEmailValid && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 animate-in zoom-in" />
                    )}
                  </div>
                </div>

                {mode !== "forgot" && (mode !== "login" || loginMethod === "password") && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Password
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                      <Input
                        className="pl-10 pr-10 h-11 bg-muted/30 border-0 focus-visible:ring-1 font-mono"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {/* Password strength for signup */}
                    {mode === "signup" && password.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${i <= pwdStrength.score ? (pwdStrength.score <= 2 ? "bg-red-500" : pwdStrength.score === 3 ? "bg-yellow-500" : "bg-green-500") : "bg-muted"}`}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { key: "length", label: "8+ chars" },
                            { key: "uppercase", label: "Uppercase (A-Z)" },
                            { key: "lowercase", label: "Lowercase (a-z)" },
                            { key: "number", label: "Number (0-9)" },
                            { key: "special", label: "Special (!@#$...)" },
                          ].map(({ key, label }) => (
                            <div
                              key={key}
                              className={`flex items-center gap-1 text-[10px] ${pwdStrength.checks[key as keyof typeof pwdStrength.checks] ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {pwdStrength.checks[
                                key as keyof typeof pwdStrength.checks
                              ] ? (
                                <CheckCircle className="h-3 w-3 shrink-0" />
                              ) : (
                                <AlertCircle className="h-3 w-3 shrink-0" />
                              )}
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mode === "signup" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Ref Code
                      </Label>
                      <div className="relative">
                        <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-400" />
                        <Input
                          className="pl-9 h-9 bg-muted/30 border-0 text-xs"
                          placeholder="Optional"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Coupon
                      </Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
                        <Input
                          className="pl-9 h-9 bg-muted/30 border-0 text-xs"
                          placeholder="OFF20"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 font-black uppercase tracking-widest text-sm gradient-primary shadow-xl shadow-primary/30 active:scale-95 transition-all"
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : mode === "login"
                      ? (loginMethod === "magiclink" ? "Send Magic Link" : "Sign In")
                      : mode === "signup"
                        ? "Create Account"
                        : "Send Reset Link"}
                </Button>
              </form>

              <div className="pt-4 border-t border-muted-foreground/10">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setPassword("");
                    }}
                    className="text-[11px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                    type="button"
                  >
                    {mode === "login" ? "Create Account" : "Back to Login"}
                  </button>
                  {mode === "login" && (
                    <button
                      onClick={() => setMode("forgot")}
                      className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
                      type="button"
                    >
                      Forgot Password?
                    </button>
                  )}
                  {mode === "forgot" && (
                    <button
                      onClick={() => setMode("login")}
                      className="text-[11px] font-bold uppercase tracking-widest text-primary"
                      type="button"
                    >
                      Back to Login
                    </button>
                  )}
                </div>
                {/* Become a Shopkeeper CTA */}
                {mode === "signup" && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Own a repair shop?</p>
                    <a
                      href="/become-shopkeeper"
                      className="text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 uppercase tracking-wider flex items-center gap-1 mx-auto"
                    >
                      🏪 Become a Shopkeeper →
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center space-y-8 p-8">
          <div className="space-y-2">
            <h3 className="text-3xl font-black tracking-tight">
              Why choose{" "}
              <span className="text-primary italic">Servixo?</span>
            </h3>
            <p className="text-muted-foreground">
              The most advanced multi-service management platform.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              {
                icon: Smartphone,
                title: "Multi-Service Management",
                desc: "Mobile, Laptop, TV, AC, Fridge & PC — all in one platform.",
              },
              {
                icon: Lock,
                title: "Enterprise Grade Security",
                desc: "Encrypted sessions, RLS policies & real-time activity logs.",
              },
              {
                icon: Tag,
                title: "Smart Revenue Split",
                desc: "Auto commission & QR-based settlement cycles.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Latest Updates
              </h4>
              <Badge
                variant="outline"
                className="text-[9px] bg-primary/10 font-bold border-primary/20"
              >
                v3.0 Live
              </Badge>
            </div>
            <ul className="space-y-2">
              {[
                "Multi-Service Repair Form with animated category tabs",
                "Quick Create popup — Job or Sale in one click",
                "Google Sign-In + Strong password validation",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-50">
        Secured by Servixo Enterprise Infrastructure
      </p>
    </div>
  );
}
