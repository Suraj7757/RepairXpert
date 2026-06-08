import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function WhatsAppBusinessCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [cfg, setCfg] = useState<any>({
    phone_number_id: "",
    access_token: "",
    business_account_id: "",
    template_received: "job_received",
    template_in_progress: "job_in_progress",
    template_ready: "job_ready",
    template_delivered: "job_delivered",
    enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [testTo, setTestTo] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("whatsapp_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setCfg(data);
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const payload = { ...cfg, user_id: user.id };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    const { error } = await (supabase as any)
      .from("whatsapp_config")
      .upsert(payload, { onConflict: "user_id" });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("whatsapp.saved"));
  };

  const sendTest = async () => {
    if (!testTo) {
      toast.error("Enter a number first");
      return;
    }
    const { data, error } = await supabase.functions.invoke("whatsapp-send", {
      body: {
        to: testTo,
        type: "test",
        message: "Test message from RepairXpert WhatsApp Business setup ✅",
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if ((data as any)?.error) {
      toast.error((data as any).error);
      return;
    }
    toast.success(t("whatsapp.testSent"));
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-500" />{" "}
          {t("whatsapp.title")}
        </CardTitle>
        <CardDescription>{t("whatsapp.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="wa-enabled">{t("whatsapp.enabled")}</Label>
          <Switch
            id="wa-enabled"
            checked={cfg.enabled}
            onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>{t("whatsapp.phoneNumberId")}</Label>
            <Input
              value={cfg.phone_number_id}
              onChange={(e) =>
                setCfg({ ...cfg, phone_number_id: e.target.value })
              }
            />
          </div>
          <div>
            <Label>{t("whatsapp.businessAccountId")}</Label>
            <Input
              value={cfg.business_account_id || ""}
              onChange={(e) =>
                setCfg({ ...cfg, business_account_id: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <Label>{t("whatsapp.accessToken")}</Label>
          <Input
            type="password"
            value={cfg.access_token}
            onChange={(e) => setCfg({ ...cfg, access_token: e.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("whatsapp.setupGuide")}
        </p>
        <Button onClick={save} className="w-full">
          {t("common.save")}
        </Button>

        <div className="border-t pt-3 space-y-2">
          <Label>{t("whatsapp.testSend")}</Label>
          <div className="flex gap-2">
            <Input
              placeholder="+919876543210"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
            <Button variant="outline" onClick={sendTest}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
