import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import GlobalModal from "@/components/modal/GlobalModal";
import { getSiteUrl } from "@/lib/siteUrl";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

const siteUrl = getSiteUrl();
const siteName = "카공맵";
const title = "카공맵 | 공부하기 좋은 카페 지도";
const description =
  "콘센트, 와이파이, 조용한 분위기, 24시간 운영 등 카공하기 좋은 카페를 지도에서 찾고 공유하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | 카공맵",
  },
  description,
  applicationName: siteName,
  keywords: [
    "카공맵",
    "카공",
    "카공 지도",
    "카페 지도",
    "공부하기 좋은 카페",
    "작업하기 좋은 카페",
    "콘센트 카페",
    "와이파이 카페",
    "조용한 카페",
    "노트북 카페",
    "24시간 카페",
    "카페 추천",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName,
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/images/logo.png",
        width: 954,
        height: 374,
        alt: "카공맵",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "map",
  appleWebApp: {
    capable: true,
    title: "카공맵",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ServiceWorkerRegister />
        <AuthProvider>
          <QueryProvider>
            {children}
            <BottomNavigation />
            <GlobalModal />
          </QueryProvider>
        </AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
