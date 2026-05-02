"use client";
import React from "react";
import ImageDetailModal from "./ImageDetailModal";
import ImageSubmitModal from "../cafe/detail/ImageSubmitModal";
import CafeEditModal from "../cafe/detail/CafeEditModal";
import AuthGate from "../auth/AuthGate";
import {
  useBookmarkModalStore,
  useCafeEditModalStore,
  useImageSubmitModalStore,
} from "@/stores/modalStore";
import { CafeWithDetail } from "@/types/db";
import BookmarkButtonSheetModal from "./BookmarkButtonSheetModal";

function GlobalModal() {
  const { showImageSubmitModal, cafeId, cafeName, setShowImageSubmitModal } =
    useImageSubmitModalStore();
  const { showCafeEditModal, cafe, setShowCafeEditModal } =
    useCafeEditModalStore();

  const { showBookmarkModal, setShowBookmarkModal } = useBookmarkModalStore();

  return (
    <>
      <ImageDetailModal />
      <ImageSubmitModal
        cafeId={cafeId ?? ""}
        cafeName={cafeName ?? ""}
        showModal={showImageSubmitModal}
        onClose={() => {
          setShowImageSubmitModal(false);
        }}
      />
      <CafeEditModal
        cafe={cafe as CafeWithDetail}
        showModal={showCafeEditModal}
        onClose={() => {
          setShowCafeEditModal(false);
        }}
      />
      <AuthGate />
      <BookmarkButtonSheetModal
        showBookmarkModal={showBookmarkModal}
        setShowBookmarkModal={setShowBookmarkModal}
      />
    </>
  );
}

export default GlobalModal;
