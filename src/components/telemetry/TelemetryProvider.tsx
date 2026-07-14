"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  markAppOpened,
  trackPerformanceMetric,
  trackTelemetryError,
  trackTelemetryEvent,
} from "@/services/telemetry";

type TelemetryProviderProps = {
  children: ReactNode;
};

function getModuleFromPathname(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/shopping")) return "shopping";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/documents")) return "documents";
  if (pathname.startsWith("/health")) return "health";
  if (pathname.startsWith("/vehicles")) return "vehicles";
  if (pathname.startsWith("/family")) return "family";
  if (pathname.startsWith("/birthdays")) return "events";
  if (pathname.startsWith("/login") || pathname.startsWith("/security")) {
    return "auth";
  }
  if (pathname.startsWith("/settings")) return "settings";
  return "app";
}

export default function TelemetryProvider({ children }: TelemetryProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    markAppOpened();

    const navigationEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;

    if (navigationEntry) {
      trackPerformanceMetric(
        "page_load",
        navigationEntry.loadEventEnd || navigationEntry.duration,
        "app"
      );
    }

    function handleError(event: ErrorEvent) {
      trackTelemetryError("window-error", event.error ?? event.message);
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      trackTelemetryError("unhandled-rejection", event.reason);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    trackTelemetryEvent({
      name: "page_viewed",
      module: getModuleFromPathname(pathname),
      properties: { route: pathname },
    });
  }, [pathname]);

  return children;
}
