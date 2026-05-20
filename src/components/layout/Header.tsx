import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  LogOut,
  Settings,
  Sun,
  Moon,
  Trash2,
  X,
  MessageSquare,
  Send,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { sender: string; text: string; time: string }[]
  >(() => {
    return JSON.parse(localStorage.getItem("admin_chats") || "[]");
  });
  const { theme, setTheme } = useTheme();

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg = {
      sender: user?.email || "Admin",
      text: message,
      time: new Date().toLocaleTimeString(),
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem("admin_chats", JSON.stringify(updated));
    setMessage("");
    toast.success("Message sent!");
  };

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "U";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <LanguageSwitcher />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <Popover open={chatOpen} onOpenChange={setChatOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <MessageSquare className="h-4 w-4" />
            {messages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b font-semibold text-sm bg-primary text-primary-foreground flex justify-between items-center">
            <span>Admin Community Chat</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              onClick={() => {
                setMessages([]);
                localStorage.removeItem("admin_chats");
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-3 bg-muted/20">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground mt-20">
                No messages yet. Say hello!
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.sender === user?.email ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-2xl text-xs ${m.sender === user?.email ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"}`}
                  >
                    <p className="font-bold opacity-70 mb-0.5 text-[9px]">
                      {m.sender === user?.email ? "You" : m.sender}
                    </p>
                    <p>{m.text}</p>
                    <p className="text-[8px] opacity-50 mt-1 text-right">
                      {m.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="h-9 text-xs"
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={sendMessage}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Phase 6: Realtime Notification Bell */}
      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity">
            {initial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await signOut();
              toast.success("Logged out successfully");
              navigate("/auth", { replace: true });
            }}
            className="text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
