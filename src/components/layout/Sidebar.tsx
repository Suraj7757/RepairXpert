import { useLocation, useNavigate } from "react-router-dom";
import { SidebarNavLink } from "./SidebarNavLink";
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Wrench,
  IndianRupee,
  ArrowLeftRight,
  Package,
  ShoppingCart,
  ShoppingBag,
  Heart,
  FileText,
  Settings,
  Trash2,
  Smartphone,
  MessageCircle,
  Wallet,
  Shield,
  Crown,
  ConciergeBell,
  Bell,
  Building2,
  PlusCircle,
  X,
  BarChart3,
  Gift,
  CalendarCheck,
  TrendingDown,
  BrainCircuit,
  Megaphone,
  LogOut,
  Home,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_WHATSAPP = "917319884599";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Repair Jobs", url: "/jobs", icon: Wrench },
  { title: "Track Order", url: "/track", icon: Smartphone },
  { title: "Payments", url: "/payments", icon: IndianRupee },
  { title: "Settlements", url: "/settlements", icon: ArrowLeftRight },
];

const secondaryItems = [
  { title: "Services", url: "/services", icon: ConciergeBell },
  { title: "AI Diagnostic", url: "/ai-diagnostics", icon: BrainCircuit },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Sells", url: "/sells", icon: ShoppingCart },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
  { title: "My Listings", url: "/my-listings", icon: Package },
  { title: "Seller Orders", url: "/seller-orders", icon: ShoppingCart },
  { title: "Bookings", url: "/bookings", icon: CalendarCheck },
  { title: "Loyalty", url: "/loyalty", icon: Gift },
  { title: "Branches", url: "/branches", icon: Building2 },
  { title: "Expenses", url: "/expenses", icon: TrendingDown },
  { title: "Staff", url: "/staff", icon: Users },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Subscription", url: "/subscription", icon: Crown },
  { title: "Financials", url: "/financials", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Enterprise ERP", url: "/enterprise", icon: Building2 },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Trash", url: "/trash", icon: Trash2 },
];

