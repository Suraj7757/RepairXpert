import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

import Landing from "@/features/dashboard/Landing";
import Auth from "@/features/auth/Auth";
import AuthCallback from "@/features/auth/AuthCallback";
import TrackOrder from "@/features/jobs/TrackOrder";
import Dashboard from "@/features/dashboard/Dashboard";
import Customers from "@/features/customers/Customers";
import RepairJobs from "@/features/jobs/RepairJobs";
import Payments from "@/features/payments/Payments";
import Settlements from "@/features/payments/Settlements";
import Inventory from "@/features/inventory/Inventory";
import Sells from "@/features/inventory/Sells";
import Reports from "@/features/dashboard/Reports";
import Settings from "@/features/settings/Settings";
import Trash from "@/features/admin/Trash";
import ResetPassword from "@/features/auth/ResetPassword";
import AdminPanel from "@/features/admin/AdminPanel";
import DevPanel from "@/features/admin/DevPanel";
import WalletPage from "@/features/wallet/WalletPage";
import Subscription from "@/features/settings/Subscription";
import ServicesManagement from "@/features/services/ServicesManagement";
import EnterpriseModules from "@/features/enterprise/EnterpriseModules";
import StaffManagement from "@/features/staff/StaffManagement";
import Financials from "@/features/dashboard/Financials";
import Analytics from "@/features/dashboard/Analytics";
import PrivacyPolicy from "@/features/dashboard/PrivacyPolicy";
import TermsConditions from "@/features/dashboard/TermsConditions";
import NotFound from "@/components/common/NotFound";
import Branches from "@/features/branches/Branches";
import Expenses from "@/features/expenses/Expenses";
import Loyalty from "@/features/loyalty/Loyalty";
import BookingsAdmin from "@/features/booking/BookingsAdmin";
import PublicBooking from "@/features/booking/PublicBooking";
import WholesaleDashboard from "@/features/wholesale/WholesaleDashboard";
import CustomerDashboard from "@/features/customer/CustomerDashboard";
import AiDiagnosticCenter from "@/features/ai/AiDiagnosticCenter";
import MarketingDashboard from "@/features/marketing/MarketingDashboard";
import Marketplace from "@/features/marketplace/Marketplace";
import ListingDetail from "@/features/marketplace/ListingDetail";
import Cart from "@/features/marketplace/Cart";
import Checkout from "@/features/marketplace/Checkout";
import MyOrders from "@/features/marketplace/MyOrders";
import SellerListings from "@/features/marketplace/SellerListings";
import { homePathFor } from "@/lib/accountType";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Chatbot } from "@/components/common/Chatbot";
import { Suspense } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowExpired = false,
}: {
  children: React.ReactNode;
  allowExpired?: boolean;
}) {
  const { user, loading, isPlanExpired, isBanned, isMaintenance, isSuperAdmin } =
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
  if (isPlanExpired && !allowExpired && !isSuperAdmin) {
    return <Navigate to="/subscription" replace />;
  }
  return <>{children}</>;
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
            element={user ? <Navigate to={home} replace /> : <Landing />}
          />
          <Route
            path="/auth"
            element={(() => {
              const hash =
                typeof window !== "undefined" ? window.location.hash : "";
              const hashParams = new URLSearchParams(hash.replace("#", "?"));
              const isEmailConfirm =
                hashParams.get("type") === "signup" ||
                hashParams.get("type") === "magiclink";
              
              const { isBanned, isMaintenance } = useAuth();
              
              if (user && !isEmailConfirm && !isBanned && !isMaintenance)
                return <Navigate to={home} replace />;
              return <Auth />;
            })()}
          />
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
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Dashboard />
                )}
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Inventory />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/sells"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Sells />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Reports />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Analytics />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Trash />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <WalletPage />
                )}
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <ServicesManagement />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/enterprise"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <EnterpriseModules />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-diagnostics"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <AiDiagnosticCenter />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketing"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <MarketingDashboard />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <StaffManagement />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/financials"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Financials />
                )}
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/branches"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Branches />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Expenses />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Loyalty />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                {isSuperAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <BookingsAdmin />
                )}
              </ProtectedRoute>
            }
          />
          <Route path="/book/:slug" element={<PublicBooking />} />
          {/* Marketplace (public browse) */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<ListingDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-listings" element={<ProtectedRoute><SellerListings /></ProtectedRoute>} />
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
