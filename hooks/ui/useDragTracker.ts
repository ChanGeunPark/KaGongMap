import { RefObject, useEffect, useRef, useState } from "react";

export default function useDragTracker(
  active: boolean,
  dragRef: RefObject<HTMLElement | null>,
  blockScroll?: boolean,
) {
  const [isDown, setIsDown] = useState<boolean>(false);
  const [walkX, setWalkX] = useState<number>(0);
  const [walkY, setWalkY] = useState<number>(0);

  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const [previousActive, setPreviousActive] = useState<boolean>(active);
  const stateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
  });

  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (active) return;

    stateRef.current = { isDragging: false, startX: 0, startY: 0 };
  }, [active]);

  if (active !== previousActive) {
    setPreviousActive(active);

    if (!active) {
      setIsDown(false);
      setStartX(0);
      setStartY(0);
      setWalkX(0);
      setWalkY(0);
    }
  }

  useEffect(() => {
    const element = dragRef.current;
    if (!element) return;

    const getPosition = (
      event: MouseEvent | TouchEvent,
    ): { pageX: number; pageY: number } | null => {
      if ("pageX" in event && "pageY" in event) {
        return { pageX: event.pageX, pageY: event.pageY };
      }

      if (event.touches.length > 0) {
        return {
          pageX: event.touches[0].pageX,
          pageY: event.touches[0].pageY,
        };
      }

      return null;
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!activeRef.current) return;

      const position = getPosition(event);
      if (!position) return;

      const nextStartX = position.pageX - element.offsetLeft;
      const nextStartY = position.pageY - element.offsetTop;

      stateRef.current.isDragging = true;
      stateRef.current.startX = nextStartX;
      stateRef.current.startY = nextStartY;

      setIsDown(true);
      setStartX(nextStartX);
      setStartY(nextStartY);
    };

    const stopDragging = () => {
      stateRef.current.isDragging = false;
      setIsDown(false);
      setWalkX(0);
      setWalkY(0);
    };

    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
      if (!activeRef.current || !stateRef.current.isDragging) return;

      const position = getPosition(event);
      if (!position) return;

      if (blockScroll && event.cancelable) {
        event.preventDefault();
      }

      const currentX = position.pageX - element.offsetLeft;
      const currentY = position.pageY - element.offsetTop;

      setWalkX(currentX - stateRef.current.startX);
      setWalkY(currentY - stateRef.current.startY);
    };

    element.addEventListener("mousedown", handlePointerDown);
    element.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, {
      passive: !blockScroll,
    });
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);

    return () => {
      element.removeEventListener("mousedown", handlePointerDown);
      element.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
    };
  }, [dragRef, blockScroll, active]);

  if (!active || !isDown) {
    return { isDown: false, startX: 0, startY: 0, walkX: 0, walkY: 0 };
  }

  return { isDown, startX, startY, walkX, walkY };
}
