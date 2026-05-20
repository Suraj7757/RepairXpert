import { Link } from "react-router-dom";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  collapsed: boolean;
}

export function SidebarNavLink({
  to,
  icon: Icon,
  label,
  active,
  collapsed,
}: SidebarNavLinkProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn(
          "group relative transition-all duration-200 hover:translate-x-0.5",
          active &&
            "bg-sidebar-primary/15 text-sidebar-primary-foreground font-semibold shadow-sm",
          !active && "hover:bg-sidebar-accent/60",
        )}
      >
        <Link
          to={to}
          onClick={(e) => {
            if (to === "/track") {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("open-rx-track"));
            }
          }}
          className="flex items-center gap-3"
        >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-sidebar-primary" />
          )}
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
              active && "text-sidebar-primary",
            )}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
