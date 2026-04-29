"use client";

import { useImageModalStore } from "@/stores/modalStore";
import { motion } from "framer-motion";
import Image from "next/image";

const ImageDetailModal = () => {
  const { imageUrl, showImageModal, setShowImageModal } = useImageModalStore();

  if (!showImageModal || !imageUrl) return null;
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute w-full h-full top-0 left-0 bg-black/70 z-100"
    >
      <div className="w-full h-full flex items-center justify-center">
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-[600px] max-w-[calc(100%-40px)] rounded-lg shrink-0 border border-zinc-100/30 bg-zinc-100/30 flex items-center justify-center text-zinc-400 cursor-pointer overflow-hidden aspect-[4/3] shadow-2xl"
          >
            <Image
              src={imageUrl}
              alt="placeholder"
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
        <button
          className="absolute top-0 right-0 w-full h-full"
          onClick={() => setShowImageModal(false)}
        />
      </div>
    </motion.section>
  );
};

export default ImageDetailModal;
