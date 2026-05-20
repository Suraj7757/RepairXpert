import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Wrench,
  IndianRupee,
  ArrowLeftRight,
  Package,
  ShoppingCart,
  ShoppingBag,
  Settings,
  Trash2,
  Home,
  BrainCircuit,
  Gift,
  Building2,
  TrendingDown,
  Wallet,
  Crown,
  BarChart3,
  FileText
} from "lucide-react";

export function SharedLayout() {
  const { role } = useAuth();

  const superAdminLinks = [
    { to: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/super-admin/shops", label: "Shops", icon: Building2 },
    { to: "/super-admin/users", label: "Users", icon: Users },
    { to: "/super-admin/settings", label: "Settings", icon: Settings },
  ];

  const shopkeeperLinks = [
    { to: "/shop", label: "Dashboard", icon: LayoutDashboard },
    { to: "/shop/customers", label: "Customers", icon: Users },
    { to: "/shop/jobs", label: "Jobs", icon: Wrench },
    { to: "/shop/inventory", label: "Inventory", icon: Package },
    { to: "/shop/sells", label: "Sells", icon: ShoppingCart },
    { to: "/shop/payments", label: "Payments", icon: IndianRupee },
    { to: "/shop/settlements", label: "Settlements", icon: ArrowLeftRight },
    { to: "/shop/loyalty", label: "Loyalty", icon: Gift },
    { to: "/shop/branches", label: "Branches", icon: Building2 },
    { to: "/shop/expenses", label: "Expenses", icon: TrendingDown },
    { to: "/shop/staff", label: "Staff", icon: Users },
    { to: "/shop/wallet", label: "Wallet", icon: Wallet },
    { to: "/shop/subscription", label: "Subscription", icon: Crown },
    { to: "/shop/financials", label: "Financials", icon: BarChart3 },
    { to: "/shop/reports", label: "Reports", icon: FileText },
    { to: "/shop/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/shop/settings", label: "Settings", icon: Settings },
    { to: "/shop/trash", label: "Trash", icon: Trash2 },
  ];

  const customerLinks = [
    { to: "/customer", label: "Dashboard", icon: Home },
    { to: "/customer/marketplace", label: "Browse Shop", icon: ShoppingBag },
    { to: "/customer/ai-diagnostic", label: "AI Diagnostic", icon: BrainCircuit },
    { to: "/customer/orders", label: "My Orders", icon: Package },
    { to: "/customer/settings", label: "Settings", icon: Settings },
  ];

  const getLinks = () => {
    switch (role) {
      case "super_admin":
        return superAdminLinks;
      case "shopkeeper":
        return shopkeeperLinks;
      case "customer":
        return customerLinks;
      default:
        return [];
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background/50 dark:bg-slate-950/50">
        <Sidebar links={getLinks()} />
        <main className="flex-1 overflow-x-hidden p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
