import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { motion } from "framer-motion";

import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { MobileBottomNav } from "./MobileBottomNav";
import { InstallPWAPrompt } from "@/components/common/InstallPWAPrompt";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { SyncStatus } from "@/components/common/SyncStatus";
import { CommandPalette } from "@/components/common/CommandPalette";
import { QuickActionFAB } from "@/components/common/QuickActionFAB";
import { DailySummaryNotifier } from "@/components/common/DailySummaryNotifier";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: LayoutProps) {
  return (
    <SidebarProvider>
      <OfflineBanner />
      <div className="h-screen flex w-full bg-background/95 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <header className="h-16 shrink-0 flex items-center justify-between border-b bg-card/50 backdrop-blur-md px-6 z-10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-accent transition-colors" />
              {title && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-[2px] bg-primary/20 rounded-full hidden md:block" />
                  <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    {title}
                  </h1>
                </div>
              )}
            </div>
            <Header />
          </header>
          <main className="flex-1 p-6 lg:p-8 pb-32 md:pb-8 overflow-y-auto relative scrollbar-thin scrollbar-thumb-primary/20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
          {/* Chatbot mounted globally in App.tsx */}
          <WhatsAppButton />
          <InstallPWAPrompt />
          <SyncStatus />
          <CommandPalette />
          <QuickActionFAB />
          <DailySummaryNotifier />
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
