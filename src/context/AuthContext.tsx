import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/services/supabase";
import { isSuperAdminEmail } from "@/lib/accountType";


import type { User, Session } from "@supabase/supabase-js";

type AppRole = "super_admin" | "shopkeeper" | "staff" | "customer";
type AccountType = "shopkeeper" | "wholesaler" | "customer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  shopId: string | null;
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
  const [shopId, setShopId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isPlanExpired, setIsPlanExpired] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string, userEmail?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      if (!currentUser) return; // Guard: session expired during fetch
      
      const isSuper = isSuperAdminEmail(userEmail);
      setIsSuperAdmin(isSuper);
      const [rolesRes, profileRes, configRes] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("role, shop_id, is_banned, plan_expires_at, account_type")
          .eq("user_id", userId)
          .maybeSingle() as any,
        supabase
          .from("system_config")
          .select("value")
          .eq("id", "maintenance")
          .maybeSingle() as any,
      ]);

      const profileData = profileRes.data;
      if (profileData && currentUser) {
        const emailVal = currentUser.email;
        const phoneVal = currentUser.phone || currentUser.user_metadata?.mobile || currentUser.user_metadata?.phone;
        if (emailVal || phoneVal) {
          supabase
            .from("profiles")
            .update({ email: emailVal, phone: phoneVal } as any)
            .eq("user_id", userId)
            .then(() => {});
        }
      }
      
      let finalRole: AppRole = "customer";
      if (isSuper) {
        finalRole = "super_admin";
      } else if (rolesRes.data?.role === "admin") {
        finalRole = "shopkeeper";
      } else if (rolesRes.data?.role) {
        finalRole = rolesRes.data.role as AppRole;
      } else {
        finalRole = (profileData?.role as AppRole) || "customer";
      }

      const currentRole = finalRole;
      let currentShopId = profileData?.shop_id || null;

      if (currentRole === "staff" && currentUser) {
        try {
          const staffEmail = currentUser.email || "";
          const staffPhone = currentUser.phone || currentUser.user_metadata?.mobile || currentUser.user_metadata?.phone || "";
          const { data: staffData } = await supabase
            .from("staff_members")
            .select("shop_user_id")
            .or(`email.eq.${staffEmail},phone.eq.${staffPhone}`)
            .maybeSingle();
          if (staffData) {
            currentShopId = staffData.shop_user_id;
          }
        } catch (staffErr) {
          console.warn("Staff member lookup failed:", staffErr);
        }
      }

      setRole(currentRole);
      setShopId(currentShopId);
      setIsSuperAdmin(isSuper);
      setAccountType(
        (profileData?.account_type as AccountType) || 
        (currentRole === "super_admin" ? "shopkeeper" : currentRole as AccountType) || 
        "customer"
      );

      const isMaint = configRes.data?.value?.enabled === true;
      setIsMaintenance(isMaint);

      if (isMaint && !isSuper) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setShopId(null);
        return;
      }

      if (
        profileData?.plan_expires_at &&
        new Date(profileData.plan_expires_at) < new Date() &&
        !isSuper
      ) {
        setIsPlanExpired(true);
      } else {
        setIsPlanExpired(false);
      }

      if (profileData?.is_banned) {
        setIsBanned(true);
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setShopId(null);
      } else {
        setIsBanned(false);
      }
    } catch (err) {
      console.error("fetchRole error:", err);
      // Don't crash the app — keep user logged in with defaults
      setRole("customer");
      setIsBanned(false);
      setIsPlanExpired(false);
    }
  }, []);

  useEffect(() => {
    let hadUser = false;
    let initialLoadDone = false;

    // getSession() provides the initial state
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        hadUser = true;
        await fetchRole(session.user.id, session.user.email);
      }
      initialLoadDone = true;
      setLoading(false);
    });

    // onAuthStateChange handles subsequent changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip the INITIAL_SESSION event since getSession already handles it
      if (!initialLoadDone && event === "INITIAL_SESSION") return;

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
            path.startsWith("/shop/") ||
            path.startsWith("/marketplace") ||
            path.startsWith("/reset-password") ||
            path.startsWith("/privacy") ||
            path.startsWith("/terms");
          if (!onPublic) {
            window.location.replace("/auth");
          }
        }
      }
      if (initialLoadDone) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchRole]);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    mobile: string,
    accountType: AccountType = "customer",
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
      const [profileRes, configRes] = await Promise.all([
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
      ]);

      const isMaint = configRes.data?.value?.enabled === true;
      const isSuper = isSuperAdminEmail(data.user.email);

      if (isMaint && !isSuper) {
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account", access_type: "offline" },
        },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || "An unexpected error occurred" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setShopId(null);
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
        shopId,
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
