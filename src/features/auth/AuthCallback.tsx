import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { homePathFor, isSuperAdminEmail } from "@/lib/accountType";
import { toast } from "sonner";
import { Wrench } from "lucide-react";

/**
 * Dedicated OAuth callback page.
 * Handles the `#access_token=...` fragment Supabase returns after Google redirect.
 * Works on Vercel, Lovable preview, and custom domains.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function handle() {
      try {
        // Supabase JS auto-parses hash on init; just wait briefly then read session
        await new Promise((r) => setTimeout(r, 250));
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error || !data.session) {
          // Try one more time after a short delay (network race)
          await new Promise((r) => setTimeout(r, 500));
          const retry = await supabase.auth.getSession();
          if (!retry.data.session) {
            toast.error("Sign-in failed. Please try again.");
            navigate("/auth", { replace: true });
            return;
          }
        }

        // Clean URL hash
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }

        // Determine landing route from profile
        const user = (await supabase.auth.getUser()).data.user;
        let acct: string = "shopkeeper";
        let isAdmin = false;
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("account_type")
            .eq("user_id", user.id)
            .maybeSingle() as any;
          acct = prof?.account_type || "shopkeeper";
          isAdmin = isSuperAdminEmail(user.email);
        }

        toast.success("Signed in successfully");
        navigate(homePathFor(acct as any, isAdmin), { replace: true });
      } catch (e) {
        console.error("OAuth callback error:", e);
        toast.error("Sign-in error. Please try again.");
        navigate("/auth", { replace: true });
      }
    }

    handle();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse">
          <Wrench className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-muted-foreground">
          Signing you in…
        </p>
      </div>
    </div>
  );
}
