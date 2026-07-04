import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Layout } from "@/components/layout";
import { Providers } from "@/components/Providers";

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
  title: {
    default: "ISABEL — Estación de Accesibilidad EDUKIDS",
    template: "%s | ISABEL",
  },
  description:
    "Estación inteligente de accesibilidad para EDUKIDS. Módulos de audición, habla, visual y movilidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
