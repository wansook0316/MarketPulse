import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketPulse",
  description: "A simple market pulse web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