const customerItems = [
  { title: "Home", url: "/customer", icon: Home },
  { title: "Browse Shop", url: "/marketplace", icon: ShoppingBag },
  { title: "My Cart", url: "/cart", icon: ShoppingCart },
  { title: "My Orders", url: "/my-orders", icon: Package },
  { title: "Track Order", url: "/track", icon: Smartphone },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface SidebarLink {
  to: string;
  label: string;
  icon?: any;
}

interface SidebarProps {
  links?: SidebarLink[];
}

export function Sidebar({ links = [] }: SidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
  const collapsed = state === "collapsed";
  const [createOpen, setCreateOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const getGroupedLinks = () => {
    if (role === "super_admin") {
      return [
        {
          label: "Platform",
          items: [
            { to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
            { to: "/admin#applications", label: "Shop Applications", icon: Store },
            { to: "/admin#users", label: "Users", icon: Users },
            { to: "/admin#payments", label: "Payments", icon: IndianRupee },
            { to: "/admin#promos", label: "Promo Codes", icon: Gift },
            { to: "/admin#ads", label: "Ads", icon: Megaphone },
          ],
        },
        {
          label: "Developer",
          items: [
            { to: "/dev-panel", label: "Developer Panel", icon: Shield },
            { to: "/settings", label: "Settings", icon: Settings },
          ],
        },
      ];
    } else if (role === "customer") {
      return [
        {
          label: "Customer Hub",
          items: [
            { to: "/customer", label: "Dashboard", icon: Home },
            { to: "/customer/marketplace", label: "Browse Shop", icon: ShoppingBag },
            { to: "/customer/cart", label: "My Cart", icon: ShoppingCart },
            { to: "/customer/orders", label: "My Orders", icon: Package },
            { to: "/customer/bookings", label: "My Bookings", icon: CalendarCheck },
            { to: "/customer/book", label: "Book a Repair", icon: Wrench },
            { to: "/customer/ai-diagnostic", label: "AI Diagnostic", icon: BrainCircuit },
            { to: "/track", label: "Track Order", icon: Smartphone },
          ],
        },
        {
          label: "Account",
          items: [
            { to: "/customer/wallet", label: "Wallet & Rewards", icon: Wallet },
            { to: "/become-shopkeeper", label: "Become a Shopkeeper", icon: Store },
            { to: "/customer/settings", label: "Settings", icon: Settings },
          ],
        },
      ];

    } else {
      // shopkeeper or staff
      const rawGroups = [
        {
          label: "Core Operations",
          items: [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/jobs", label: "Jobs", icon: Wrench },
            { to: "/customers", label: "Customers", icon: Users },
            { to: "/notifications", label: "Notifications", icon: Bell },
          ],
        },
        {
          label: "Sales & Stock",
          items: [
            { to: "/inventory", label: "Inventory", icon: Package },
            { to: "/sells", label: "Sells", icon: ShoppingCart },
            { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
            { to: "/invoices", label: "Invoices", icon: FileText },
          ],
        },
        {
          label: "Financials & Wallet",
          items: [
            { to: "/payments", label: "Payments", icon: IndianRupee },
            { to: "/settlements", label: "Settlements", icon: ArrowLeftRight },
            { to: "/expenses", label: "Expenses", icon: TrendingDown },
            { to: "/wallet", label: "Wallet", icon: Wallet },
          ],
        },
        {
          label: "Smart Tools",
          items: [
            { to: "/ai-diagnostics", label: "AI Diagnostic", icon: BrainCircuit },
            { to: "/bookings", label: "Bookings", icon: CalendarCheck },
            { to: "/loyalty", label: "Loyalty Points", icon: Gift },
          ],
        },
        {
          label: "System & Admin",
          items: [
            { to: "/staff", label: "Staff Management", icon: Users },
            { to: "/branches", label: "Branches", icon: Building2 },
            { to: "/subscription", label: "Subscription", icon: Crown },
            { to: "/settings", label: "Settings", icon: Settings },
            { to: "/trash", label: "Trash", icon: Trash2 },
          ],
        },
      ];

      if (role === "staff") {
        const forbidden = [
          "/staff",
          "/subscription",
          "/expenses",
          "/settlements",
          "/wallet",
          "/financials",
          "/reports",
          "/analytics",
          "/enterprise",
        ];
        const staffGroups = [
          {
            label: "My Work",
            items: [
              { to: "/staff-dashboard", label: "My Dashboard", icon: LayoutDashboard },
              { to: "/jobs", label: "My Jobs", icon: Wrench },
              { to: "/staff-earnings", label: "My Earnings", icon: IndianRupee },
            ],
          },
          ...rawGroups
            .map((group) => ({
              ...group,
              items: group.items.filter((item) => !forbidden.includes(item.to) && item.to !== "/dashboard"),
            }))
            .filter((group) => group.items.length > 0),
        ];
        return staffGroups;
      }
      return rawGroups;
    }
  };
  const performLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/auth", { replace: true });
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent("Hello, I need help with Servixo")}`,
      "_blank",
    );
  };

  const handleCreate = (type: "job" | "sell" | "customer" | "inventory") => {
    setCreateOpen(false);
    if (type === "job") navigate("/jobs#new");
    else if (type === "sell") navigate("/sells#new");
    else if (type === "customer") navigate("/customers#new");
    else if (type === "inventory") navigate("/inventory#new");
  };

  return (
    <>
      <BaseSidebar
        collapsible="icon"
        className="border-r border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]"
      >
        <SidebarContent className="bg-sidebar pt-6">
          {/* Logo */}
          <div
            className={`px-6 pb-6 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <Wrench className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
                  Servixo
                </span>
                <span className="text-[10px] text-sidebar-muted font-medium uppercase tracking-widest">
                  v3.0 Pro
                </span>
              </div>
            )}
          </div>

          {/* Quick Action for Shopkeepers */}
          {role === "shopkeeper" && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-6 text-sidebar-muted/50 text-[10px] font-bold uppercase tracking-widest mb-2">
                Quick Action
              </SidebarGroupLabel>
              <div className="px-3 mb-1">
                <button
                  onClick={() => setCreateOpen(true)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all ${collapsed ? "justify-center" : ""}`}
                >
                  <PlusCircle className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>+ Create New</span>}
                </button>
              </div>
            </SidebarGroup>
          )}

          {/* Render Dynamic Grouped Links */}
          {(() => {
            const groups = getGroupedLinks();
            return groups.map((group, gIdx) => (
              <SidebarGroup key={group.label} className={gIdx > 0 ? "mt-4" : "mt-2"}>
                {!collapsed && (
                  <SidebarGroupLabel className="px-6 text-sidebar-muted/50 text-[10px] font-bold uppercase tracking-widest mb-2">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu className="px-3">
                  {group.items.map((item) => (
                    <SidebarNavLink
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      active={location.pathname === item.to}
                      collapsed={collapsed}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ));
          })()}

          <SidebarGroup className="mt-auto pb-8">
            <SidebarGroupLabel className="px-6 text-sidebar-muted/50 text-[10px] font-bold uppercase tracking-widest mb-2">
              Support
            </SidebarGroupLabel>
            <SidebarMenu className="px-3">
              <button
                onClick={() => window.dispatchEvent(new Event("open-rx-chatbot"))}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 group w-full ${collapsed ? "justify-center" : ""}`}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                </div>
                {!collapsed && (
                  <span className="font-medium">AI Support Chat</span>
                )}
              </button>
              <button
                onClick={openWhatsApp}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 group w-full mt-1 ${collapsed ? "justify-center" : ""}`}
              >
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                </div>
                {!collapsed && (
                  <span className="font-medium">WhatsApp Help</span>
                )}
              </button>
              <button
                onClick={() => setLogoutConfirmOpen(true)}
                className={`md:hidden flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all duration-200 group w-full mt-1 ${collapsed ? "justify-center" : ""}`}
              >
                <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 group-hover:bg-destructive/20 transition-colors">
                  <LogOut className="h-4 w-4 text-destructive" />
                </div>
                {!collapsed && <span className="font-medium">Logout</span>}
              </button>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </BaseSidebar>

      {/* Create Popup Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl bg-transparent">
          <AnimatePresence>
            {createOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-card rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <div className="gradient-primary p-6 text-center relative">
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="absolute right-4 top-4 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="text-xl font-black text-primary-foreground tracking-tight">
                      Quick Action Center
                    </h2>
                    <p className="text-xs text-primary-foreground/70 mt-1 font-medium">
                      What would you like to do today?
                    </p>
                  </motion.div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    {
                      id: "job",
                      label: "Repair Job",
                      sub: "New repair case",
                      icon: Wrench,
                      color: "text-primary",
                      bg: "bg-primary/10",
                    },
                    {
                      id: "sell",
                      label: "New Sale",
                      sub: "Sell an item",
                      icon: ShoppingCart,
                      color: "text-emerald-600",
                      bg: "bg-emerald-500/10",
                    },
                    {
                      id: "customer",
                      label: "Customer",
                      sub: "Add new client",
                      icon: Users,
                      color: "text-blue-600",
                      bg: "bg-blue-500/10",
                    },
                    {
                      id: "inventory",
                      label: "Inventory",
                      sub: "Add stock item",
                      icon: Package,
                      color: "text-amber-600",
                      bg: "bg-amber-500/10",
                    },
                  ].map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      onClick={() => handleCreate(item.id as any)}
                      className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-transparent bg-muted/30 hover:bg-muted hover:border-primary/20 hover:shadow-lg transition-all group"
                    >
                      <div
                        className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                      >
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm tracking-tight">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {item.sub}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="px-6 pb-6 pt-2">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          Track Status
                        </p>
                        <p className="text-xs font-medium text-muted-foreground">
                          Quickly find a job
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl font-bold"
                      onClick={() => {
                        setCreateOpen(false);
                        navigate("/track");
                      }}
                    >
                      Go
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout from Servixo?</AlertDialogTitle>
            <AlertDialogDescription>
              Aap apne account se logout ho jayenge. Dobara login karne ke liye email aur password chahiye hoga.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
