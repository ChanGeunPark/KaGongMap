import { RefObject, useEffect, useRef } from "react";

type DragState = {
  isDragging: boolean;
  startX: number;
  startScrollLeft: number;
};

export default function useDragScroll(dragRef: RefObject<HTMLElement | null>) {
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  });

  useEffect(() => {
    const element = dragRef.current;
    if (!element) return;

    const getPageX = (event: MouseEvent | TouchEvent): number | null => {
      if ("pageX" in event) {
        return event.pageX;
      }

      if (event.touches.length > 0) {
        return event.touches[0].pageX;
      }

      return null;
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const pageX = getPageX(event);
      if (pageX === null) return;

      dragStateRef.current.isDragging = true;
      dragStateRef.current.startX = pageX - element.offsetLeft;
      dragStateRef.current.startScrollLeft = element.scrollLeft;
    };

    const stopDragging = () => {
      dragStateRef.current.isDragging = false;
    };

    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
      if (!dragStateRef.current.isDragging) return;

      const pageX = getPageX(event);
      if (pageX === null) return;

      if (event.cancelable) event.preventDefault();

      const currentX = pageX - element.offsetLeft;
      const walk = currentX - dragStateRef.current.startX;
      element.scrollLeft = dragStateRef.current.startScrollLeft - walk;
    };

    element.addEventListener("mousedown", handlePointerDown);
    element.addEventListener("mousemove", handlePointerMove);
    element.addEventListener("touchstart", handlePointerDown);
    element.addEventListener("touchmove", handlePointerMove, { passive: false });
    element.addEventListener("mouseleave", stopDragging);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);

    return () => {
      element.removeEventListener("mousedown", handlePointerDown);
      element.removeEventListener("mousemove", handlePointerMove);
      element.removeEventListener("touchstart", handlePointerDown);
      element.removeEventListener("touchmove", handlePointerMove);
      element.removeEventListener("mouseleave", stopDragging);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
    };
  }, [dragRef]);
}
