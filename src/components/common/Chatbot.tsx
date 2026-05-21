import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  User,
  Bot,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SUPPORT_WHATSAPP = "7319884599";
const SUPPORT_EMAIL = "krs715665@gmail.com";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste! 🙏 Mai **RepairXpert AI Assistant** hu. Repair sawal, parts cost, ya app feature — kuch bhi puchein.\n\n**Try karein:**\n- *Samsung M31 charging issue*\n- *Mera tracking ID JSAM0042K9X kaha hai?*\n- *New job kaise banaye?*\n- *Subscription kaise renew karu?*",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-rx-chatbot", handleOpen);
    return () => window.removeEventListener("open-rx-chatbot", handleOpen);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    // Last 10 messages for context
    const history = [...messages, userMsg]
      .slice(-10)
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    let assistantText = "";
    const assistantId = crypto.randomUUID();

    const upsertAssistant = (chunk: string) => {
      assistantText += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) {
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantText } : m,
          );
        }
        return [
          ...prev,
          { id: assistantId, role: "assistant", content: assistantText },
        ];
      });
    };

    try {
      abortRef.current = new AbortController();
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are RepairXpert AI, a helpful and professional CRM assistant for repair shops. You answer in concise Hindi-English mix (Hinglish) or English. You help users understand how to manage jobs, inventory, sales, and track repairs.",
            },
            ...history,
          ],
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const text = await response.text();
      upsertAssistant(text);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error("Chat error:", e);
        toast.error("Connection error. Try again.");
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  return (
<<<<<<< HEAD
    <div
      className={cn(
        "fixed z-50 flex-col items-end",
        isOpen
          ? "inset-0 flex bg-background/80 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none sm:inset-auto sm:bottom-6 sm:right-6"
          : "hidden md:flex bottom-6 right-6"
      )}
    >
=======
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 flex-col items-end">
>>>>>>> c408fdbab0c70d405e0ef64a0ca7825de86b9241
      {isOpen && (
        <Card className="w-full h-full sm:h-auto sm:w-96 sm:mb-4 shadow-2xl border-primary/10 animate-in slide-in-from-bottom-5 duration-300 overflow-hidden flex flex-col justify-between">
          <CardHeader className="gradient-primary p-4 flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-white">
                  RepairXpert AI
                </CardTitle>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-white/70 font-medium">
                    {isStreaming ? "Soch raha hu..." : "Powered by AI"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent
            className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 bg-slate-50"
            ref={scrollRef}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-start gap-2 max-w-[85%]",
                  m.role === "user" ? "ml-auto flex-row-reverse" : "",
                )}
              >
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-1",
                    m.role === "assistant"
                      ? "bg-primary/10 text-primary"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    <Bot className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <div
                  className={cn(
                    "p-3 rounded-2xl text-[13px] shadow-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-white text-slate-700 rounded-tl-none border border-slate-100 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-slate-900"
                      : "bg-primary text-primary-foreground rounded-tr-none",
                  )}
                >
                  {m.role === "assistant" ? (
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-100 rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 bg-white border-t shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full items-center gap-2"
            >
              <Input
                placeholder="Apna repair sawal puchein..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
                className="flex-1 h-10 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 text-[13px]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isStreaming || !input.trim()}
                className="h-10 w-10 shrink-0 rounded-full shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
          <div className="px-4 py-2 bg-slate-50 border-t flex justify-center gap-4 shrink-0">
            <a
              href={`https://wa.me/91${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium text-slate-500 hover:text-green-600 flex items-center gap-1.5 transition-colors"
            >
              <Phone className="h-3 w-3" /> WhatsApp
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[11px] font-medium text-slate-500 hover:text-primary flex items-center gap-1.5 transition-colors"
            >
              <Mail className="h-3 w-3" /> Email
            </a>
          </div>
        </Card>
      )}
      {!isOpen && (
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 gradient-primary hidden md:flex"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
