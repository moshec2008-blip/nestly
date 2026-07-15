import type { SVGProps } from "react";

export type AppIconName =
  | "bell"
  | "calendar"
  | "car"
  | "check"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "dashboard"
  | "document"
  | "family"
  | "finance"
  | "health"
  | "home"
  | "knowledge"
  | "lock"
  | "settings"
  | "shopping"
  | "spark";

type AppIconProps = SVGProps<SVGSVGElement> & {
  name: AppIconName;
};

function getIconPath(name: AppIconName) {
  const paths: Record<AppIconName, string[]> = {
    bell: [
      "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9",
      "M13.73 21a2 2 0 0 1-3.46 0",
    ],
    calendar: [
      "M8 2v4",
      "M16 2v4",
      "M3 10h18",
      "M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    ],
    car: [
      "M5 17h14",
      "M7 17v2",
      "M17 17v2",
      "M6 13l2-6h8l2 6",
      "M4 13h16v4H4v-4Z",
    ],
    check: ["M20 6 9 17l-5-5"],
    "chevron-left": ["m15 18-6-6 6-6"],
    "chevron-right": ["m9 18 6-6-6-6"],
    close: ["M18 6 6 18", "m6 6 12 12"],
    dashboard: [
      "M4 13h7V4H4v9Z",
      "M13 20h7V4h-7v16Z",
      "M4 20h7v-5H4v5Z",
    ],
    document: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z",
      "M14 2v6h6",
      "M8 13h8",
      "M8 17h6",
    ],
    family: [
      "M16 11a4 4 0 1 0-8 0",
      "M4 21a8 8 0 0 1 16 0",
      "M19 8a3 3 0 0 1 2 5",
      "M5 8a3 3 0 0 0-2 5",
    ],
    finance: [
      "M12 2v20",
      "M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
    ],
    health: [
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
    ],
    home: [
      "M3 11 12 3l9 8",
      "M5 10v10h14V10",
      "M9 20v-6h6v6",
    ],
    knowledge: [
      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
      "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z",
      "M8 7h8",
      "M8 11h7",
      "M8 15h5",
    ],
    lock: [
      "M7 11V8a5 5 0 0 1 10 0v3",
      "M5 11h14v10H5V11Z",
      "M12 15v2",
    ],
    settings: [
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
      "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.38 1.06V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.06-.38H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .38-1.06V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.28.18.61.28.95.28H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z",
    ],
    shopping: [
      "M6 6h15l-2 8H8L6 6Z",
      "M6 6 5 2H2",
      "M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
      "M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
    ],
    spark: ["M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"],
  };

  return paths[name];
}

export default function AppIcon({
  name,
  className = "h-5 w-5",
  ...props
}: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      {getIconPath(name).map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}
