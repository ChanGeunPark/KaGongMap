import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "카공맵",
  description: "공부하기 좋은 카페를 찾아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
