import type { ReactNode } from "react";

import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-isabel-cyan-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-isabel-deep-900 focus:shadow-lg focus:outline-none"
      >
        Saltar al contenido principal
      </a>

      <Header />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6 lg:px-8 focus:outline-none"
      >
        {children}
      </main>
    </>
  );
}
