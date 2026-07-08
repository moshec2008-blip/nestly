import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { brand } from "@/lib/branding";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${brand.productName} | ${brand.taglineHe}`,
  description:
    "מערכת משפחתית פרימיום לניהול כספים, משימות, מסמכים, בריאות וכל מה שקורה בבית.",
  icons: {
    icon: [{ url: "/nestly-logo.png", type: "image/png" }],
    shortcut: ["/nestly-logo.png"],
    apple: [{ url: "/nestly-logo.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a className="skip-link" href="#main-content">
          דלג לתוכן המרכזי
        </a>
        {children}
      </body>
    </html>
  );
}
