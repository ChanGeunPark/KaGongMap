// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// vi.mock은 호이스팅되므로 mock 함수는 vi.hoisted로 만들어 참조 안전성을 확보한다.
const {
  useSessionMock,
  addBookmarkMock,
  removeBookmarkMock,
  fetchMyBookmarkedCafeIdsMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  addBookmarkMock: vi.fn(),
  removeBookmarkMock: vi.fn(),
  fetchMyBookmarkedCafeIdsMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("@/lib/api/bookmarks", () => ({
  bookmarkKeys: {
    all: ["bookmarks"] as const,
    me: () => ["bookmarks", "me"] as const,
    cafes: () => ["bookmarks", "cafes"] as const,
  },
  addBookmark: (...args: unknown[]) => addBookmarkMock(...args),
  removeBookmark: (...args: unknown[]) => removeBookmarkMock(...args),
  fetchMyBookmarkedCafeIds: () => fetchMyBookmarkedCafeIdsMock(),
}));

vi.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

import { useBookmarks } from "./useBookmarks";
import { useAuthGateStore } from "@/stores/modalStore";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

function setSession(status: "authenticated" | "unauthenticated") {
  useSessionMock.mockReturnValue({
    status,
    data: status === "authenticated" ? { user: { id: "u1" } } : null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // zustand store는 모듈 싱글톤이므로 테스트 사이 상태가 새지 않도록 reset
  useAuthGateStore.setState({ showAuthGate: false, message: null });
  // 기본값: 빈 즐겨찾기 — 개별 테스트에서 override
  fetchMyBookmarkedCafeIdsMock.mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("useBookmarks", () => {
  describe("비로그인 가드", () => {
    it("toggle 호출 시 openAuthGate만 열고 add/remove mutation은 실행되지 않는다", async () => {
      // 잡는 결함: "보는 건 자유, 참여는 로그인" 정책의 핵심 가드.
      // 비로그인 상태에서도 mutation을 보내도록 잘못 리팩토링하면 401 폭주.
      setSession("unauthenticated");
      const { Wrapper } = makeWrapper();
      const { result } = renderHook(() => useBookmarks(), { wrapper: Wrapper });

      act(() => {
        result.current.toggle("cafe-1");
      });

      expect(useAuthGateStore.getState().showAuthGate).toBe(true);
      expect(useAuthGateStore.getState().message).toBe(
        "즐겨찾기는 로그인 후 사용할 수 있어요.",
      );
      expect(addBookmarkMock).not.toHaveBeenCalled();
      expect(removeBookmarkMock).not.toHaveBeenCalled();
    });

    it("비로그인 상태에서는 fetchMyBookmarkedCafeIds 쿼리가 실행되지 않는다", async () => {
      // 잡는 결함: useQuery의 enabled: isAuthed 가드 제거 시 비로그인에서도
      // 매 마운트마다 401 fetch가 발생.
      setSession("unauthenticated");
      const { Wrapper } = makeWrapper();
      const { result } = renderHook(() => useBookmarks(), { wrapper: Wrapper });

      // 한 차례 마이크로태스크가 흘러도 호출이 없어야 한다
      await Promise.resolve();
      await Promise.resolve();

      expect(result.current.isAuthed).toBe(false);
      expect(result.current.count).toBe(0);
      expect(fetchMyBookmarkedCafeIdsMock).not.toHaveBeenCalled();
    });
  });

  describe("로그인 + 추가", () => {
    it("optimistic 업데이트로 캐시가 즉시 +1되고 isBookmarked가 true로 바뀐다", async () => {
      // 잡는 결함: onMutate 누락 — UI가 서버 응답 받을 때까지 깜빡임.
      // addBookmark는 영원히 pending이라 onSettled까지 가지 않는 상태에서 단언.
      setSession("authenticated");
      addBookmarkMock.mockReturnValue(new Promise(() => {})); // never resolves
      const { Wrapper } = makeWrapper();
      const { result } = renderHook(() => useBookmarks(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.count).toBe(0));

      act(() => {
        result.current.toggle("cafe-1");
      });

      await waitFor(() => {
        expect(result.current.isBookmarked("cafe-1")).toBe(true);
      });
      expect(result.current.count).toBe(1);
      expect(addBookmarkMock).toHaveBeenCalledWith("cafe-1");
      expect(removeBookmarkMock).not.toHaveBeenCalled();
    });

    it("성공 시 me + cafes 두 키 모두 invalidate한다", async () => {
      // 잡는 결함: cafes 키 invalidate 누락 → 즐겨찾기 페이지의 카페 목록이 stale.
      // bookmarkKeys.me()만 무효화되고 cafes는 남는 회귀를 잠근다.
      setSession("authenticated");
      addBookmarkMock.mockResolvedValue(undefined);

      const { Wrapper, queryClient } = makeWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useBookmarks(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.count).toBe(0));

      act(() => {
        result.current.toggle("cafe-1");
      });
      await waitFor(() => expect(result.current.isPending).toBe(false));

      const invalidatedKeys = invalidateSpy.mock.calls.map(
        (c) => (c[0] as { queryKey: readonly unknown[] }).queryKey,
      );
      expect(invalidatedKeys).toEqual(
        expect.arrayContaining([
          ["bookmarks", "me"],
          ["bookmarks", "cafes"],
        ]),
      );
    });
  });

  describe("로그인 + 제거", () => {
    it("이미 북마크한 카페 toggle 시 캐시에서 즉시 제거하고 removeBookmark만 호출한다", async () => {
      // 잡는 결함: wasBookmarked 분기 반전 (add/remove 함수 뒤바뀜).
      // 또는 optimistic에서 다른 카페까지 영향 — cafe-2는 그대로 남아야 함.
      setSession("authenticated");
      removeBookmarkMock.mockReturnValue(new Promise(() => {})); // pending
      fetchMyBookmarkedCafeIdsMock.mockResolvedValue(["cafe-1", "cafe-2"]);

      const { Wrapper } = makeWrapper();
      const { result } = renderHook(() => useBookmarks(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isBookmarked("cafe-1")).toBe(true);
      });

      act(() => {
        result.current.toggle("cafe-1");
      });

      await waitFor(() => {
        expect(result.current.isBookmarked("cafe-1")).toBe(false);
      });
      expect(result.current.isBookmarked("cafe-2")).toBe(true);
      expect(removeBookmarkMock).toHaveBeenCalledWith("cafe-1");
      expect(addBookmarkMock).not.toHaveBeenCalled();
    });
  });

  describe("실패 시 rollback", () => {
    it("addBookmark 실패 시 캐시를 이전 상태로 되돌리고 toast.error로 사용자에게 알린다", async () => {
      // 잡는 결함:
      //  1) onError에서 ctx.prev 복원 누락 → 낙관적 +1이 그대로 잔존
      //  2) toast.error 호출 누락 → 사용자에게 실패가 침묵됨
      setSession("authenticated");
      addBookmarkMock.mockRejectedValue(new Error("네트워크 오류"));

      const { Wrapper } = makeWrapper();
      const { result } = renderHook(() => useBookmarks(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.count).toBe(0));

      act(() => {
        result.current.toggle("cafe-1");
      });

      await waitFor(() => {
        expect(toastErrorMock).toHaveBeenCalledWith("네트워크 오류");
      });
      expect(result.current.isBookmarked("cafe-1")).toBe(false);
    });
  });
});
