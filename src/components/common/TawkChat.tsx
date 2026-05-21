import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function TawkChat() {
  const { accountType, isSuperAdmin, user } = useAuth();

  useEffect(() => {
    // Only show for customers and shopkeepers (not super admins or unauthenticated users)
    if (!user || isSuperAdmin) {
      // If Tawk API exists, hide the widget
      if (window.Tawk_API) {
        window.Tawk_API.hideWidget();
      }
      return;
    }

    const tawkPropertyId = import.meta.env.VITE_TAWK_PROPERTY_ID || "default_property_id";
    const tawkWidgetId = import.meta.env.VITE_TAWK_WIDGET_ID || "default";

    // Prevent duplicate scripts
    if (document.getElementById("tawk-script")) {
      if (window.Tawk_API) {
        window.Tawk_API.showWidget();
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "tawk-script";
    script.async = true;
    script.src = `https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount or role change
      if (window.Tawk_API) {
        window.Tawk_API.hideWidget();
      }
    };
  }, [user, isSuperAdmin, accountType]);

  return null;
}

// Add TypeScript declaration for Tawk API
declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}
