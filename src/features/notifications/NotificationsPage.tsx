import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  CreditCard,
  Wrench,
  UserPlus,
  RotateCcw,
  Package,
  Clock,
  Inbox,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: "payment" | "job" | "customer" | "refund" | "inventory";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  payment: { icon: CreditCard, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-950/30" },
  job: { icon: Wrench, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/30" },
  customer: { icon: UserPlus, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/30" },
  refund: { icon: RotateCcw, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950/30" },
  inventory: { icon: Package, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/30" },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { user, role, shopId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const targetUserId = role === "staff" && shopId ? shopId : user?.id;

  const loadNotifications = async () => {
    if (!targetUserId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
    } else if (data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!targetUserId) return;
    loadNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  const handleMarkAsRead = async (id: string) => {
    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      toast.success("Notification marked as read");
    }
  };

  const handleMarkAllRead = async () => {
    if (!targetUserId) return;
    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("user_id", targetUserId)
      .eq("read", false);
    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from("notifications")
      .delete()
      .eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    }
  };

  const handleClearAll = async () => {
    if (!targetUserId) return;
    if (!confirm("Are you sure you want to clear all notification history?")) return;
    const { error } = await (supabase as any)
      .from("notifications")
      .delete()
      .eq("user_id", targetUserId);
    if (!error) {
      setNotifications([]);
      toast.success("All notifications cleared");
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MainLayout title="Notifications">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Controls Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/45 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="rounded-xl font-bold text-xs"
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
              className="rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary/20 text-primary border-0 font-bold px-1.5 py-0.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("read")}
              className="rounded-xl font-bold text-xs"
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="rounded-xl border-white/10 font-bold text-xs flex items-center gap-1.5"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 font-bold text-xs flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-16 bg-card/20 rounded-3xl border border-dashed border-white/10">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-bold text-foreground">No Notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === "unread" ? "You have read all notifications." : "Your inbox is empty."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.job;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`border-white/10 transition-all duration-300 ${
                        !n.read
                          ? "bg-violet-500/[0.04] dark:bg-violet-500/[0.02] border-violet-500/20 shadow-md"
                          : "bg-card/50 backdrop-blur-sm"
                      }`}
                    >
                      <CardContent className="p-4 flex items-start gap-4">
                        {/* Type Icon */}
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <Icon className={`h-5 w-5 ${cfg.color}`} />
                        </div>

                        {/* Title & message */}
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className={`text-sm font-bold tracking-tight text-foreground ${!n.read ? "font-black" : "font-medium"}`}>
                              {n.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold shrink-0">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatTime(n.created_at)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {n.message}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 self-center shrink-0">
                          {!n.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(n.id)}
                              className="h-8 rounded-lg text-xs font-bold text-primary hover:bg-primary/10"
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(n.id)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
