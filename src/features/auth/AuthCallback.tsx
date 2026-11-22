import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { homePathFor, isSuperAdminEmail } from "@/lib/accountType";
import { toast } from "sonner";
import { Wrench } from "lucide-react";

/**
 * Dedicated OAuth callback page.
 * Handles Supabase's implicit token hash and authorization-code callback.
 * Works on Vercel and custom domains.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function handle() {
      try {
        // Give Supabase Auth a moment to initialise and process an implicit-flow hash.
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;

        let { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        // If the project returns an authorization code (PKCE), exchange it
        // only when Supabase has not already restored a session from the URL.
        const code = new URLSearchParams(window.location.search).get("code");
        if (!data.session && code) {
          const exchanged = await supabase.auth.exchangeCodeForSession(code);
          if (exchanged.error) throw exchanged.error;
          data = { session: exchanged.data.session, user: exchanged.data.user };
          error = null;
        }

        if (error || !data.session) {
          // Retry once for slower browser storage/session initialisation.
          await new Promise((r) => setTimeout(r, 500));
          const retry = await supabase.auth.getSession();
          if (cancelled) return;
          if (!retry.data.session) {
            const callbackError =
              new URLSearchParams(window.location.search).get("error_description") ||
              new URLSearchParams(window.location.search).get("error");
            toast.error(callbackError || error?.message || "Google sign-in failed. Please try again.");
            navigate("/auth", { replace: true });
            return;
          }
        }

        // Remove OAuth tokens/codes from the address bar after session is restored.
        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, "", window.location.pathname);
        }

        // Determine landing route from profile
        const user = (await supabase.auth.getUser()).data.user;
        let acct: string = "customer";
        let isAdmin = false;
        if (user) {
          const pendingAccountType = localStorage.getItem("rx_pending_account_type");
          if (pendingAccountType) {
            // Update the profile with the requested account type
            localStorage.removeItem("rx_pending_account_type");
            if (pendingAccountType === "shopkeeper" && !isSuperAdminEmail(user.email)) {
              toast.success("Signed in. Complete your shop application.");
              navigate("/become-shopkeeper", { replace: true });
              return;
            }
          }

          const { data: prof } = await supabase
            .from("profiles")
            .select("account_type")
            .eq("user_id", user.id)
            .maybeSingle() as any;
          acct = prof?.account_type || "customer";
          isAdmin = isSuperAdminEmail(user.email);
        }

        const { data: r } = user
          ? await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
          : { data: null as any };
        toast.success("Signed in successfully");
        navigate(homePathFor(acct as any, isAdmin, r?.role === "staff" ? "staff" : undefined), { replace: true });
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
