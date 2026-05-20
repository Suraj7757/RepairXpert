import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import TrackOrder from "./TrackOrder";
import { useState, useEffect } from "react";

export function TrackOrderModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialId, setInitialId] = useState("");

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ id?: string }>;
      const trackingId = customEvent.detail?.id || "";
      setInitialId(trackingId);
      setOpen(true);
    };

    window.addEventListener("open-rx-track", handleOpen);
    return () => window.removeEventListener("open-rx-track", handleOpen);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
        <div className="max-h-[90vh] overflow-y-auto rounded-3xl bg-background shadow-2xl ring-1 ring-white/10 mx-auto w-full max-w-lg">
          <TrackOrder isModal initialId={initialId} onClose={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
