import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "rx-pwa-dismissed";

export function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 bg-card border border-primary/20 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install RepairXpert</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Home screen pe add karein, app jaise use karein — fast & offline.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={install} className="h-8 text-xs">
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="h-8 text-xs"
            >
              Baad me
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
