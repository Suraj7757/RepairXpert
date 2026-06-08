import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const ADMIN_WHATSAPP = "7319884599";

export function WhatsAppButton() {
  const { user } = useAuth();

  const handleWhatsAppClick = () => {
    const text = user
      ? encodeURIComponent(
          `Hello, I need help with RepairXpert. My account email is ${user.email}`,
        )
      : encodeURIComponent("Hello, I need help with RepairXpert.");
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${text}`, "_blank");
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleWhatsAppClick}
      className="hidden md:flex fixed bottom-6 right-20 z-50 h-14 w-14 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/30 items-center justify-center hover:bg-green-600 transition-colors"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </motion.button>
  );
}
