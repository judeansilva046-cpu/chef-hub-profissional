import type { Metadata } from "next";

import { RegisterSW } from "@/components/pwa/register-sw";
import { geistMono, geistSans } from "@/lib/fonts";

import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Chef Hub Profissional",
  description:
    "Plataforma de gestão inteligente para restaurantes, delivery, dark kitchens, padarias, confeitarias e pequenos produtores de alimentos.",
  applicationName: "Chef Hub Profissional",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Chef Hub Profissional",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
