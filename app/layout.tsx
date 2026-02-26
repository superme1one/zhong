import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 你画我猜",
  description: "在线你画我猜游戏：你来画，AI来猜",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
