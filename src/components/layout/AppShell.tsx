"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import FloatingActionDock from "@/components/layout/FloatingActionDock";
import SmartFamilyCenter from "@/components/layout/SmartFamilyCenter";
import TopNavigation from "@/components/layout/TopNavigation";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";
import { useLanguage } from "@/i18n/useLanguage";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const { direction, language } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main
      id="main-content"
      dir={direction}
      lang={language}
      className="app-premium min-h-screen overflow-x-hidden bg-[#f6f7f9] text-[#1d1d1f]"
    >
      <FeedbackProvider>
        <TopNavigation
          isSidebarCollapsed={isSidebarCollapsed}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleSidebar={() =>
            setIsSidebarCollapsed((currentValue) => !currentValue)
          }
          onToggleMobileMenu={() =>
            setIsMobileMenuOpen((currentValue) => !currentValue)
          }
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        <div className="mx-auto flex w-full max-w-[1480px] gap-2.5 px-3 pb-4 pt-16 sm:px-4 lg:pt-[4.25rem]">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            isMobileOpen={isMobileMenuOpen}
            onNavigate={() => setIsMobileMenuOpen(false)}
          />

          <div className="min-w-0 flex-1 animate-soft-in">{children}</div>

          <SmartFamilyCenter />
        </div>

        <FloatingActionDock />
      </FeedbackProvider>
    </main>
  );
}
