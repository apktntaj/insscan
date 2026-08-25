import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pesisir — Platform Operasional PPJK & Freight Forwarder",
    short_name: "Pesisir",
    description:
      "Platform operasional untuk staf PPJK dan freight forwarder.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#102A43",
    theme_color: "#102A43",
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
