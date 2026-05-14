import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useShopSettings } from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import {
  Save,
  Store,
  Percent,
  QrCode,
  Lock,
  User,
  Palette,
  Sun,
  Moon,
  Mail,
  Copy,
} from "lucide-react";
import { AutomationSettingsCard } from "./AutomationSettingsCard";
import { WhatsAppBusinessCard } from "./WhatsAppBusinessCard";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function Settings() {
  const { user } = useAuth();
  const { settings, loading, saveSettings, refetch } = useShopSettings();
  const { theme, setTheme } = useTheme();

  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [adminShare, setAdminShare] = useState("100");
  const [staffShare, setStaffShare] = useState("0");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [qrReceivers, setQrReceivers] = useState<string[]>(["Admin QR"]);
  const [mapLat, setMapLat] = useState("");
  const [mapLng, setMapLng] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [shopTrackingId, setShopTrackingId] = useState("");

  useEffect(() => {
    if (settings) {
      setShopName(settings.shop_name || "");
      setPhone(settings.phone || "");
      setAddress(settings.address || "");
      setGstin(settings.gstin || "");
      setAdminShare(String(settings.admin_share_percent ?? 100));
      setStaffShare(String(settings.staff_share_percent ?? 0));
      setSplitEnabled(settings.revenue_split_enabled === true);
      setUpiId(settings.upi_id || "");
      setQrReceivers(
        settings.qr_receivers && settings.qr_receivers.length > 0
          ? settings.qr_receivers
          : ["Admin QR"],
      );
      setMapLat(settings.map_lat != null ? String(settings.map_lat) : "");
      setMapLng(settings.map_lng != null ? String(settings.map_lng) : "");
      setMapUrl((settings as any).map_url || "");
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      setDisplayName(
        user.user_metadata?.display_name || user.email?.split("@")[0] || "",
      );
      setMobile(user.user_metadata?.mobile || "");
      supabase
        .from("profiles")
        .select("tracking_id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data && data.tracking_id) setShopTrackingId(data.tracking_id);
        });
    }
  }, [user]);

  const handleSaveShop = async () => {
    const ok = await saveSettings({
      shop_name: shopName,
      phone,
      address,
      gstin,
      admin_share_percent: parseInt(adminShare) || 100,
      staff_share_percent: parseInt(staffShare) || 0,
      revenue_split_enabled: splitEnabled,
      qr_receivers: qrReceivers.filter((q) => q.trim()),
      upi_id: upiId,
      map_lat: mapLat ? parseFloat(mapLat) : null,
      map_lng: mapLng ? parseFloat(mapLng) : null,
      map_url: mapUrl,
    });
    if (ok) toast.success("Shop settings saved");
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Name is required");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName, mobile },
    });
    if (error) toast.error(error.message);
    else {
      if (user) {
        await supabase
          .from("profiles")
          .update({ display_name: displayName })
          .eq("user_id", user.id);
      }
      toast.success("Profile updated");
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) toast.error(error.message);
    else {
      toast.success("Confirmation email sent to new address");
      setNewEmail("");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const updateQr = (index: number, value: string) => {
    const next = [...qrReceivers];
    next[index] = value;
    setQrReceivers(next);
  };

  const addQr = () => setQrReceivers([...qrReceivers, ""]);
  const removeQr = (index: number) =>
    setQrReceivers(qrReceivers.filter((_, i) => i !== index));

  if (loading)
    return (
      <MainLayout title="Settings">
        <p className="text-center p-8 text-muted-foreground">Loading...</p>
      </MainLayout>
    );

  return (
    <MainLayout title="Settings">
      <div className="space-y-6 animate-fade-in max-w-2xl">
        {/* Profile */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Shop Tracking ID (Unique ID)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={shopTrackingId || "Loading..."}
                  disabled
                  className="bg-muted font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(shopTrackingId);
                    toast.success("Tracking ID copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <Label>Registered Mobile Number</Label>
              <Input
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <Button size="sm" onClick={handleUpdateProfile}>
              <Save className="h-4 w-4 mr-1" /> Update Profile
            </Button>
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" /> Change Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>New Email</Label>
              <Input
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleChangeEmail}>
              <Mail className="h-4 w-4 mr-1" /> Update Email
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleChangePassword}>
              <Lock className="h-4 w-4 mr-1" /> Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Theme & Skins */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                Base Theme
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4 mr-1" /> Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4 mr-1" /> Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                >
                  System
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                Dashboard Skin
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: "default", name: "Midnight", color: "bg-[#4338ca]" },
                  { id: "emerald", name: "Emerald", color: "bg-[#059669]" },
                  { id: "rose", name: "Rose", color: "bg-[#e11d48]" },
                  { id: "default", name: "Standard", color: "bg-[#4338ca]" },
                  { id: "emerald", name: "Verdant", color: "bg-[#059669]" },
                  { id: "rose", name: "Crimson", color: "bg-[#e11d48]" },
                  { id: "amber", name: "Gold", color: "bg-[#d97706]" },
                  { id: "violet", name: "Royal", color: "bg-[#7c3aed]" },
                ].map((skin) => (
                  <Button
                    key={skin.id}
                    variant="outline"
                    className={`h-12 justify-start gap-2 ${localStorage.getItem("rx-skin") === skin.id ? "border-primary ring-2 ring-primary/20" : ""}`}
                    onClick={() => {
                      document.documentElement.setAttribute(
                        "data-skin",
                        skin.id,
                      );
                      localStorage.setItem("rx-skin", skin.id);
                      toast.success(`${skin.name} skin applied`);
                      refetch(); // Trigger re-render to update selection UI
                    }}
                  >
                    <div className={`h-4 w-4 rounded-full ${skin.color}`} />
                    <span className="text-xs">{skin.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                Dashboard Layout
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: "default", name: "Default" },
                  { id: "modern", name: "Modern Glass" },
                  { id: "compact", name: "Compact Data" },
                  { id: "spacious", name: "Spacious Airy" },
                ].map((layout) => (
                  <Button
                    key={layout.id}
                    variant="outline"
                    className={`h-10 justify-center gap-2 ${localStorage.getItem("rx-layout") === layout.id || (!localStorage.getItem("rx-layout") && layout.id === "default") ? "border-primary ring-2 ring-primary/20" : ""}`}
                    onClick={() => {
                      document.documentElement.setAttribute(
                        "data-layout",
                        layout.id,
                      );
                      localStorage.setItem("rx-layout", layout.id);
                      toast.success(`${layout.name} layout applied`);
                      refetch(); // Trigger re-render to update selection UI
                    }}
                  >
                    <span className="text-xs">{layout.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Info */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Store className="h-4 w-4" /> Shop Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Shop Name</Label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. RepairXpert Central"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label>GSTIN</Label>
                <Input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
              <Label className="text-sm font-semibold">📍 Shop Location (Map Pin)</Label>
              <p className="text-xs text-muted-foreground">Customers will see your exact location and directions on the marketplace.</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Latitude</Label>
                  <Input value={mapLat} onChange={(e) => setMapLat(e.target.value)} placeholder="e.g. 25.5941" />
                </div>
                <div>
                  <Label className="text-xs">Longitude</Label>
                  <Input value={mapLng} onChange={(e) => setMapLng(e.target.value)} placeholder="e.g. 85.1376" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Google Maps Link (optional)</Label>
                <Input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="https://maps.google.com/..." />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!navigator.geolocation) return toast.error("Geolocation not supported");
                  toast.info("Fetching your location...");
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const lat = pos.coords.latitude.toFixed(6);
                      const lng = pos.coords.longitude.toFixed(6);
                      setMapLat(lat);
                      setMapLng(lng);
                      setMapUrl(`https://www.google.com/maps?q=${lat},${lng}`);
                      toast.success("Location pinned!");
                    },
                    (err) => toast.error(err.message),
                    { enableHighAccuracy: true },
                  );
                }}
              >
                📌 Use My Current Location
              </Button>
            </div>
            <div>
              <Label>Business UPI ID (for Customer Payments)</Label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. name@upi"
              />
            </div>
          </CardContent>
        </Card>

        {/* Revenue Split */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Percent className="h-4 w-4" /> Revenue Split
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={splitEnabled}
                onCheckedChange={setSplitEnabled}
              />
              <span className="text-sm">
                {splitEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            {splitEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Admin Share %</Label>
                  <Input
                    type="number"
                    value={adminShare}
                    onChange={(e) => setAdminShare(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Staff Share %</Label>
                  <Input
                    type="number"
                    value={staffShare}
                    onChange={(e) => setStaffShare(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Receivers */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <QrCode className="h-4 w-4" /> QR Receivers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {qrReceivers.map((qr, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={qr}
                  onChange={(e) => updateQr(i, e.target.value)}
                  placeholder={`QR Receiver ${i + 1}`}
                />
                {qrReceivers.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeQr(i)}
                    className="shrink-0 text-destructive"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addQr}>
              + Add QR Receiver
            </Button>
          </CardContent>
        </Card>

        <AutomationSettingsCard />
        <WhatsAppBusinessCard />

        <Button className="w-full" onClick={handleSaveShop}>
          <Save className="h-4 w-4 mr-1" /> Save All Settings
        </Button>
      </div>
    </MainLayout>
  );
}
