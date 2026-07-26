import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "hire Lab｜客製化手作掛繩與世界選物",
  description: "把喜歡的日常繫在身邊。客製化手作掛繩與海外選物平台。",
  openGraph: {
    title: "hire Lab｜客製化手作掛繩與世界選物",
    description: "把喜歡的日常繫在身邊。",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
