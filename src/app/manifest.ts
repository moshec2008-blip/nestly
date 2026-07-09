import type { MetadataRoute } from "next";
import { brand } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.productName} - ${brand.workspaceName}`,
    short_name: brand.productName,
    description: "A smart family management app for home, finance, tasks, documents and reminders.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#111827",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
