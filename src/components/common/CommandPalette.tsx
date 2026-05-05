import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  Wrench,
  CreditCard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings as SettingsIcon,
  Store,
  Wallet,
  Trash2,
  Sparkles,
} from "lucide-react";

const ROUTES: { label: string; path: string; icon: any; keywords?: string }[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Repair Jobs", path: "/jobs", icon: Wrench, keywords: "repairs orders tickets" },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Inventory", path: "/inventory", icon: Package, keywords: "stock parts" },
  { label: "Sells", path: "/sells", icon: ShoppingCart, keywords: "sales pos" },
  { label: "Analytics", path: "/analytics", icon: BarChart3, keywords: "reports stats" },
  { label: "Marketplace", path: "/marketplace", icon: Store, keywords: "shop browse listings" },
  { label: "My Orders", path: "/my-orders", icon: ShoppingCart },
  { label: "Wallet", path: "/wallet", icon: Wallet, keywords: "money earnings" },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
  { label: "Trash", path: "/trash", icon: Trash2, keywords: "deleted recycle bin" },
  { label: "AI Diagnostics", path: "/ai-diagnostics", icon: Sparkles, keywords: "ai assistant" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions… (⌘K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {ROUTES.map((r) => {
            const Icon = r.icon;
            return (
              <CommandItem
                key={r.path}
                value={`${r.label} ${r.keywords || ""}`}
                onSelect={() => go(r.path)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{r.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => go("/jobs?new=1")}>
            <Wrench className="mr-2 h-4 w-4" /> New Repair Job
          </CommandItem>
          <CommandItem onSelect={() => go("/sells?new=1")}>
            <ShoppingCart className="mr-2 h-4 w-4" /> New Sell
          </CommandItem>
          <CommandItem onSelect={() => go("/payments?new=1")}>
            <CreditCard className="mr-2 h-4 w-4" /> Receive Payment
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
