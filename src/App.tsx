import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useEffect, Suspense, lazy } from "react";

const Landing = lazy(() => import("@/features/dashboard/Landing"));
const Auth = lazy(() => import("@/features/auth/Auth"));
const AuthCallback = lazy(() => import("@/features/auth/AuthCallback"));
const TrackOrder = lazy(() => import("@/features/jobs/TrackOrder"));
const Dashboard = lazy(() => import("@/features/dashboard/Dashboard"));
const Customers = lazy(() => import("@/features/customers/Customers"));
const RepairJobs = lazy(() => import("@/features/jobs/RepairJobs"));
const Payments = lazy(() => import("@/features/payments/Payments"));
const Settlements = lazy(() => import("@/features/payments/Settlements"));
const Inventory = lazy(() => import("@/features/inventory/Inventory"));
const Sells = lazy(() => import("@/features/inventory/Sells"));
const Reports = lazy(() => import("@/features/dashboard/Reports"));
const Settings = lazy(() => import("@/features/settings/Settings"));
const Trash = lazy(() => import("@/features/admin/Trash"));
const ResetPassword = lazy(() => import("@/features/auth/ResetPassword"));
const SellerSignup = lazy(() => import("@/features/auth/SellerSignup"));
const AdminPanel = lazy(() => import("@/features/admin/AdminPanel"));
const DevPanel = lazy(() => import("@/features/admin/DevPanel"));
const WalletPage = lazy(() => import("@/features/wallet/WalletPage"));
const Subscription = lazy(() => import("@/features/settings/Subscription"));
const ServicesManagement = lazy(() => import("@/features/services/ServicesManagement"));
const EnterpriseModules = lazy(() => import("@/features/enterprise/EnterpriseModules"));
const StaffManagement = lazy(() => import("@/features/staff/StaffManagement"));
const StaffEarnings = lazy(() => import("@/features/staff/StaffEarnings"));
const Financials = lazy(() => import("@/features/dashboard/Financials"));
const Analytics = lazy(() => import("@/features/dashboard/Analytics"));
const PrivacyPolicy = lazy(() => import("@/features/dashboard/PrivacyPolicy"));
const TermsConditions = lazy(() => import("@/features/dashboard/TermsConditions"));
const NotFound = lazy(() => import("@/components/common/NotFound"));
const Branches = lazy(() => import("@/features/branches/Branches"));
const Expenses = lazy(() => import("@/features/expenses/Expenses"));
const Loyalty = lazy(() => import("@/features/loyalty/Loyalty"));
const BookingsAdmin = lazy(() => import("@/features/booking/BookingsAdmin"));
const PublicBooking = lazy(() => import("@/features/booking/PublicBooking"));
const WholesaleDashboard = lazy(() => import("@/features/wholesale/WholesaleDashboard"));
const CustomerDashboard = lazy(() => import("@/features/customer/CustomerDashboard"));
const AiDiagnosticCenter = lazy(() => import("@/features/ai/AiDiagnosticCenter"));
const MarketingDashboard = lazy(() => import("@/features/marketing/MarketingDashboard"));
const Marketplace = lazy(() => import("@/features/marketplace/Marketplace"));
const ListingDetail = lazy(() => import("@/features/marketplace/ListingDetail"));
const Cart = lazy(() => import("@/features/marketplace/Cart"));
const Checkout = lazy(() => import("@/features/marketplace/Checkout"));
const MyOrders = lazy(() => import("@/features/marketplace/MyOrders"));
const SellerListings = lazy(() => import("@/features/marketplace/SellerListings"));
const BecomeSeller = lazy(() => import("@/features/seller/BecomeSeller"));

import { homePathFor } from "@/lib/accountType";
const SellerOrders = lazy(() => import("@/features/marketplace/SellerOrders"));
const ShopPublicPage = lazy(() => import("@/features/marketplace/ShopPublicPage"));
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Chatbot } from "@/components/common/Chatbot";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  children,
  allowExpired = false,
}: {
  children: React.ReactNode;
  allowExpired?: boolean;
}) {
  const { user, loading, isPlanExpired, isBanned, isMaintenance, isSuperAdmin, accountType } =
    useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  if (isMaintenance && !isSuperAdmin) return <Navigate to="/auth" replace />;
  if (isBanned && !isSuperAdmin) return <Navigate to="/auth" replace />;
  if (isPlanExpired && !allowExpired && !isSuperAdmin && accountType !== "customer") {
    return <Navigate to="/subscription" replace />;
  }
  return <>{children}</>;
}

function ShopkeeperRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, accountType, isSuperAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (isSuperAdmin) return <Navigate to="/admin" replace />;
  if (accountType === "customer") return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Extracted from IIFE to fix Rules of Hooks violation
