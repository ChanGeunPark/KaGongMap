import React, { useState } from "react";
import BottomSheetModal from "./BottomSheetModal";
import {
  addBookmark,
  bookmarkKeys,
  fetchMyBookmarkedCafes,
  removeBookmark,
} from "@/lib/api/bookmarks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyHolder from "../holder/EmptyHolder";
import { useCafeSelectionStore } from "@/stores/cafeSelectionStore";
import { CafeMarker } from "@/types/db";
import KGIcon from "../ui/KGIcon";
import { cls } from "@/lib/utils";
import { toast } from "react-toastify";
import { TbBookmark, TbBookmarkFilled } from "react-icons/tb";

interface BookmarkButtonSheetModalProps {
  showBookmarkModal: boolean;
  setShowBookmarkModal: (showBookmarkModal: boolean) => void;
}

function BookmarkButtonSheetModal(props: BookmarkButtonSheetModalProps) {
  const { showBookmarkModal, setShowBookmarkModal } = props;

  const { data: cafes = [], isLoading } = useQuery({
    queryKey: bookmarkKeys.cafes(),
    queryFn: fetchMyBookmarkedCafes,
  });

  return (
    <BottomSheetModal
      content={{
        title: "즐겨찾기",
        content: "즐겨찾기를 확인해주세요.",
        actions: [{ label: "확인", onClick: () => {} }],
      }}
      widthThreshold={2000}
      showModal={showBookmarkModal}
      showModalToggler={() => setShowBookmarkModal(false)}
    >
      <section className="p-4 min-h-[300px]">
        {isLoading && (
          <div className="flex flex-col gap-3">
            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-[104px] rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-[104px] rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        )}

        {!isLoading && cafes.length > 0 && (
          <div className="flex flex-col gap-3">
            {cafes.map((cafe) => (
              <BookmarkHolder
                key={cafe.id}
                cafe={cafe}
                onCloseSheet={() => setShowBookmarkModal(false)}
              />
            ))}
          </div>
        )}

        {!isLoading && cafes.length === 0 && (
          <EmptyHolder
            icon="bookmark"
            title="아직 즐겨찾기한 카페가 없어요."
            description="상세 모달에서 북마크 버튼을 누르면 여기에 모입니다."
          />
        )}
      </section>
    </BottomSheetModal>
  );
}

interface BookmarkHolderProps {
  cafe: CafeMarker;
  onCloseSheet: () => void;
}

function BookmarkHolder({ cafe, onCloseSheet }: BookmarkHolderProps) {
  const [bookmarked, setBookmarked] = useState(true);
  const queryClient = useQueryClient();
  const openCafePreview = useCafeSelectionStore(
    (state) => state.openCafePreview,
  );

  const bookmarkMutation = useMutation({
    mutationFn: async ({
      cafeId,
      nextBookmarked,
    }: {
      cafeId: string;
      nextBookmarked: boolean;
    }) => {
      if (nextBookmarked) await addBookmark(cafeId);
      else await removeBookmark(cafeId);

      return { cafeId, nextBookmarked };
    },
    onMutate: async ({ cafeId, nextBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: bookmarkKeys.me() });

      const previousIds =
        queryClient.getQueryData<string[]>(bookmarkKeys.me()) ?? [];
      const previousBookmarked = bookmarked;

      setBookmarked(nextBookmarked);
      queryClient.setQueryData<string[]>(
        bookmarkKeys.me(),
        nextBookmarked
          ? Array.from(new Set([...previousIds, cafeId]))
          : previousIds.filter((id) => id !== cafeId),
      );

      return { previousBookmarked, previousIds };
    },
    onError: (error, _variables, context) => {
      setBookmarked(context?.previousBookmarked ?? true);
      queryClient.setQueryData(bookmarkKeys.me(), context?.previousIds);
      toast.error(
        error instanceof Error
          ? error.message
          : "즐겨찾기 처리 중 오류가 발생했습니다.",
      );
    },
  });

  const visibleTags = cafe.tags.slice(0, 2);
  const hiddenTagCount = cafe.tags.length - visibleTags.length;

  const openDetail = () => {
    onCloseSheet();
    openCafePreview(cafe.id);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
      className={cls(
        "group cursor-pointer rounded-2xl border border-border-subtle bg-bg p-4 shadow-card",
        "transition-all duration-150 hover:-translate-y-px hover:border-border-medium hover:shadow-button",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="m-0 truncate text-[15px] font-semibold leading-tight tracking-[-0.2px] text-fg">
                {cafe.name}
              </h4>
              <p className="mt-1 truncate text-[12.5px] text-fg-3">
                {cafe.address}
              </p>
            </div>

            <button
              type="button"
              aria-label={
                bookmarked
                  ? `${cafe.name} 즐겨찾기 해제`
                  : `${cafe.name} 즐겨찾기 다시 추가`
              }
              aria-pressed={bookmarked}
              disabled={bookmarkMutation.isPending}
              onClick={(event) => {
                event.stopPropagation();
                bookmarkMutation.mutate({
                  cafeId: cafe.id,
                  nextBookmarked: !bookmarked,
                });
              }}
              className={cls(
                "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors",
                "disabled:cursor-default disabled:opacity-60",
                bookmarked
                  ? "bg-kg-amber-light text-kg-amber-deep hover:bg-kg-amber-light/80"
                  : "bg-gray-100 text-fg-3 hover:bg-gray-200",
              )}
            >
              {bookmarked ? (
                <TbBookmarkFilled size={20} />
              ) : (
                <TbBookmark size={20} strokeWidth={2.2} />
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-fg-3">
              <KGIcon name="heart" size={12} stroke={2} />
              {cafe.like_count.toLocaleString("ko-KR")}
            </span>
            {cafe.min_order_amount != null && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-fg-3">
                최소 {cafe.min_order_amount.toLocaleString("ko-KR")}원
              </span>
            )}
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-kg-amber-light px-2 py-0.5 text-[11px] font-medium text-kg-amber-deep"
              >
                {tag.replace(/_/g, " ")}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-fg-3">
                +{hiddenTagCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default BookmarkButtonSheetModal;
