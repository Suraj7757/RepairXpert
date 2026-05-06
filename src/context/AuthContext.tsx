import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/services/supabase";
import { SUPER_ADMIN_EMAIL, isSuperAdminEmail } from "@/lib/accountType";


import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "staff" | "customer" | "shopkeeper" | "wholesaler";
type AccountType = "shopkeeper" | "wholesaler" | "customer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  accountType: AccountType | null;
  isBanned: boolean;
  isMaintenance: boolean;
  isPlanExpired: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    mobile: string,
    accountType?: AccountType,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isPlanExpired, setIsPlanExpired] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string, userEmail?: string) => {
    setIsSuperAdmin(userEmail === SUPER_ADMIN_EMAIL);
    const [rolesRes, profileRes, configRes] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("is_banned, plan_expires_at, account_type")
        .eq("user_id", userId)
        .maybeSingle() as any,
      supabase
        .from("system_config")
        .select("value")
        .eq("id", "maintenance")
        .maybeSingle() as any,
    ]);

    const isSuper = userEmail === SUPER_ADMIN_EMAIL;
    const currentRole = isSuper
      ? ("admin" as AppRole)
      : ((rolesRes.data?.role as AppRole) || "staff");
    setRole(currentRole);
    setAccountType(
      (profileRes.data?.account_type as AccountType) || "shopkeeper",
    );

    const isMaint = configRes.data?.value?.enabled === true;
    setIsMaintenance(isMaint);

    if (isMaint && currentRole !== "admin") {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      return;
    }

    if (
      profileRes.data?.plan_expires_at &&
      new Date(profileRes.data.plan_expires_at) < new Date() &&
      currentRole !== "admin"
    ) {
      setIsPlanExpired(true);
    } else {
      setIsPlanExpired(false);
    }

    if (profileRes.data?.is_banned) {
      setIsBanned(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
    } else {
      setIsBanned(false);
    }
  }, []);

  useEffect(() => {
    let hadUser = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        hadUser = true;
        setTimeout(() => fetchRole(session.user.id, session.user.email), 0);
      } else {
        setRole(null);
        // Only redirect on EXPLICIT sign-out, not on token refresh hiccups
        if (hadUser && event === "SIGNED_OUT") {
          hadUser = false;
          const path = window.location.pathname;
          const onPublic =
            path.startsWith("/auth") ||
            path === "/" ||
            path.startsWith("/track") ||
            path.startsWith("/book/") ||
            path.startsWith("/marketplace") ||
            path.startsWith("/reset-password");
          if (!onPublic) {
            window.location.replace("/auth");
          }
        }
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRole(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchRole]);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    mobile: string,
    accountType: AccountType = "shopkeeper",
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { display_name: displayName, mobile, account_type: accountType },
      },
    });

    // If email confirmation is enabled, data.session will be null
    // If it's null, user needs to confirm email first (correct flow)
    let errorMessage = error?.message || null;
    if (errorMessage && errorMessage.toLowerCase().includes("rate limit")) {
      errorMessage =
        "Too many signup attempts. Please wait a few minutes and try again.";
    }
    return { error: errorMessage };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };

    if (data?.user) {
      const [profileRes, configRes, roleRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_banned, plan_expires_at")
          .eq("user_id", data.user.id)
          .maybeSingle() as any,
        supabase
          .from("system_config")
          .select("value")
          .eq("id", "maintenance")
          .maybeSingle() as any,
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle(),
      ]);

      const isMaint = configRes.data?.value?.enabled === true;
      const userRole = roleRes.data?.role;

      if (isMaint && userRole !== "admin") {
        await supabase.auth.signOut();
        setIsMaintenance(true);
        return {
          error: "System is currently under maintenance. Try again later.",
        };
      }

      if (profileRes.data?.is_banned) {
        await supabase.auth.signOut();
        setIsBanned(true);
        return {
          error: "Your account has been suspended by the administrator.",
        };
      }
    }

    return { error: null };
  };

  const signInWithGoogle = async () => {
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
        extraParams: { prompt: "select_account", access_type: "offline" },
      } as any);
      if ((result as any)?.error) return { error: String((result as any).error.message || (result as any).error) };
      return { error: null };
    } catch (e: any) {
      // Fallback to direct Supabase OAuth if Lovable module unavailable
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account", access_type: "offline" },
        },
      });
      if (error) return { error: error.message };
      return { error: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message || null };
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });
    return { error: error?.message || null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        accountType,
        isBanned,
        isMaintenance,
        isPlanExpired,
        isSuperAdmin,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        sendPasswordReset,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
