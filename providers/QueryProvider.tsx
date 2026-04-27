"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,  // 5분
        gcTime: 1000 * 60 * 30,    // 30분 — 비활성 캐시 유지
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

// 브라우저에서는 모듈 레벨 싱글톤으로 유지
// → QueryProvider가 리마운트되어도 동일 인스턴스 재사용, 캐시 보존
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // 서버: 요청마다 새 인스턴스 (캐시 누수 방지)
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
