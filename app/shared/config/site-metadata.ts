import type { Metadata } from "next";

export const SITE_URL = "https://pesisir.id";

const OPEN_GRAPH_IMAGE = {
  url: "/logo-pesisir.png",
  width: 752,
  height: 468,
  alt: "Pesisir — Platform operasional PPJK dan freight forwarder",
} as const;

interface PageMetadataInput {
  title: string;
  description: string;
  path: `/${string}` | "/";
  keywords?: string[];
}

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
}: PageMetadataInput): Metadata {
  const socialTitle = `${title} | Pesisir`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: "Pesisir",
      locale: "id_ID",
      images: [OPEN_GRAPH_IMAGE],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OPEN_GRAPH_IMAGE.url],
    },
  };
}

export const homeSocialMetadata: Pick<
  Metadata,
  "alternates" | "openGraph" | "twitter"
> = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "Pesisir — Platform Operasional PPJK & Freight Forwarder",
    description:
      "Platform operasional untuk staf PPJK dan freight forwarder. Cek LARTAS batch dari Excel, kelola data shipment, dan ekstrak data B/L — semua dalam satu workspace.",
    url: "/",
    siteName: "Pesisir",
    locale: "id_ID",
    images: [OPEN_GRAPH_IMAGE],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pesisir — Platform Operasional PPJK & Freight Forwarder",
    description:
      "Platform operasional untuk staf PPJK dan freight forwarder. Cek LARTAS batch dari Excel, kelola data shipment, dan ekstrak data B/L — semua dalam satu workspace.",
    images: [OPEN_GRAPH_IMAGE.url],
  },
};
