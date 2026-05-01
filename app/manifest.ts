import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BikeTracker",
    short_name: "BikeTracker",
    description: "Track fuel, maintenance & costs for your vehicle",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2563eb", // blue-600 — matches --primary; Android status bar colour
    categories: ["utilities", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable", // required for Android adaptive icons
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Android share target — enable "Share from Gallery" for receipts (Phase 5)
    // share_target: {
    //   action: "/api/share",
    //   method: "POST",
    //   enctype: "multipart/form-data",
    //   params: { files: [{ name: "file", accept: ["image/*"] }] },
    // },
  };
}
