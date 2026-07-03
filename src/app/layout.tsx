import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FH6 Photo Map",
  description: "Interactive static map for FH6 photography spots, uploads, and admin publishing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