function AuthRoute({ home }: { home: string }) {
  const { user, isBanned, isMaintenance } = useAuth();
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const hashParams = new URLSearchParams(hash.replace("#", "?"));
  const isEmailConfirm =
    hashParams.get("type") === "signup" ||
    hashParams.get("type") === "magiclink";

  if (user && !isEmailConfirm && !isBanned && !isMaintenance)
    return <Navigate to={home} replace />;
  return <Auth />;
}

function AppRoutes() {
  const { user, loading, accountType, isSuperAdmin } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  const home = user ? homePathFor(accountType, isSuperAdmin) : "/";

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              user && accountType !== "customer" && !isSuperAdmin
                ? <Navigate to={home} replace />
                : isSuperAdmin
                  ? <Navigate to="/admin" replace />
                  : <Landing />
            }
          />
          <Route
            path="/auth"
            element={<AuthRoute home={home} />}
          />
          <Route path="/partner-with-us" element={user && !isSuperAdmin ? <Navigate to={home} replace /> : <SellerSignup />} />
          <Route path="/become-shopkeeper" element={user ? <BecomeSeller /> : <Navigate to="/auth" replace />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/wholesale"
            element={
              <ProtectedRoute>
                <WholesaleDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ShopkeeperRoute><Dashboard /></ShopkeeperRoute>} />
          <Route path="/customers" element={<ShopkeeperRoute><Customers /></ShopkeeperRoute>} />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Customers />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <RepairJobs />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Payments />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/settlements"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Settlements />
                )}
              </ProtectedRoute>
            }
          />
          <Route path="/jobs" element={<ShopkeeperRoute><RepairJobs /></ShopkeeperRoute>} />
          <Route path="/payments" element={<ShopkeeperRoute><Payments /></ShopkeeperRoute>} />
          <Route path="/settlements" element={<ShopkeeperRoute><Settlements /></ShopkeeperRoute>} />
          <Route path="/inventory" element={<ShopkeeperRoute><Inventory /></ShopkeeperRoute>} />
          <Route path="/sells" element={<ShopkeeperRoute><Sells /></ShopkeeperRoute>} />
          <Route path="/reports" element={<ShopkeeperRoute><Reports /></ShopkeeperRoute>} />
          <Route path="/analytics" element={<ShopkeeperRoute><Analytics /></ShopkeeperRoute>} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/trash" element={<ShopkeeperRoute><Trash /></ShopkeeperRoute>} />
          <Route path="/wallet" element={<ShopkeeperRoute><WalletPage /></ShopkeeperRoute>} />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute allowExpired>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Subscription />
                )}
              </ProtectedRoute>
            }
          />
          <Route path="/services" element={<ShopkeeperRoute><ServicesManagement /></ShopkeeperRoute>} />
          <Route path="/enterprise" element={<ShopkeeperRoute><EnterpriseModules /></ShopkeeperRoute>} />
          <Route path="/ai-diagnostics" element={<ShopkeeperRoute><AiDiagnosticCenter /></ShopkeeperRoute>} />
          <Route path="/marketing" element={<ShopkeeperRoute><MarketingDashboard /></ShopkeeperRoute>} />
          <Route path="/staff" element={<ShopkeeperRoute><StaffManagement /></ShopkeeperRoute>} />
          <Route path="/staff-earnings" element={<ShopkeeperRoute><StaffEarnings /></ShopkeeperRoute>} />
          <Route path="/financials" element={<ShopkeeperRoute><Financials /></ShopkeeperRoute>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? <AdminPanel /> : <Navigate to={home} replace />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev-panel"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? <DevPanel /> : <Navigate to={home} replace />}
              </ProtectedRoute>
            }
          />
          <Route path="/branches" element={<ShopkeeperRoute><Branches /></ShopkeeperRoute>} />
          <Route path="/expenses" element={<ShopkeeperRoute><Expenses /></ShopkeeperRoute>} />
          <Route path="/loyalty" element={<ShopkeeperRoute><Loyalty /></ShopkeeperRoute>} />
          <Route path="/bookings" element={<ShopkeeperRoute><BookingsAdmin /></ShopkeeperRoute>} />
          <Route path="/book/:slug" element={<PublicBooking />} />
          {/* Marketplace (public browse) */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<ListingDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-listings" element={<ShopkeeperRoute><SellerListings /></ShopkeeperRoute>} />
          <Route path="/seller-orders" element={<ShopkeeperRoute><SellerOrders /></ShopkeeperRoute>} />
          <Route path="/shop/:slug" element={<ShopPublicPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route
            path="*"
            element={
              <ErrorBoundary>
                <NotFound />
              </ErrorBoundary>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  useEffect(() => {
    localStorage.setItem("rx-skin", "default");
    const layout = localStorage.getItem("rx-layout") || "modern";
    document.documentElement.setAttribute("data-skin", "default");
    document.documentElement.setAttribute("data-layout", layout);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <AppRoutes />
            <Chatbot />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
