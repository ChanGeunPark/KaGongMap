"use client";
import React from "react";
import ImageDetailModal from "./ImageDetailModal";
import ImageSubmitModal from "../cafe/detail/ImageSubmitModal";
import CafeEditModal from "../cafe/detail/CafeEditModal";
import {
  useCafeEditModalStore,
  useImageSubmitModalStore,
} from "@/stores/modalStore";
import { CafeWithDetail } from "@/types/db";

function GlobalModal() {
  const { showImageSubmitModal, cafeId, cafeName, setShowImageSubmitModal } =
    useImageSubmitModalStore();
  const { showCafeEditModal, cafe, setShowCafeEditModal } =
    useCafeEditModalStore();

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
    </>
  );
}

export default GlobalModal;
