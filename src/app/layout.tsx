import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { Layout } from "@/components/layout";
import { Providers } from "@/components/Providers";

import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://isabel-lake.vercel.app"
  ),
  title: {
    default: "ISABEL — Estación de Accesibilidad EDUKIDS",
    template: "%s | ISABEL",
  },
  description:
    "Estación inteligente de accesibilidad para EDUKIDS. Módulos de audición, habla, visual y movilidad.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/logo-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32.png"],
  },
  openGraph: {
    title: "ISABEL — Estación de Accesibilidad EDUKIDS",
    description:
      "Estación inteligente de accesibilidad para EDUKIDS. Módulos de audición, habla, visual y movilidad.",
    type: "website",
    locale: "es_GT",
    siteName: "ISABEL",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISABEL — Estación de Accesibilidad EDUKIDS",
    description:
      "Estación inteligente de accesibilidad para EDUKIDS. Módulos de audición, habla, visual y movilidad.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${geistMono.variable} h-full font-sans`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
