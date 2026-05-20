import { useEffect, useState } from "react";
import { CloudUpload } from "lucide-react";
import { pendingCount, flushQueue } from "@/lib/offlineCache";

/**
 * Tiny status pill that shows pending offline writes and lets user retry.
 * Renders nothing when there is no queue.
 */
export function SyncStatus() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      const c = await pendingCount();
      if (mounted) setCount(c);
    };
    tick();
    const id = window.setInterval(tick, 3000);
    const onOnline = () => {
      flushQueue().then(tick);
    };
    window.addEventListener("online", onOnline);
    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <button
      onClick={() => flushQueue()}
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 inline-flex items-center gap-2 rounded-full bg-amber-500/95 hover:bg-amber-500 text-white shadow-lg px-3 py-1.5 text-xs font-bold animate-in fade-in slide-in-from-bottom"
      title="Pending sync — click to retry"
    >
      <CloudUpload className="h-3.5 w-3.5" />
      Syncing {count}
    </button>
  );
}
