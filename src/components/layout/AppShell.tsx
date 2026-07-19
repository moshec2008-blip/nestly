"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AuthPromptProvider from "@/components/auth/AuthPromptProvider";
import AuthStorageScope from "@/components/auth/AuthStorageScope";
import Sidebar from "@/components/Sidebar";
import BirthdayWelcomePopup from "@/components/birthdays/BirthdayWelcomePopup";
import CommandPalette from "@/components/command-palette/CommandPalette";
import UniversalInboxLauncher from "@/components/inbox/UniversalInboxLauncher";
import DemoModeBanner from "@/components/layout/DemoModeBanner";
import EnglishDomTranslator from "@/components/i18n/EnglishDomTranslator";
import FirstRunWelcomePopup from "@/components/layout/FirstRunWelcomePopup";
import MobileBottomNavigation from "@/components/layout/MobileBottomNavigation";
import SmartFamilyCenter from "@/components/layout/SmartFamilyCenter";
import SmartNudgePopup from "@/components/layout/SmartNudgePopup";
import StorageErrorWatcher from "@/components/layout/StorageErrorWatcher";
import TopNavigation from "@/components/layout/TopNavigation";
import AppPreferencesApplier from "@/components/settings/AppPreferencesApplier";
import TelemetryProvider from "@/components/telemetry/TelemetryProvider";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";
import { useLanguage } from "@/i18n/useLanguage";

type AppShellProps = {
  children: ReactNode;
};

const sidebarCollapsedStorageKey = "nestly-sidebar-collapsed";

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
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    getStoredBoolean(sidebarCollapsedStorageKey, false)
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function toggleSidebar() {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      persistBoolean(sidebarCollapsedStorageKey, nextValue);
      return nextValue;
    });
  }

  function toggleMobileMenu() {
    setIsMobileMenuOpen((currentValue) => !currentValue);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  const showGlobalAssists = pathname !== "/login" && pathname !== "/settings";

  return (
    <main
      id="main-content"
      dir={direction}
      lang={language}
      className="app-premium nestly-page-shell min-h-screen overflow-x-hidden text-[#1d1d1f]"
    >
      <a
        href="#main-content-body"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[120] focus:rounded-2xl focus:bg-[#111827] focus:px-5 focus:py-3 focus:text-sm focus:font-black focus:text-white focus:shadow-[0_16px_40px_rgba(15,23,42,0.24)]"
      >
        דלג לתוכן המרכזי
      </a>
      <FeedbackProvider>
        <TelemetryProvider>
          <AuthPromptProvider>
            <AuthStorageScope />
            <AppPreferencesApplier />
            <EnglishDomTranslator />
            <StorageErrorWatcher />
            <TopNavigation
              isSidebarCollapsed={isSidebarCollapsed}
              isMobileMenuOpen={isMobileMenuOpen}
              onToggleSidebar={toggleSidebar}
              onToggleMobileMenu={toggleMobileMenu}
              onCloseMobileMenu={closeMobileMenu}
            />

            <div className="nestly-app-content mx-auto flex w-full max-w-[1480px] gap-3 px-3 sm:px-4">
              <Sidebar
                isCollapsed={isSidebarCollapsed}
                isMobileOpen={isMobileMenuOpen}
                onNavigate={closeMobileMenu}
              />

              <div
                id="main-content-body"
                className="min-w-0 flex-1 animate-soft-in"
              >
                {children}
              </div>

              {showGlobalAssists && <SmartFamilyCenter />}
            </div>

            <DemoModeBanner />
            {pathname !== "/login" && <FirstRunWelcomePopup />}
            {pathname !== "/login" && <CommandPalette />}
            {pathname !== "/login" && <UniversalInboxLauncher />}
            {!isMobileMenuOpen && <MobileBottomNavigation />}
            {showGlobalAssists && <SmartNudgePopup />}
            {showGlobalAssists && <BirthdayWelcomePopup />}
          </AuthPromptProvider>
        </TelemetryProvider>
      </FeedbackProvider>
    </main>
  );
}
