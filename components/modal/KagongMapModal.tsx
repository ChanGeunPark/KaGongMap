import { cls } from "@/lib/utils";
import React, { useEffect } from "react";
import KGIcon from "../ui/KGIcon";

interface KagongMapModalProps {
  showModal: boolean;
  showModalToggler: (e: boolean) => void;
  children?: React.ReactNode;
  isCloseButton?: boolean;
  zIndex?: number;
  title?: string | React.ReactNode;
  className?: string;
  blur?: boolean;
}

export default function KagongMapModal(props: KagongMapModalProps) {
  const {
    showModal,
    showModalToggler,
    children,
    title,
    zIndex,
    className,
    blur,
    isCloseButton = true,
  } = props;

  const z = zIndex ? zIndex : 200;

  useEffect(() => {
    if (showModal) {
      // 배경 스크롤 막기
      document.body.style.cssText = `
        position: fixed; 
        top: -${window.scrollY}px;
        overflow-y: scroll;
        width: 100%;`;
      return () => {
        const scrollY = document.body.style.top;
        document.body.style.cssText = "";
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      };
    }
  }, [showModal]);

  if (!showModal) {
    return <></>;
  }

  return (
    <>
      <div
        className={cls(
          "max-w-[650px] w-[calc(100%-40px)] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white overflow-hidden",
          "max-sm:px-2 flex justify-center items-center",
        )}
        style={{
          zIndex: z,
        }}
      >
        <div
          className={cls(
            "w-full max-h-[90vh] h-auto bg-white overflow-y-auto shadow-elevation02",
            "dark:bg-gray-850 dark:text-white",
            className ? className : "",
          )}
        >
          {isCloseButton && (
            <div className="w-full flex justify-between items-center px-4 py-3 sticky top-0 bg-white z-50">
              {title && typeof title === "string" && (
                <h4 className="text-xl font-semibold">{title}</h4>
              )}
              {title && typeof title !== "string" && title}

              <button
                type="button"
                className="cursor-pointer w-8 h-8 rounded-lg bg-gray-100 inline-flex items-center justify-center text-[13px] font-semibold text-fg-2 shrink-0"
                onClick={(e) => {
                  showModalToggler(false);
                  e.stopPropagation();
                }}
              >
                <KGIcon name="close" size={16} stroke={2} />
              </button>
            </div>
          )}

          <section className="content h-full overflow-y-auto p-4">
            {children}
          </section>
        </div>
      </div>

      {/* Drawer - dim */}
      <div
        className={cls(
          "fixed w-screen h-screen top-0 left-0 bg-[rgba(0,0,0,0.6)]",
          blur && "backdrop-blur-md",
        )}
        onClick={(e) => {
          showModalToggler(false);
          e.stopPropagation();
        }}
        style={{
          zIndex: z - 1,
        }}
      />
    </>
  );
}
