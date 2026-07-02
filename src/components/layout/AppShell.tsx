"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import BirthdayWelcomePopup from "@/components/birthdays/BirthdayWelcomePopup";
import FloatingActionDock from "@/components/layout/FloatingActionDock";
import SmartFamilyCenter from "@/components/layout/SmartFamilyCenter";
import SmartNudgePopup from "@/components/layout/SmartNudgePopup";
import TopNavigation from "@/components/layout/TopNavigation";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";
import { useLanguage } from "@/i18n/useLanguage";

type AppShellProps = {
  children: ReactNode;
};

const sidebarCollapsedStorageKey = "nestly-sidebar-collapsed";
const mobileMenuOpenStorageKey = "nestly-mobile-menu-open";

function getStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const storedValue = window.localStorage.getItem(key);

  if (storedValue === null) {
    return fallback;
  }

  return storedValue === "true";
}

function persistBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, String(value));
}

export default function AppShell({ children }: AppShellProps) {
  const { direction, language } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    getStoredBoolean(sidebarCollapsedStorageKey, false)
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(() =>
    getStoredBoolean(mobileMenuOpenStorageKey, false)
  );

  function toggleSidebar() {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      persistBoolean(sidebarCollapsedStorageKey, nextValue);
      return nextValue;
    });
  }

  function toggleMobileMenu() {
    setIsMobileMenuOpen((currentValue) => {
      const nextValue = !currentValue;
      persistBoolean(mobileMenuOpenStorageKey, nextValue);
      return nextValue;
    });
  }

  function closeMobileMenu() {
    persistBoolean(mobileMenuOpenStorageKey, false);
    setIsMobileMenuOpen(false);
  }

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
          onToggleSidebar={toggleSidebar}
          onToggleMobileMenu={toggleMobileMenu}
          onCloseMobileMenu={closeMobileMenu}
        />

        <div className="mx-auto flex w-full max-w-[1480px] gap-2.5 px-3 pb-4 pt-16 sm:px-4 lg:pt-[4.25rem]">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            isMobileOpen={isMobileMenuOpen}
            onNavigate={closeMobileMenu}
          />

          <div className="min-w-0 flex-1 animate-soft-in">{children}</div>

          <SmartFamilyCenter />
        </div>

        <FloatingActionDock />
        <SmartNudgePopup />
        <BirthdayWelcomePopup />
      </FeedbackProvider>
    </main>
  );
}
