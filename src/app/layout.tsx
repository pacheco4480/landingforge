import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/action-feedback";

import "./globals.css";

export const metadata: Metadata = {
  title: "LandingForge",
  description: "Premium landing page platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
