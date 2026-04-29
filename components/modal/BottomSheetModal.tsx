import React, { ReactNode, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";

import { useWindowSize } from "@/hooks/useWindowSize";
import useDragTracker from "@/hooks/useDragTracker";
import { cls } from "@/lib/utils";
import { TbX } from "react-icons/tb";

interface ModalContentType {
  title: string;
  content: string;
  actions: {
    label: string;
    onClick: () => void;
  }[];
}

interface BottomSheetModalProps {
  content: ModalContentType;
  widthThreshold: number;
  showModal: boolean;
  showModalToggler: (next: boolean | React.MouseEvent<HTMLElement>) => void;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function BottomSheetModal(props: BottomSheetModalProps) {
  const {
    widthThreshold,
    showModal,
    showModalToggler,
    children,
    className,
    style,
  } = props;
  const { width: screenWidth } = useWindowSize();

  const touchRef = useRef<HTMLDivElement>(null);
  const { isDown, walkY } = useDragTracker(showModal, touchRef, true);
  const isBottom = useMemo(() => {
    if (screenWidth === undefined) return null;
    return Number(screenWidth) < widthThreshold;
  }, [screenWidth, widthThreshold]);
  const downwardWalkY = Math.max(0, walkY);

  useEffect(() => {
    const yThreshold = 150;
    if (isBottom && isDown && downwardWalkY > yThreshold) {
      showModalToggler(false);
    }
  }, [isBottom, isDown, downwardWalkY, showModalToggler]);

  useEffect(() => {
    if (!showModal) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showModal]);

  if (!showModal) {
    return null;
  }

  return (
    <>
      {/**
       * Drawer - main
       */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, damping: 100, stiffness: 100 }}
        className={cls(
          "z-99 fixed",
          `h-fit max-h-[75vh] overflow-y-auto max-w-[520px] w-full shadow-elevation03 scrollbar-default left-1/2 -translate-x-1/2 `,
          "bottom-0 rounded-tr-xl rounded-tl-xl shadow-lg",
        )}
        style={isDown ? { bottom: `-${downwardWalkY}px` } : {}}
      >
        <div
          style={{
            ...(style ? style : {}),
            ...{ touchAction: "none" },
            ...{ opacity: 1 * (1 - Math.max(0, downwardWalkY - 50) / 100) },
          }}
          className={cls(
            className ? className : "",
            "bg-white dark:bg-gray-850 dark:text-white relative ",
            // size
            `h-fit max-h-[75vh] overflow-y-auto scrollbar-hide w-full shadow-elevation03 `,
            // position
            "rounded-tr-xl rounded-tl-xl mx-auto",
          )}
        >
          {/**
           * Drawer - closeButton
           */}
          <div
            ref={touchRef}
            className={cls(
              " flex justify-center items-center cursor-pointer sticky top-0 z-50",
              "right-[20px]",
              isBottom
                ? " rounded-full bg-white py-4 dark:bg-gray-850"
                : "w-[28px] absolute h-[28px]",
            )}
            onClick={isBottom ? () => {} : showModalToggler}
          >
            {isBottom ? (
              <span className="block w-[60px] h-1 bg-gray-200 rounded-full"></span>
            ) : (
              <span
                className="block text-xl leading-none text-gray-700 dark:text-white"
                aria-hidden="true"
              >
                <TbX size={14} strokeWidth={2.5} />
              </span>
            )}
          </div>

          <section className="h-full overflow-y-auto ">{children}</section>
        </div>
      </motion.div>

      {/**
       * Drawer - dim
       */}
      <div
        className="z-98 fixed w-screen h-screen top-0 left-0 bg-black"
        style={{
          touchAction: "none",
          opacity: 0.4 * (1 - Math.max(0, downwardWalkY - 50) / 100),
        }}
        onClick={showModalToggler}
      />
      <div className="opacity-0 fixed bottom-[-5000px] right-[-5000px] top-[80px]">
        {/* let tailwind render -5000px */}
      </div>
    </>
  );
}
